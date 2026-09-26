/* ============================================================
   Lumen Player — 播放控制 / 进度条 / 音量 / 音频事件
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

async function loadTrack(index, autoPlay) {
  if (index < 0 || index >= state.tracks.length) return;
  const track = state.tracks[index];

  // 释放旧的 Object URL（如果是上一次创建的）
  if (state.currentIndex >= 0) {
    const old = state.tracks[state.currentIndex];
    // 注意：不 revoke，因为我们可能还需要它。切换时只 revoke 上一个真正的 src
    // 这里保持简单：不主动 revoke，依赖 beforeunload 清理
  }

  state.currentIndex = index;
  els.audio.src = track.url;
  els.audio.load();
  els.audio.playbackRate = state.playbackRate;

  updateNowPlaying(track);
  loadCoverForTrack(track);
  renderPlaylist();
  updateInfoPanel();

  // 加载歌词
  const raw = await loadLyricForTrack(track.id);
  if (raw) {
    track.hasLyric = true;
    setCurrentLyric(raw);
  } else {
    setCurrentLyric(null);
  }

  if (autoPlay) {
    ensureAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function(){});
    }
    const p = els.audio.play();
    if (p && p.catch) {
      p.catch(function (err) {
        console.warn('播放失败:', err);
        state.isPlaying = false;
        updatePlayButton();
        document.body.classList.remove('is-playing');
      });
    }
  } else {
    state.isPlaying = false;
    updatePlayButton();
    document.body.classList.remove('is-playing');
  }
}

function updateNowPlaying(track) {
  els.trackTitle.textContent = track.title;
  els.trackArtist.textContent = track.artist;
  els.trackFormat.hidden = false;
  els.trackFormat.innerHTML =
    '<i class="ph ph-waveform" aria-hidden="true"></i>' + esc(track.format);
  els.pbTitle.textContent = track.title;
  els.pbArtist.textContent = track.artist;
  els.btnPlay.disabled = false;
  els.btnPrev.disabled = false;
  els.btnNext.disabled = false;
  els.fsTitle.textContent = track.title;
  els.fsArtist.textContent = track.artist;
  els.lyricViewTitle.textContent = track.title + ' · 歌词';
}

function togglePlay() {
  if (state.currentIndex < 0 && state.tracks.length > 0) {
    loadTrack(0, true); return;
  }
  if (state.currentIndex < 0) return;

  ensureAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(function(){});
  }

  if (state.isPlaying) {
    els.audio.pause();
  } else {
    const p = els.audio.play();
    if (p && p.catch) {
      p.catch(function (err) {
        console.warn('播放失败:', err);
        showToast('播放失败，请重试', 'error');
      });
    }
  }
}

function stopAndReset() {
  els.audio.pause();
  els.audio.removeAttribute('src');
  els.audio.load();
  state.isPlaying = false;
  updatePlayButton();
  document.body.classList.remove('is-playing');

  els.trackTitle.textContent = '未在播放';
  els.trackArtist.textContent = '添加音乐开始聆听';
  els.trackFormat.hidden = true;
  els.pbTitle.textContent = '未在播放';
  els.pbArtist.textContent = '—';
  els.coverArt.hidden = true;
  els.coverPlaceholder.hidden = false;
  updatePbThumb('');
  applyCoverColor('');
  els.btnPlay.disabled = true;
  els.btnPrev.disabled = true;
  els.btnNext.disabled = true;
  els.seekFill.style.width = '0%';
  els.seekKnob.style.left = '0%';
  els.timeCurrent.textContent = '0:00';
  els.timeTotal.textContent = '0:00';
  els.fsTitle.textContent = '未在播放';
  els.fsArtist.textContent = '—';
  els.fsLyric.textContent = '';
  setCurrentLyric(null);
  clearAB();
}

function updatePlayButton() {
  els.playIcon.className = state.isPlaying ? 'ph ph-pause' : 'ph ph-play';
  els.btnPlay.setAttribute('aria-label', state.isPlaying ? '暂停' : '播放');
}

function nextTrack() {
  if (state.tracks.length === 0) return;
  if (state.repeat === 'one' && state.currentIndex >= 0) {
    els.audio.currentTime = 0;
    els.audio.play().catch(function(){});
    return;
  }
  let next;
  if (state.shuffle) next = pickRandomIndex();
  else {
    next = state.currentIndex + 1;
    if (next >= state.tracks.length) {
      if (state.repeat === 'all') next = 0;
      else {
        els.audio.pause();
        els.audio.currentTime = 0;
        state.isPlaying = false;
        updatePlayButton();
        document.body.classList.remove('is-playing');
        renderPlaylist();
        return;
      }
    }
  }
  loadTrack(next, true);
}

function prevTrack() {
  if (state.tracks.length === 0) return;
  if (els.audio.currentTime > 3) { els.audio.currentTime = 0; return; }
  let prev;
  if (state.shuffle) prev = pickRandomIndex();
  else {
    prev = state.currentIndex - 1;
    if (prev < 0) prev = state.tracks.length - 1;
  }
  loadTrack(prev, true);
}

function pickRandomIndex() {
  if (state.tracks.length <= 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * state.tracks.length); }
  while (idx === state.currentIndex);
  return idx;
}

/* ==========================================================
   进度条
   ========================================================== */
function updateSeekUI() {
  const cur = els.audio.currentTime || 0;
  const dur = els.audio.duration || 0;
  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  if (!state.seeking) {
    els.seekFill.style.width = pct + '%';
    els.seekKnob.style.left = pct + '%';
  }
  els.timeCurrent.textContent = fmtTime(cur);
  els.timeTotal.textContent = dur ? fmtTime(dur) : '0:00';
  els.seekBar.setAttribute('aria-valuenow', Math.round(pct));

  if (state.abA >= 0 && state.abB > state.abA && dur > 0) {
    if (cur >= state.abB) els.audio.currentTime = state.abA;
    els.seekAB.classList.add('is-visible');
    els.seekAB.style.left = (state.abA / dur * 100) + '%';
    els.seekAB.style.width = ((state.abB - state.abA) / dur * 100) + '%';
  } else {
    els.seekAB.classList.remove('is-visible');
  }

  // 歌词高亮
  updateLyricHighlight(cur);
}

function seekToRatio(ratio) {
  const dur = els.audio.duration || 0;
  if (dur > 0) els.audio.currentTime = clamp(ratio, 0, 1) * dur;
}

(function bindSeek() {
  function ratioFromEvent(e) {
    const rect = els.seekBar.getBoundingClientRect();
    return clamp((e.clientX - rect.left) / rect.width, 0, 1);
  }
  els.seekBar.addEventListener('pointerdown', function (e) {
    if (state.currentIndex < 0) return;
    state.seeking = true;
    els.seekBar.classList.add('is-dragging');
    els.seekBar.setPointerCapture(e.pointerId);
    const r = ratioFromEvent(e);
    els.seekFill.style.width = (r * 100) + '%';
    els.seekKnob.style.left = (r * 100) + '%';
  });
  els.seekBar.addEventListener('pointermove', function (e) {
    if (!state.seeking) return;
    const r = ratioFromEvent(e);
    els.seekFill.style.width = (r * 100) + '%';
    els.seekKnob.style.left = (r * 100) + '%';
    els.timeCurrent.textContent = fmtTime(r * (els.audio.duration || 0));
  });
  function endSeek(e) {
    if (!state.seeking) return;
    state.seeking = false;
    els.seekBar.classList.remove('is-dragging');
    try { els.seekBar.releasePointerCapture(e.pointerId); } catch (err) {}
    seekToRatio(ratioFromEvent(e));
  }
  els.seekBar.addEventListener('pointerup', endSeek);
  els.seekBar.addEventListener('pointercancel', endSeek);

  els.seekBar.addEventListener('keydown', function (e) {
    const dur = els.audio.duration || 0;
    if (dur <= 0) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); els.audio.currentTime = Math.min(dur, els.audio.currentTime + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); els.audio.currentTime = Math.max(0, els.audio.currentTime - 5); }
    else if (e.key === 'Home') { e.preventDefault(); els.audio.currentTime = 0; }
    else if (e.key === 'End') { e.preventDefault(); els.audio.currentTime = dur; }
  });
})();

/* ==========================================================
   音量
   ========================================================== */
function updateVolumeUI() {
  const v = state.muted ? 0 : state.volume;
  els.volumeFill.style.width = (v * 100) + '%';
  els.volumeBar.setAttribute('aria-valuenow', Math.round(v * 100));
  if (state.muted || state.volume === 0) els.muteIcon.className = 'ph ph-speaker-slash';
  else if (state.volume < 0.35) els.muteIcon.className = 'ph ph-speaker-low';
  else els.muteIcon.className = 'ph ph-speaker-high';
}
function setVolume(v) {
  state.volume = clamp(v, 0, 1);
  state.muted = state.volume === 0;
  els.audio.volume = state.volume;
  updateVolumeUI();
  saveSettings();
}
(function bindVolume() {
  function ratioFromEvent(e) {
    const rect = els.volumeBar.getBoundingClientRect();
    return clamp((e.clientX - rect.left) / rect.width, 0, 1);
  }
  let dragging = false;
  els.volumeBar.addEventListener('pointerdown', function (e) {
    dragging = true;
    els.volumeBar.classList.add('is-dragging');
    els.volumeBar.setPointerCapture(e.pointerId);
    setVolume(ratioFromEvent(e));
  });
  els.volumeBar.addEventListener('pointermove', function (e) {
    if (dragging) setVolume(ratioFromEvent(e));
  });
  function end(e) {
    dragging = false;
    els.volumeBar.classList.remove('is-dragging');
    try { els.volumeBar.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  els.volumeBar.addEventListener('pointerup', end);
  els.volumeBar.addEventListener('pointercancel', end);
  els.volumeBar.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setVolume(state.volume + 0.05); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setVolume(state.volume - 0.05); }
  });
  els.btnMute.addEventListener('click', function () {
    state.muted = !state.muted;
    els.audio.muted = state.muted;
    updateVolumeUI();
    saveSettings();
  });
})();

/* ==========================================================
   音频事件
   ========================================================== */
els.audio.addEventListener('play', function () {
  state.isPlaying = true;
  updatePlayButton();
  document.body.classList.add('is-playing');
  renderPlaylist();
});
els.audio.addEventListener('pause', function () {
  state.isPlaying = false;
  updatePlayButton();
  document.body.classList.remove('is-playing');
  renderPlaylist();
});
els.audio.addEventListener('ended', function () {
  if (state.repeat === 'one') {
    els.audio.currentTime = 0;
    els.audio.play().catch(function(){});
  } else {
    nextTrack();
  }
});
els.audio.addEventListener('loadedmetadata', function () {
  updateSeekUI();
  updateInfoPanel();
});
els.audio.addEventListener('timeupdate', function () {
  if (!state.seeking) updateSeekUI();
});
els.audio.addEventListener('error', function () {
  const err = els.audio.error;
  if (err) {
    console.warn('音频错误:', err.code, err.message);
    showToast('无法播放该文件（格式可能不受支持）', 'error');
  }
});
