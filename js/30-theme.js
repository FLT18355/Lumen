/* ============================================================
   Lumen Player — 主题切换
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function currentTheme() {
  return document.documentElement.dataset.theme === 'latte' ? 'latte' : 'mocha';
}
function syncThemeUI() {
  const theme = currentTheme();
  const isLatte = theme === 'latte';
  els.themeIcon.className = isLatte ? 'ph ph-sun' : 'ph ph-moon';
  els.themeName.textContent = isLatte ? 'Latte' : 'Mocha';
  els.btnTheme.setAttribute('aria-label',
    isLatte ? '切换到 Catppuccin Mocha 主题' : '切换到 Catppuccin Latte 主题');
}
function applyTheme(next) {
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('lumen-player-theme', next); } catch (e) {}
  syncThemeUI();
}
els.btnTheme.addEventListener('click', function (e) {
  const next = currentTheme() === 'mocha' ? 'latte' : 'mocha';
  if (!document.startViewTransition || mqReduce.matches) {
    applyTheme(next); return;
  }
  const x = (typeof e.clientX === 'number' && e.clientX !== 0)
    ? e.clientX : window.innerWidth / 2;
  const y = (typeof e.clientY === 'number' && e.clientY !== 0)
    ? e.clientY : window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const transition = document.startViewTransition(function () {
    applyTheme(next);
  });
  transition.ready.then(function () {
    document.documentElement.animate(
      { clipPath: [
          'circle(0px at ' + x + 'px ' + y + 'px)',
          'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'
      ] },
      { duration: 520, easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)' }
    );
  }).catch(function () {});
});
syncThemeUI();
