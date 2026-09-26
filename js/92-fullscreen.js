/* ============================================================
   Lumen Player — 全屏可视化
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。

   退出全屏的三个入口：左上「返回」按钮、右上「关闭」按钮、
   Esc 键。此前按钮失效的根因在 CSS 层级（.fs-content 覆盖
   了按钮），见 css/fullscreen.css 的修复记录。
   ============================================================ */

'use strict';

/* 记住进入全屏前的焦点，退出时归还给键盘用户 */
let fsReturnFocus = null;

/* 全屏是模态层：让背景不可聚焦、不可点击，兑现 aria-modal="true"。
   inert 在旧浏览器上会被忽略，不会造成副作用。 */
function setBackgroundInert(on) {
  const kids = document.body.children;
  for (let i = 0; i < kids.length; i++) {
    const el = kids[i];
    if (el === els.fullscreenViz || el === els.audio) continue;
    if (on) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }
}

function openFullscreen() {
  if (state.currentIndex < 0) return;
  state.fullscreenOpen = true;
  fsReturnFocus = document.activeElement;
  els.fullscreenViz.classList.add('is-active');
  setBackgroundInert(true);

  const track = state.tracks[state.currentIndex];
  els.fsTitle.textContent = track.title;
  els.fsArtist.textContent = track.artist;

  if (!els.coverArt.hidden && els.coverArt.src) {
    els.fsCover.src = els.coverArt.src;
    els.fsCover.classList.add('is-visible');
    els.fsCoverPlaceholder.style.display = 'none';
    els.fsBackdrop.style.backgroundImage = 'url(' + els.coverArt.src + ')';
  } else {
    els.fsCover.classList.remove('is-visible');
    els.fsCoverPlaceholder.style.display = 'grid';
    els.fsBackdrop.style.backgroundImage = '';
  }

  updateFullscreenLyric();
  requestAnimationFrame(function () {
    resizeCanvases();
    // 让键盘 / 读屏用户一进来就能命中「返回」
    try { els.fsBack.focus({ preventScroll: true }); }
    catch (e) { try { els.fsBack.focus(); } catch (e2) {} }
  });
}

function closeFullscreen() {
  if (!state.fullscreenOpen) return;
  state.fullscreenOpen = false;
  els.fullscreenViz.classList.remove('is-active');
  setBackgroundInert(false);

  // 若用户另外触发了浏览器原生全屏，一并退出，避免「关不掉」
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) {
      try {
        const p = exit.call(document);
        if (p && typeof p.catch === 'function') p.catch(function () {});
      } catch (e) {}
    }
  }

  if (fsReturnFocus && typeof fsReturnFocus.focus === 'function') {
    try { fsReturnFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  fsReturnFocus = null;
}

els.coverWrap.addEventListener('click', openFullscreen);
els.coverWrap.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    openFullscreen();
  }
});
els.btnFullscreen.addEventListener('click', openFullscreen);
els.fsBack.addEventListener('click', closeFullscreen);
els.fsClose.addEventListener('click', closeFullscreen);

document.addEventListener('keydown', function (e) {
  if (!state.fullscreenOpen) return;
  if (e.key === 'Escape' || e.key === 'Esc') {
    e.preventDefault();
    closeFullscreen();
  }
});
