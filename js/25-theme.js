/* ============================================================
   Lumen Player — 光谱条与收藏持久化
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

els.spectrum.innerHTML = PALETTE
  .map((n) => '<span style="background: var(--ctp-' + n + ')"></span>')
  .join('');

/* ==========================================================
   收藏持久化
   ========================================================== */
function loadFavorites() {
  try {
    const raw = localStorage.getItem(favStorageKey);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) { return new Set(); }
}
function saveFavorites() {
  try {
    const favs = state.tracks.filter((t) => t.isFavorite).map((t) => t.name);
    localStorage.setItem(favStorageKey, JSON.stringify(favs));
  } catch (e) {}
}
const favoriteSet = loadFavorites();
