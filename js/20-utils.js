/* ============================================================
   Lumen Player — 工具函数与 LRC 解析
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return c === '&' ? '&amp;' : c === '<' ? '&lt;'
      : c === '>' ? '&gt;' : '&quot;';
  });
}
function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}
function fmtLongTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  return m + ':' + (s < 10 ? '0' : '') + s;
}
function fmtBytes(n) {
  if (!n || n < 0) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function getExt(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function parseTrackName(fileName) {
  let base = fileName.replace(/\.[^.]+$/, '');
  base = base.replace(/^\d{1,3}[\s._-]+/, '');
  let title = base, artist = '';
  if (base.indexOf(' - ') > 0) {
    const parts = base.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }
  return { title: title || fileName, artist: artist || '未知艺术家' };
}

function showToast(text, type) {
  els.toastText.textContent = text;
  els.toastIcon.className = 'ph ' +
    (type === 'error' ? 'ph-warning-circle' : 'ph-check-circle');
  els.toast.className = 'toast is-visible ' +
    (type === 'error' ? 'is-error' : 'is-success');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () {
    els.toast.className = 'toast';
  }, 2400);
}

/* ==========================================================
   LRC 歌词解析器
   ========================================================== */
function parseLRC(text) {
  if (!text) return { lines: [], raw: '', meta: {}, offset: 0 };

  const lines = [];
  const meta = {};
  let offset = 0;

  // 统一换行符
  text = text.replace(/\r\n?/g, '\n');

  const rawLines = text.split('\n');

  // 时间标签正则: [mm:ss.xx] 或 [mm:ss.fff] 或 [hh:mm:ss.xx]
  const TIME_RE = /\[(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
  // 字词标签 <mm:ss.xx>
  const WORD_RE = /<(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?>/g;
  // ID 标签 [xx:yy]
  const ID_RE = /^\[([a-zA-Z]+):([^\]]*)\]$/;

  rawLines.forEach(function (raw) {
    const line = raw.trim();
    if (!line) return;

    // ID 标签
    const idMatch = ID_RE.exec(line);
    if (idMatch) {
      const key = idMatch[1].toLowerCase();
      const val = idMatch[2].trim();
      meta[key] = val;
      if (key === 'offset') {
        const n = parseInt(val, 10);
        if (isFinite(n)) offset = n;
      }
      return;
    }

    // 时间标签 + 歌词文本
    TIME_RE.lastIndex = 0;
    const times = [];
    let m;
    while ((m = TIME_RE.exec(line)) !== null) {
      const mm = parseInt(m[1], 10) || 0;
      const ss = parseInt(m[2], 10) || 0;
      let ms = 0;
      if (m[3]) {
        // 两位为百分秒，三位为毫秒
        ms = m[3].length === 3
          ? parseInt(m[3], 10)
          : parseInt(m[3], 10) * 10;
      }
      times.push(mm * 60 + ss + ms / 1000);
    }

    if (times.length === 0) return;

    // 歌词文本 = 去掉时间标签后的内容
    let lyricText = line.replace(TIME_RE, '').trim();
    // 去掉字词标签（如果存在）
    lyricText = lyricText.replace(WORD_RE, '').trim();

    // 过滤纯元数据行
    if (!lyricText && times.length === 0) return;

    times.forEach(function (t) {
      lines.push({
        time: t,
        text: lyricText
      });
    });
  });

  // 按时间排序
  lines.sort(function (a, b) { return a.time - b.time; });

  // 应用 offset（毫秒转秒，正值表示整体提前）
  if (offset !== 0) {
    const offsetSec = -offset / 1000;
    lines.forEach(function (l) { l.time += offsetSec; });
  }

  // 过滤负数时间
  const filtered = lines.filter(function (l) { return l.time >= 0; });

  return {
    lines: filtered,
    raw: text,
    meta: meta,
    offset: offset
  };
}

function findCurrentLyricLine(lyric, currentTime) {
  if (!lyric || !lyric.lines || lyric.lines.length === 0) return -1;
  const lines = lyric.lines;
  // 二分查找
  let lo = 0, hi = lines.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= currentTime) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}
