/* ============================================================
   Lumen Player — 自定义字体
   ------------------------------------------------------------
   允许用户上传 .ttf / .woff，通过 FontFace API 注册后插到
   --font-sans 的最前面（见 css/tokens.css 的 --font-user）。

   持久化：字体二进制存进 IndexedDB 的 settings store
   （key = 'custom-font'），刷新 / 重开浏览器后自动重新注册并
   应用，无需再次上传。IndexedDB 不可用时降级到 localStorage
   （base64，有体积上限），两条路都走不通才提示「仅本次会话生效」。
   ============================================================ */

'use strict';

const FONT_STORE_KEY = 'custom-font';      // IndexedDB settings store 里的主键
const FONT_LOCAL_KEY = 'lumen-player-font'; // localStorage 降级键
const FONT_FAMILY = 'LumenUserFont';        // 注册到 FontFaceSet 的族名
const FONT_MAX_BYTES = 8 * 1024 * 1024;     // 单个字体上限 8 MB
const FONT_LOCAL_MAX = 1024 * 1024;         // localStorage 降级时的上限 1 MB

let userFontFace = null;

/* ==========================================================
   格式识别 —— 读文件头，而不是信扩展名
   ========================================================== */
function detectFontFormat(buf) {
  if (!buf || buf.byteLength < 4) return '';
  const b = new Uint8Array(buf, 0, 4);
  const tag = String.fromCharCode(b[0], b[1], b[2], b[3]);
  if (tag === 'wOFF') return 'woff';
  if (tag === 'wOF2') return 'woff2';
  if (tag === 'OTTO') return 'otf';
  if (tag === 'true' || tag === 'ttcf') return 'ttf';
  if (b[0] === 0x00 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x00) return 'ttf';
  return '';
}

/* ==========================================================
   注册 / 应用
   ========================================================== */
async function loadFontFace(data, family) {
  const face = new FontFace(family, data);
  // swap：即便在字体就绪前发生重绘，也只是短暂回落，不会出现隐形文字
  face.display = 'swap';
  return await face.load();   // load() 只加载，不会自动进 FontFaceSet
}

function applyUserFont(family) {
  document.documentElement.style.setProperty('--font-user', '"' + family + '"');
}

function clearUserFont() {
  document.documentElement.style.removeProperty('--font-user');
}

/* ==========================================================
   界面状态
   ========================================================== */
function setFontUI(name, isCustom) {
  els.fontName.textContent = name;
  els.fontName.classList.toggle('is-custom', !!isCustom);
  els.btnFontClear.disabled = !isCustom;
}

/* ==========================================================
   base64 转换（仅供 localStorage 降级使用，分块避免爆栈）
   ========================================================== */
function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function base64ToBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/* ==========================================================
   持久化
   ========================================================== */
async function persistFont(record) {
  if (db) {
    try {
      await dbPut(STORE_SETTINGS, record);
      // 主存成功就不再保留降级副本，避免两份数据不一致
      try { localStorage.removeItem(FONT_LOCAL_KEY); } catch (e) {}
      return 'db';
    } catch (e) {
      console.warn('字体写入 IndexedDB 失败', e);
    }
  }
  try {
    if (record.data.byteLength <= FONT_LOCAL_MAX) {
      localStorage.setItem(FONT_LOCAL_KEY, JSON.stringify({
        name: record.name,
        family: record.family,
        format: record.format,
        b64: bufferToBase64(record.data)
      }));
      return 'local';
    }
  } catch (e) {
    console.warn('字体写入 localStorage 失败', e);
  }
  return 'none';
}

async function readStoredFont() {
  if (db) {
    try {
      const row = await dbGet(STORE_SETTINGS, FONT_STORE_KEY);
      if (row && row.data && row.data.byteLength) return row;
    } catch (e) {}
  }
  try {
    const raw = localStorage.getItem(FONT_LOCAL_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && o.b64) {
        return {
          name: o.name,
          family: o.family || FONT_FAMILY,
          format: o.format,
          data: base64ToBuffer(o.b64)
        };
      }
    }
  } catch (e) {}
  return null;
}

async function removeStoredFont() {
  if (db) {
    try { await dbDelete(STORE_SETTINGS, FONT_STORE_KEY); } catch (e) {}
  }
  try { localStorage.removeItem(FONT_LOCAL_KEY); } catch (e) {}
}

/* ==========================================================
   启动时恢复
   ========================================================== */
async function restoreCustomFont() {
  const rec = await readStoredFont();
  if (!rec) { setFontUI('系统默认', false); return; }

  const family = rec.family || FONT_FAMILY;
  try {
    const face = await loadFontFace(rec.data, family);
    if (userFontFace) { try { document.fonts.delete(userFontFace); } catch (e) {} }
    document.fonts.add(face);
    userFontFace = face;
    applyUserFont(family);
    setFontUI(rec.name || '自定义字体', true);
  } catch (e) {
    // 存档损坏 / 浏览器不支持：清掉，避免每次启动都失败
    console.warn('自定义字体恢复失败，已清除存档', e);
    await removeStoredFont();
    clearUserFont();
    setFontUI('系统默认', false);
  }
}

/* ==========================================================
   上传 / 移除
   ========================================================== */
async function handleFontFile(file) {
  if (!file) return;
  if (file.size > FONT_MAX_BYTES) {
    showToast('字体文件过大（上限 8 MB）', 'error');
    return;
  }

  let buf;
  try {
    buf = await file.arrayBuffer();
  } catch (e) {
    showToast('字体读取失败', 'error');
    return;
  }

  const format = detectFontFormat(buf);
  if (format === 'woff2') {
    showToast('暂不支持 WOFF2，请改用 TTF 或 WOFF', 'error');
    return;
  }
  if (format !== 'ttf' && format !== 'woff') {
    showToast('无法识别该字体，仅支持 TTF / WOFF', 'error');
    return;
  }

  // 先把新字面加载好，成功后再换掉旧的：失败时不会把可用字体弄丢
  let face;
  try {
    face = await loadFontFace(buf, FONT_FAMILY);
  } catch (e) {
    showToast('字体解析失败，请确认文件完整', 'error');
    return;
  }

  if (userFontFace) { try { document.fonts.delete(userFontFace); } catch (e) {} }
  document.fonts.add(face);
  userFontFace = face;
  applyUserFont(FONT_FAMILY);

  const name = String(file.name || '自定义字体').replace(/\.[^.]+$/, '') || '自定义字体';
  const where = await persistFont({
    key: FONT_STORE_KEY,
    name: name,
    family: FONT_FAMILY,
    format: format,
    data: buf
  });

  setFontUI(name, true);

  if (where === 'none') {
    showToast('已应用「' + name + '」，但浏览器存储不可用，仅本次会话生效', 'error');
  } else {
    showToast('已应用并保存字体：' + name, 'success');
  }
}

async function handleFontClear() {
  await removeStoredFont();
  if (userFontFace) {
    try { document.fonts.delete(userFontFace); } catch (e) {}
    userFontFace = null;
  }
  clearUserFont();
  setFontUI('系统默认', false);
  showToast('已恢复默认字体', 'success');
}

/* ==========================================================
   绑定
   ========================================================== */
els.btnFontUpload.addEventListener('click', function () {
  els.fontInput.click();
});

els.fontInput.addEventListener('change', function () {
  const file = els.fontInput.files && els.fontInput.files[0];
  // 先清空 input，这样连续选同一个文件也能再次触发 change
  els.fontInput.value = '';
  handleFontFile(file);
});

els.btnFontClear.addEventListener('click', handleFontClear);

setFontUI('系统默认', false);
