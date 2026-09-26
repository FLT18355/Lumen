/* ============================================================
   Lumen Player — 信息面板 / 定时器 / AB 循环 / EQ / 速度
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function updateAudioInfo() {
  if (!audioCtx) return;
  try {
    const sr = audioCtx.sampleRate;
    const ch = audioCtx.destination.channelCount || 2;
    els.infoSampleRate.textContent = (sr / 1000).toFixed(1) + ' kHz';
    els.infoChannels.textContent = ch === 1 ? '单声道' : ch === 2 ? '立体声' : ch + ' 声道';
  } catch (e) {}
}

function updateInfoPanel() {
  const track = state.currentIndex >= 0 ? state.tracks[state.currentIndex] : null;

  if (!track) {
    ['infoTitle','infoArtist','infoDuration','infoSize','infoFormat',
     'infoBitrate','infoSampleRate','infoChannels','infoIndex'].forEach(function (id) {
      els[id].textContent = '—';
    });
  } else {
    els.infoTitle.textContent = track.title;
    els.infoArtist.textContent = track.artist;
    els.infoDuration.textContent = track.duration ? fmtLongTime(track.duration) : '—';
    els.infoSize.textContent = fmtBytes(track.size);
    els.infoFormat.textContent = track.format;
    if (track.duration > 0 && track.size) {
      const bitrate = Math.round((track.size * 8) / (track.duration * 1000));
      els.infoBitrate.textContent = bitrate + ' kbps';
    } else {
      els.infoBitrate.textContent = '—';
    }
    els.infoIndex.textContent = '#' + (state.currentIndex + 1);
    if (audioCtx) updateAudioInfo();
  }

  const total = state.tracks.length;
  const favCount = state.tracks.filter(function (t) { return t.isFavorite; }).length;
  const lyricCount = state.tracks.filter(function (t) { return t.hasLyric; }).length;
  let totalDur = 0;
  state.tracks.forEach(function (t) { totalDur += (t.duration || 0); });

  els.infoTotal.textContent = total;
  els.infoFavCount.textContent = favCount;
  els.infoTotalDuration.textContent = fmtLongTime(totalDur);
  els.infoLyricCount.textContent = lyricCount;
}

/* ==========================================================
   睡眠定时器
   ========================================================== */
let sleepTimerInterval = 0;

function startSleepTimer(minutes) {
  clearInterval(sleepTimerInterval);

  if (minutes <= 0) {
    state.sleepTimerEnd = 0;
    state.sleepTimerTotal = 0;
    state.sleepTimerSavedVolume = null;
    els.timerValue.textContent = '--:--';
    els.timerLabel.textContent = '未设置';
    els.timerBtns.forEach(function (b) { b.classList.remove('is-active'); });
    return;
  }

  state.sleepTimerTotal = minutes;
  state.sleepTimerEnd = Date.now() + minutes * 60 * 1000;
  state.sleepTimerSavedVolume = null;

  els.timerBtns.forEach(function (b) {
    b.classList.toggle('is-active', parseInt(b.dataset.timer, 10) === minutes);
  });

  updateSleepTimerUI();
  sleepTimerInterval = setInterval(updateSleepTimerUI, 1000);
}

function updateSleepTimerUI() {
  if (!state.sleepTimerEnd) return;
  const remaining = state.sleepTimerEnd - Date.now();

  if (remaining <= 0) {
    clearInterval(sleepTimerInterval);
    state.sleepTimerEnd = 0;
    els.timerValue.textContent = '00:00';
    els.timerLabel.textContent = '时间到';
    fadeOutAndPause();
    return;
  }

  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  els.timerValue.textContent =
    (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  els.timerLabel.textContent = state.sleepTimerTotal + ' 分钟定时';
}

function fadeOutAndPause() {
  // 保存当前音量
  if (state.sleepTimerSavedVolume === null) {
    state.sleepTimerSavedVolume = els.audio.volume;
  }
  const startVol = els.audio.volume;
  const startTime = performance.now();
  const duration = 3000;

  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    els.audio.volume = startVol * (1 - t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      els.audio.pause();
      els.audio.volume = state.sleepTimerSavedVolume;
      state.sleepTimerSavedVolume = null;
      showToast('睡眠定时结束，已暂停', 'success');
    }
  }
  requestAnimationFrame(step);
}

els.timerBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const m = parseInt(btn.dataset.timer, 10);
    startSleepTimer(m);
    if (m > 0) showToast('睡眠定时器已启动：' + m + ' 分钟', 'success');
    else showToast('睡眠定时器已取消', 'success');
  });
});

/* ==========================================================
   AB 循环
   ========================================================== */
function setABPoint(which) {
  const cur = els.audio.currentTime || 0;
  if (which === 'A') {
    state.abA = cur;
    state.abB = -1;
    els.btnSetB.disabled = false;
    els.btnClearAB.disabled = false;
    updateABStatus();
    showToast('A 点已设置 @ ' + fmtTime(cur), 'success');
  } else if (which === 'B') {
    if (state.abA < 0) return;
    if (cur <= state.abA + 0.5) {
      showToast('B 点必须晚于 A 点', 'error');
      return;
    }
    state.abB = cur;
    els.btnSetA.classList.add('is-active');
    els.btnSetB.classList.add('is-active');
    els.btnClearAB.disabled = false;
    updateABStatus();
    showToast('AB 循环开启：' + fmtTime(state.abA) + ' - ' + fmtTime(cur), 'success');
  }
}

function clearAB() {
  state.abA = -1;
  state.abB = -1;
  els.btnSetA.classList.remove('is-active');
  els.btnSetB.classList.remove('is-active');
  els.btnSetB.disabled = true;
  els.btnClearAB.disabled = true;
  els.abStatus.classList.remove('is-visible');
  els.seekAB.classList.remove('is-visible');
}

function updateABStatus() {
  if (state.abA >= 0 && state.abB > state.abA) {
    els.abStatus.classList.add('is-visible');
    els.abStatus.textContent =
      'AB 循环 ' + fmtTime(state.abA) + ' → ' + fmtTime(state.abB);
  } else if (state.abA >= 0) {
    els.abStatus.classList.add('is-visible');
    els.abStatus.textContent = 'A 点: ' + fmtTime(state.abA) + '，等待设置 B 点';
  } else {
    els.abStatus.classList.remove('is-visible');
  }
}

els.btnSetA.addEventListener('click', function () { setABPoint('A'); });
els.btnSetB.addEventListener('click', function () { setABPoint('B'); });
els.btnClearAB.addEventListener('click', function () {
  clearAB();
  showToast('AB 循环已清除', 'success');
});

/* ==========================================================
   EQ 面板
   ========================================================== */
els.eqSwitch.addEventListener('click', function () {
  state.eqEnabled = !state.eqEnabled;
  this.setAttribute('aria-checked', state.eqEnabled ? 'true' : 'false');
  els.eqSliders.dataset.disabled = state.eqEnabled ? 'false' : 'true';
  updateEqGains();
  saveSettings();
  showToast(state.eqEnabled ? '均衡器已开启' : '均衡器已关闭', 'success');
});

document.querySelectorAll('.eq-slider').forEach(function (slider) {
  slider.addEventListener('input', function () {
    const idx = parseInt(this.dataset.eqIndex, 10);
    const val = parseInt(this.value, 10);
    state.eqGains[idx] = val;
    const label = document.querySelector('[data-eq-val="' + idx + '"]');
    if (label) label.textContent = val > 0 ? '+' + val : String(val);
    updateEqGains();

    state.eqPreset = 'custom';
    els.presetGrid.querySelectorAll('.preset-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.preset === 'custom' ? 'true' : 'false');
    });
    saveSettings();
  });
});

els.presetGrid.querySelectorAll('.preset-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const preset = btn.dataset.preset;
    if (preset === 'custom') {
      els.presetGrid.querySelectorAll('.preset-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      return;
    }
    const gains = EQ_PRESETS[preset] || [0, 0, 0, 0, 0];
    state.eqGains = gains.slice();
    state.eqPreset = preset;

    document.querySelectorAll('.eq-slider').forEach(function (slider) {
      const i = parseInt(slider.dataset.eqIndex, 10);
      slider.value = String(gains[i]);
      const label = document.querySelector('[data-eq-val="' + i + '"]');
      if (label) label.textContent = gains[i] > 0 ? '+' + gains[i] : String(gains[i]);
    });

    els.presetGrid.querySelectorAll('.preset-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });

    updateEqGains();
    saveSettings();
    showToast('已应用预设：' + btn.textContent.trim(), 'success');
  });
});

/* ==========================================================
   播放速度
   ========================================================== */
els.speedGrid.querySelectorAll('.speed-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const speed = parseFloat(btn.dataset.speed);
    if (!isFinite(speed)) return;
    state.playbackRate = speed;
    els.audio.playbackRate = speed;
    els.speedGrid.querySelectorAll('.speed-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    saveSettings();
    showToast('播放速度 ' + speed + 'x', 'success');
  });
});
