/* ============================================================
   Lumen Player — 歌词 UI
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function setCurrentLyric(rawText) {
  if (!rawText) {
    state.currentLyric = null;
    state.currentLyricLine = -1;
    renderLyricPanel();
    return;
  }
  const parsed = parseLRC(rawText);
  state.currentLyric = parsed;
  state.currentLyricLine = -1;
  renderLyricPanel();
  updateFullscreenLyric();
}

function renderLyricPanel() {
  const containers = [els.lyricContainer, els.lyricContainerBig];

  if (!state.currentLyric || state.currentLyric.lines.length === 0) {
    containers.forEach(function (c) {
      c.innerHTML =
        '<div class="lyric-empty">' +
        '<i class="ph ph-text-align-center" aria-hidden="true"></i>' +
        '<p>当前曲目暂无歌词</p>' +
        '<p style="font-size:10.5px;opacity:.7">拖入 .lrc 文件或点击下方按钮添加</p>' +
        '</div>';
    });
    return;
  }

  let html = '';
  state.currentLyric.lines.forEach(function (line, i) {
    html += '<div class="lyric-line" data-line="' + i + '">' +
            (esc(line.text) || '♪') + '</div>';
  });

  containers.forEach(function (c) {
    c.innerHTML = html;
    c.scrollTop = 0;
  });
}

function updateLyricHighlight(currentTime) {
  if (!state.currentLyric || state.currentLyric.lines.length === 0) return;

  const idx = findCurrentLyricLine(state.currentLyric, currentTime);
  if (idx === state.currentLyricLine) return;
  state.currentLyricLine = idx;

  const containers = [els.lyricContainer, els.lyricContainerBig];
  containers.forEach(function (c) {
    const lines = c.querySelectorAll('.lyric-line');
    lines.forEach(function (el, i) {
      el.classList.remove('is-active', 'is-near', 'is-past');
      if (i === idx) el.classList.add('is-active');
      else if (i < idx) el.classList.add('is-past');
      else if (i <= idx + 2) el.classList.add('is-near');
    });

    // 滚动到当前行
    if (idx >= 0 && lines[idx]) {
      // 使用 scrollIntoView 实现平滑居中
      try {
        lines[idx].scrollIntoView({
          behavior: mqReduce.matches ? 'auto' : 'smooth',
          block: 'center'
        });
      } catch (e) {
        // 降级
        const line = lines[idx];
        const offset = line.offsetTop - c.clientHeight / 2 + line.clientHeight / 2;
        c.scrollTop = Math.max(0, offset);
      }
    }
  });

  updateFullscreenLyric();
}

function updateFullscreenLyric() {
  if (!state.fullscreenOpen) return;
  if (!state.currentLyric || state.currentLyricLine < 0) {
    els.fsLyric.textContent = '';
    return;
  }
  const line = state.currentLyric.lines[state.currentLyricLine];
  els.fsLyric.textContent = line ? line.text : '';
}

/* ---------- 歌词对话框 ---------- */
let lyricDialogTrackId = null;

function openLyricDialogForIndex(idx) {
  const track = state.tracks[idx];
  if (!track) return;
  lyricDialogTrackId = track.id;
  els.lyricDialogTitle.textContent = '编辑歌词 · ' + track.title;
  els.lyricDialog.classList.add('is-active');
  els.lyricTextarea.focus();

  // 加载现有歌词
  loadLyricForTrack(track.id).then(function (raw) {
    els.lyricTextarea.value = raw || '';
  });
}

function openLyricDialogForCurrent() {
  if (state.currentIndex < 0) {
    showToast('请先选择曲目', 'error');
    return;
  }
  openLyricDialogForIndex(state.currentIndex);
}

function closeLyricDialog() {
  els.lyricDialog.classList.remove('is-active');
  lyricDialogTrackId = null;
}

async function saveLyricFromDialog() {
  if (!lyricDialogTrackId) return;
  const text = els.lyricTextarea.value.trim();
  const track = state.tracks.find(function (t) { return t.id === lyricDialogTrackId; });
  if (!track) return;

  if (!text) {
    await deleteLyricForTrack(track.id);
    track.hasLyric = false;
    if (state.currentIndex >= 0 && state.tracks[state.currentIndex].id === track.id) {
      setCurrentLyric(null);
    }
    showToast('歌词已删除', 'success');
  } else {
    await saveLyricForTrack(track.id, text);
    track.hasLyric = true;
    if (state.currentIndex >= 0 && state.tracks[state.currentIndex].id === track.id) {
      setCurrentLyric(text);
    }
    showToast('歌词已保存', 'success');
  }

  renderPlaylist();
  updateInfoPanel();
  closeLyricDialog();
}

els.btnEditLrc.addEventListener('click', openLyricDialogForCurrent);
els.lyricDialogClose.addEventListener('click', closeLyricDialog);
els.btnCancelLrc.addEventListener('click', closeLyricDialog);
els.btnSaveLrc.addEventListener('click', saveLyricFromDialog);
els.btnDeleteLrc.addEventListener('click', async function () {
  if (!lyricDialogTrackId) return;
  const track = state.tracks.find(function (t) { return t.id === lyricDialogTrackId; });
  if (!track) return;
  await deleteLyricForTrack(track.id);
  track.hasLyric = false;
  if (state.currentIndex >= 0 && state.tracks[state.currentIndex].id === track.id) {
    setCurrentLyric(null);
  }
  els.lyricTextarea.value = '';
  renderPlaylist();
  updateInfoPanel();
  showToast('歌词已删除', 'success');
});

// 对话框快捷键
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && els.lyricDialog.classList.contains('is-active')) {
    closeLyricDialog();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' &&
      els.lyricDialog.classList.contains('is-active')) {
    e.preventDefault();
    saveLyricFromDialog();
  }
});

/* ---------- 导入 LRC ---------- */
els.btnImportLrc.addEventListener('click', function () {
  if (state.currentIndex < 0) {
    showToast('请先选择曲目', 'error');
    return;
  }
  els.lrcInput.click();
});

els.lrcInput.addEventListener('change', function () {
  const f = this.files && this.files[0];
  if (f) handleLRCFile(f);
  this.value = '';
});
