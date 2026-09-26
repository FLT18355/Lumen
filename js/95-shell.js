/* ============================================================
   Lumen Player — 标签页 / 拖放 / 快捷键 / 尺寸
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

document.querySelectorAll('.tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.setAttribute('aria-selected', 'false');
    });
    tab.setAttribute('aria-selected', 'true');
    const name = tab.dataset.tab;
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.toggle('is-active', p.dataset.panel === name);
    });
    if (name === 'info') updateInfoPanel();
  });
});

/* ==========================================================
   全局拖放
   ========================================================== */
let dragDepth = 0;
document.addEventListener('dragenter', function (e) {
  e.preventDefault();
  dragDepth++;
  document.body.classList.add('is-dragging-file');
});
document.addEventListener('dragover', function (e) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
});
document.addEventListener('dragleave', function (e) {
  e.preventDefault();
  dragDepth--;
  if (dragDepth <= 0) {
    dragDepth = 0;
    document.body.classList.remove('is-dragging-file');
  }
});
document.addEventListener('drop', function (e) {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('is-dragging-file');
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length) addFiles(dt.files);
});

/* ==========================================================
   键盘快捷键
   ========================================================== */
document.addEventListener('keydown', function (e) {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (els.lyricDialog.classList.contains('is-active')) return;

  const mod = e.metaKey || e.ctrlKey;

  if (mod && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
    e.preventDefault(); els.btnTheme.click(); return;
  }
  if (e.key === ' ' || e.code === 'Space') {
    // 焦点在按钮上时把空格还给按钮，避免「按一次触发两次」；
    // 已被其它处理器（如封面 role=button）消费的事件直接跳过。
    if (e.defaultPrevented) return;
    const el = e.target;
    const isButton = el && (el.tagName === 'BUTTON' ||
      (el.getAttribute && el.getAttribute('role') === 'button'));
    if (isButton) return;
    e.preventDefault(); togglePlay();
  } else if (e.key === 'ArrowRight' && e.shiftKey) {
    e.preventDefault(); nextTrack();
  } else if (e.key === 'ArrowLeft' && e.shiftKey) {
    e.preventDefault(); prevTrack();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    const dur = els.audio.duration || 0;
    if (dur > 0) els.audio.currentTime = Math.min(dur, els.audio.currentTime + 5);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    els.audio.currentTime = Math.max(0, els.audio.currentTime - 5);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault(); setVolume(state.volume + 0.05);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault(); setVolume(state.volume - 0.05);
  } else if (e.key === 'm' || e.key === 'M') {
    els.btnMute.click();
  } else if (e.key === 'f' || e.key === 'F') {
    if (state.fullscreenOpen) closeFullscreen();
    else openFullscreen();
  } else if (e.key === 'l' || e.key === 'L') {
    els.btnViewLyric.click();
  }
});

/* ==========================================================
   窗口尺寸
   ========================================================== */
let resizeTimer = 0;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeCanvases, 150);
});
