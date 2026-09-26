/* ============================================================
   Lumen Player — 按钮绑定 / 搜索排序 / 可视化模式 / 视图切换
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

els.btnPlay.addEventListener('click', togglePlay);
els.btnPrev.addEventListener('click', prevTrack);
els.btnNext.addEventListener('click', nextTrack);

els.btnShuffle.addEventListener('click', function () {
  state.shuffle = !state.shuffle;
  this.setAttribute('aria-pressed', state.shuffle ? 'true' : 'false');
  saveSettings();
  showToast(state.shuffle ? '随机播放开启' : '随机播放关闭', 'success');
});

els.btnRepeat.addEventListener('click', function () {
  if (state.repeat === 'off') state.repeat = 'all';
  else if (state.repeat === 'all') state.repeat = 'one';
  else state.repeat = 'off';

  if (state.repeat === 'off') {
    els.repeatIcon.className = 'ph ph-repeat';
    this.setAttribute('aria-pressed', 'false');
    this.title = '不循环';
    showToast('不循环', 'success');
  } else if (state.repeat === 'all') {
    els.repeatIcon.className = 'ph ph-repeat';
    this.setAttribute('aria-pressed', 'true');
    this.title = '列表循环';
    showToast('列表循环', 'success');
  } else {
    els.repeatIcon.className = 'ph ph-repeat-once';
    this.setAttribute('aria-pressed', 'true');
    this.title = '单曲循环';
    showToast('单曲循环', 'success');
  }
  saveSettings();
});

els.btnAdd.addEventListener('click', function () { els.fileInput.click(); });
els.fileInput.addEventListener('change', function () {
  if (this.files && this.files.length) addFiles(this.files);
  this.value = '';
});

/* ==========================================================
   搜索 / 排序 / 筛选
   ========================================================== */
let searchDebounce = 0;
els.searchInput.addEventListener('input', function () {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(function () {
    state.searchQuery = els.searchInput.value;
    renderPlaylist();
  }, 150);
});

els.sortSelect.addEventListener('change', function () {
  const val = els.sortSelect.value;
  const parts = val.split('-');
  state.sortBy = parts[0];
  state.sortDir = parts[1];
  applySortIfNeeded();
  renderPlaylist();
  saveSettings();
});

els.btnFilterFav.addEventListener('click', function () {
  state.filterFav = !state.filterFav;
  this.setAttribute('aria-pressed', state.filterFav ? 'true' : 'false');
  renderPlaylist();
  saveSettings();
});

els.btnClearAll.addEventListener('click', function () {
  if (state.tracks.length === 0) return;
  if (!confirm('确定清空整个播放列表？此操作不可恢复。')) return;
  state.tracks.forEach(function (t) {
    try { URL.revokeObjectURL(t.url); } catch (e) {}
  });
  state.tracks = [];
  state.currentIndex = -1;
  stopAndReset();
  dbClear(STORE_TRACKS).catch(function(){});
  dbClear(STORE_LYRICS).catch(function(){});
  renderPlaylist();
  updateInfoPanel();
  showToast('播放列表已清空', 'success');
});

/* ==========================================================
   可视化模式
   ========================================================== */
els.vizModeBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    state.vizMode = btn.dataset.viz;
    els.vizModeBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    saveSettings();
  });
});

/* ==========================================================
   视图切换
   ========================================================== */
els.btnViewPlayer.addEventListener('click', function () {
  state.lyricViewActive = false;
  els.lyricView.classList.remove('is-active');
  els.btnViewPlayer.setAttribute('aria-pressed', 'true');
  els.btnViewLyric.setAttribute('aria-pressed', 'false');
});

els.btnViewLyric.addEventListener('click', function () {
  if (state.lyricViewActive) {
    // 关闭歌词视图
    state.lyricViewActive = false;
    els.lyricView.classList.remove('is-active');
    els.btnViewPlayer.setAttribute('aria-pressed', 'true');
    els.btnViewLyric.setAttribute('aria-pressed', 'false');
  } else {
    state.lyricViewActive = true;
    els.lyricView.classList.add('is-active');
    els.btnViewPlayer.setAttribute('aria-pressed', 'false');
    els.btnViewLyric.setAttribute('aria-pressed', 'true');
  }
});
