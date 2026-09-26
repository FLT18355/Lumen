/* ============================================================
   Lumen Player — 数据恢复与初始化
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

async function restoreFromDB() {
  try {
    const records = await dbGetAll(STORE_TRACKS);
    if (!records || records.length === 0) return;

    records.sort(function (a, b) { return (a.addedAt || 0) - (b.addedAt || 0); });

    for (const rec of records) {
      if (!rec.blob) continue;
      const url = URL.createObjectURL(rec.blob);
      const track = {
        id: rec.id,
        file: rec.blob,
        name: rec.name,
        title: rec.title,
        artist: rec.artist,
        url: url,
        duration: rec.duration || 0,
        format: rec.format,
        size: rec.size,
        addedAt: rec.addedAt,
        isFavorite: rec.isFavorite || favoriteSet.has(rec.name),
        hasLyric: false
      };
      state.tracks.push(track);
    }

    // 恢复歌词
    const lyrics = await loadAllLyrics();
    const lyricMap = {};
    lyrics.forEach(function (l) { lyricMap[l.trackId] = l.raw; });
    state.tracks.forEach(function (t) {
      if (lyricMap[t.id]) t.hasLyric = true;
    });

    // 按已保存的排序
    applySortIfNeeded();
    renderPlaylist();
    updateInfoPanel();

    showToast('已恢复 ' + state.tracks.length + ' 首音乐', 'success');
  } catch (err) {
    console.warn('恢复数据失败', err);
  }
}

/* ==========================================================
   初始化
   ========================================================== */
async function init() {
  // 初始化 IndexedDB
  try {
    db = await openDB();
  } catch (e) {
    console.warn('IndexedDB 不可用，使用 localStorage 降级', e);
    db = null;
  }

  // 加载设置
  await loadSettings();

  // 应用设置到 UI
  els.audio.volume = state.muted ? 0 : state.volume;
  updateVolumeUI();
  updatePlayButton();

  // 主题按钮状态
  if (state.shuffle) {
    els.btnShuffle.setAttribute('aria-pressed', 'true');
  }
  if (state.repeat !== 'off') {
    els.btnRepeat.setAttribute('aria-pressed', 'true');
    els.repeatIcon.className = state.repeat === 'one' ? 'ph ph-repeat-once' : 'ph ph-repeat';
    els.btnRepeat.title = state.repeat === 'one' ? '单曲循环' : '列表循环';
  }
  els.sortSelect.value = state.sortBy + '-' + state.sortDir;
  els.btnFilterFav.setAttribute('aria-pressed', state.filterFav ? 'true' : 'false');
  if (state.playbackRate !== 1) {
    els.speedGrid.querySelectorAll('.speed-btn').forEach(function (b) {
      b.setAttribute('aria-pressed',
        parseFloat(b.dataset.speed) === state.playbackRate ? 'true' : 'false');
    });
  }
  els.eqSwitch.setAttribute('aria-checked', state.eqEnabled ? 'true' : 'false');
  els.eqSliders.dataset.disabled = state.eqEnabled ? 'false' : 'true';
  state.eqGains.forEach(function (g, i) {
    const slider = document.querySelector('[data-eq-index="' + i + '"]');
    if (slider) slider.value = String(g);
    const label = document.querySelector('[data-eq-val="' + i + '"]');
    if (label) label.textContent = g > 0 ? '+' + g : String(g);
  });
  els.presetGrid.querySelectorAll('.preset-btn').forEach(function (b) {
    b.setAttribute('aria-pressed',
      b.dataset.preset === state.eqPreset ? 'true' : 'false');
  });
  els.vizModeBtns.forEach(function (b) {
    b.setAttribute('aria-pressed', b.dataset.viz === state.vizMode ? 'true' : 'false');
  });

  // 恢复曲目
  await restoreFromDB();

  // 初始化可视化
  requestAnimationFrame(function () {
    resizeCanvases();
    vizAnimFrame = requestAnimationFrame(drawViz);
  });
}

init();

// 清理
window.addEventListener('beforeunload', function () {
  state.tracks.forEach(function (t) {
    try { URL.revokeObjectURL(t.url); } catch (e) {}
  });
  cancelAnimationFrame(vizAnimFrame);
  clearInterval(sleepTimerInterval);
});
