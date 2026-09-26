/* ============================================================
   Lumen Player — 排序与播放列表渲染
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });

function applySortIfNeeded() {
  const currentId = state.currentIndex >= 0 ? state.tracks[state.currentIndex].id : null;
  const key = state.sortBy;
  const dir = state.sortDir;

  state.tracks.sort(function (a, b) {
    let cmp = 0;
    if (key === 'name') cmp = collator.compare(a.title, b.title);
    else if (key === 'duration') cmp = (a.duration || 0) - (b.duration || 0);
    else cmp = (a.addedAt || 0) - (b.addedAt || 0);
    return dir === 'asc' ? cmp : -cmp;
  });

  if (currentId !== null) {
    const idx = state.tracks.findIndex(function (t) { return t.id === currentId; });
    if (idx >= 0) state.currentIndex = idx;
  }
}

/* ==========================================================
   播放列表渲染
   ========================================================== */
function getFilteredIndices() {
  const q = state.searchQuery.toLowerCase().trim();
  const out = [];
  state.tracks.forEach(function (t, realIdx) {
    if (q && !(t.title.toLowerCase().indexOf(q) >= 0 ||
               t.artist.toLowerCase().indexOf(q) >= 0)) return;
    if (state.filterFav && !t.isFavorite) return;
    out.push(realIdx);
  });
  return out;
}

function renderPlaylist() {
  const indices = getFilteredIndices();

  if (state.tracks.length === 0) {
    els.playlistBody.innerHTML = '';
    els.playlistBody.appendChild(els.playlistEmpty);
    els.playlistEmpty.hidden = false;
    return;
  }
  els.playlistEmpty.hidden = true;

  if (indices.length === 0) {
    els.playlistBody.innerHTML =
      '<div class="playlist-empty">' +
      '<i class="ph ph-magnifying-glass" aria-hidden="true"></i>' +
      '<p>没有匹配的曲目</p></div>';
    return;
  }

  let html = '';
  indices.forEach(function (realIdx, displayIdx) {
    const t = state.tracks[realIdx];
    const active = realIdx === state.currentIndex;
    const isPlayingThis = active && state.isPlaying;

    html += '<div class="track-item' + (active ? ' is-active' : '') + '" ' +
            'data-index="' + realIdx + '" draggable="true" ' +
            'role="button" tabindex="0" ' +
            'aria-label="' + esc(t.title) + ' - ' + esc(t.artist) + '">' +
      '<div class="ti-index">' +
        (isPlayingThis
          // 静态圆角三角（圆角来自同色描边 + stroke-linejoin: round），尖角指向曲名
          ? '<svg class="ti-playing" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
            '<path d="M4 2.4 L9.8 6 L4 9.6 Z" fill="currentColor" stroke="currentColor" ' +
            'stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
            '</svg>'
          : '<span>' + (displayIdx + 1) + '</span>') +
      '</div>' +
      '<div class="ti-meta">' +
        '<p class="ti-title">' + esc(t.title) + '</p>' +
        '<p class="ti-sub">' + esc(t.artist) + ' · ' + esc(t.format) + '</p>' +
      '</div>' +
      '<span class="ti-duration">' +
        (t.duration ? fmtTime(t.duration) : '--:--') +
      '</span>' +
      '<button class="ti-btn ti-lyric' + (t.hasLyric ? ' has-lyric' : '') + '" ' +
              'type="button" data-lyric="' + realIdx + '" ' +
              'aria-label="' + (t.hasLyric ? '查看歌词' : '添加歌词') + '">' +
        '<i class="ph ph-text-align-center" aria-hidden="true"></i>' +
      '</button>' +
      '<button class="ti-btn ti-fav' + (t.isFavorite ? ' is-active' : '') + '" ' +
              'type="button" data-fav="' + realIdx + '" ' +
              'aria-label="' + (t.isFavorite ? '取消收藏' : '收藏') + '">' +
        '<i class="ph ph-heart" aria-hidden="true"></i>' +
      '</button>' +
      '<button class="ti-btn ti-remove" type="button" data-remove="' + realIdx + '" ' +
              'aria-label="移除 ' + esc(t.title) + '">' +
        '<i class="ph ph-x" aria-hidden="true"></i>' +
      '</button>' +
    '</div>';
  });

  els.playlistBody.innerHTML = html;
  bindPlaylistEvents();
}

function bindPlaylistEvents() {
  els.playlistBody.querySelectorAll('.track-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      if (e.target.closest('[data-remove]') ||
          e.target.closest('[data-fav]') ||
          e.target.closest('[data-lyric]')) return;
      const idx = parseInt(item.dataset.index, 10);
      if (state.currentIndex === idx && state.isPlaying) togglePlay();
      else loadTrack(idx, true);
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); item.click();
      }
    });

    item.addEventListener('dragstart', function (e) {
      item.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.index);
    });
    item.addEventListener('dragend', function () {
      item.classList.remove('is-dragging');
      els.playlistBody.querySelectorAll('.track-item').forEach(function (n) {
        n.classList.remove('is-drag-over');
      });
    });
    item.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      item.classList.add('is-drag-over');
    });
    item.addEventListener('dragleave', function () {
      item.classList.remove('is-drag-over');
    });
    item.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      item.classList.remove('is-drag-over');
      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const to = parseInt(item.dataset.index, 10);
      if (isFinite(from) && isFinite(to) && from !== to) moveTrack(from, to);
    });
  });

  els.playlistBody.querySelectorAll('[data-fav]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFavorite(parseInt(btn.dataset.fav, 10));
    });
  });

  els.playlistBody.querySelectorAll('[data-lyric]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.lyric, 10);
      openLyricDialogForIndex(idx);
    });
  });

  els.playlistBody.querySelectorAll('[data-remove]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      removeTrack(parseInt(btn.dataset.remove, 10));
    });
  });
}

function moveTrack(from, to) {
  const item = state.tracks.splice(from, 1)[0];
  state.tracks.splice(to, 0, item);
  if (state.currentIndex === from) state.currentIndex = to;
  else if (from < state.currentIndex && to >= state.currentIndex) state.currentIndex--;
  else if (from > state.currentIndex && to <= state.currentIndex) state.currentIndex++;
  renderPlaylist();
}

async function removeTrack(idx) {
  const track = state.tracks[idx];
  if (!track) return;
  try { URL.revokeObjectURL(track.url); } catch (e) {}
  await dbDelete(STORE_TRACKS, track.id).catch(function () {});
  await deleteLyricForTrack(track.id);
  state.tracks.splice(idx, 1);

  if (state.tracks.length === 0) {
    stopAndReset();
    state.currentIndex = -1;
  } else if (idx === state.currentIndex) {
    loadTrack(Math.min(idx, state.tracks.length - 1), state.isPlaying);
  } else if (idx < state.currentIndex) {
    state.currentIndex--;
  }
  renderPlaylist();
  updateInfoPanel();
  showToast('已移除', 'success');
}

function toggleFavorite(idx) {
  const track = state.tracks[idx];
  if (!track) return;
  track.isFavorite = !track.isFavorite;
  if (track.isFavorite) favoriteSet.add(track.name);
  else favoriteSet.delete(track.name);
  saveFavorites();
  renderPlaylist();
  updateInfoPanel();
  showToast(track.isFavorite ? '已加入收藏' : '已取消收藏', 'success');
}
