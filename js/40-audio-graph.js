/* ============================================================
   Lumen Player — Web Audio 初始化
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function ensureAudioContext() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try {
    audioCtx = new Ctx();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    timeData = new Uint8Array(analyser.fftSize);

    sourceNode = audioCtx.createMediaElementSource(els.audio);

    // EQ 链
    eqFilters = EQ_FREQS.map(function (f, i) {
      const filter = audioCtx.createBiquadFilter();
      filter.type = EQ_TYPES[i];
      filter.frequency.value = f;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });

    // Bypass 直连节点
    eqBypassGain = audioCtx.createGain();
    eqBypassGain.gain.value = 1;

    // 信号链: source → bypass → analyser → destination
    //            ↘ EQ filters ↗
    sourceNode.connect(eqBypassGain);
    let node = sourceNode;
    eqFilters.forEach(function (f) {
      node.connect(f);
      node = f;
    });
    node.connect(analyser);

    eqBypassGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    updateAudioInfo();
  } catch (e) {
    console.warn('Web Audio 初始化失败', e);
    audioCtx = null;
  }
}

function updateEqGains() {
  if (!eqFilters.length) return;
  if (state.eqEnabled) {
    eqBypassGain.gain.value = 0;
    eqFilters.forEach(function (filter, i) {
      filter.gain.value = state.eqGains[i];
    });
  } else {
    eqBypassGain.gain.value = 1;
    eqFilters.forEach(function (filter) {
      filter.gain.value = 0;
    });
  }
}
