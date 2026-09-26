/* ============================================================
   Lumen Player — 可视化绘制
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx: ctx, w: rect.width, h: rect.height };
}

function resizeCanvases() {
  const v = setupCanvas(els.vizCanvas);
  if (v) { vizCtx = v.ctx; vizW = v.w; vizH = v.h; }

  if (state.fullscreenOpen) {
    const f = setupCanvas(els.fsCanvas);
    if (f) { fsCtx = f.ctx; fsW = f.w; fsH = f.h; }
  }
}

function resolveColor(c) {
  if (!c) return '#cba6f7';
  if (c.startsWith('var(')) {
    const m = /var\((--[\w-]+)\)/.exec(c);
    if (m) {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(m[1]).trim();
      return v || '#cba6f7';
    }
  }
  return c;
}

function getCoverColor() {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--cover-color').trim();
  return v || 'var(--ctp-mauve)';
}

function drawBars(ctx, w, h, data) {
  const bars = 40;
  const gap = 4;
  const barW = Math.max(2, (w - gap * (bars - 1)) / bars);
  const step = Math.max(1, Math.floor(data.length / bars));
  const color = resolveColor(getCoverColor());
  const teal = resolveColor('var(--ctp-teal)');

  for (let i = 0; i < bars; i++) {
    let sum = 0;
    const start = Math.floor(i * data.length / bars);
    const end = Math.min(start + step, data.length);
    for (let j = start; j < end; j++) sum += data[j];
    const val = (sum / Math.max(1, end - start)) / 255;
    const barH = Math.max(2, val * h * 0.95);

    const x = i * (barW + gap) + (w - bars * barW - gap * (bars - 1)) / 2;
    const y = h - barH;

    const grad = ctx.createLinearGradient(0, h, 0, y);
    grad.addColorStop(0, color);
    grad.addColorStop(1, teal);
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [3, 3, 1, 1]);
    else ctx.rect(x, y, barW, barH);
    ctx.fill();
  }
}

function drawWave(ctx, w, h, data) {
  const color = resolveColor(getCoverColor());
  const teal = resolveColor('var(--ctp-teal)');
  const step = w / (data.length - 1);

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, color);
  grad.addColorStop(0.5, teal);
  grad.addColorStop(1, color);
  ctx.strokeStyle = grad;

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] / 128) - 1;
    const x = i * step;
    const y = h / 2 + v * (h / 2) * 0.92;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] / 128) - 1;
    const x = i * step;
    const y = h / 2 - v * (h / 2) * 0.92;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawCircle(ctx, w, h, data, opts) {
  opts = opts || {};
  const cx = w / 2, cy = h / 2;
  const baseR = opts.baseR || Math.min(w, h) * 0.18;
  const maxR = opts.maxR || Math.min(w, h) * 0.48;
  const bars = opts.bars || 72;
  const lineW = opts.lineW || 2;
  const color = resolveColor(getCoverColor());
  const teal = resolveColor('var(--ctp-teal)');
  const step = Math.max(1, Math.floor(data.length / bars / 2));

  for (let i = 0; i < bars; i++) {
    let sum = 0;
    const start = Math.floor(i * step);
    const end = Math.min(start + step, data.length);
    for (let j = start; j < end; j++) sum += data[j];
    const val = (sum / Math.max(1, end - start)) / 255;
    const barLen = Math.max(2, val * (maxR - baseR));

    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * baseR;
    const y1 = cy + Math.sin(angle) * baseR;
    const x2 = cx + Math.cos(angle) * (baseR + barLen);
    const y2 = cy + Math.sin(angle) * (baseR + barLen);

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, teal);

    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawIdle(ctx, w, h, mode) {
  const color = resolveColor(getCoverColor());
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.2;

  if (mode === 'wave') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  } else if (mode === 'circle') {
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.35;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    const bars = 40;
    const gap = 4;
    const barW = Math.max(2, (w - gap * (bars - 1)) / bars);
    for (let i = 0; i < bars; i++) {
      const x = i * (barW + gap) + (w - bars * barW - gap * (bars - 1)) / 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, h - 3, barW, 3, [3, 3, 1, 1]);
      else ctx.rect(x, h - 3, barW, 3);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawViz() {
  if (vizCtx && vizW > 0) {
    vizCtx.clearRect(0, 0, vizW, vizH);
    if (analyser && state.isPlaying) {
      if (state.vizMode === 'bars') {
        analyser.getByteFrequencyData(freqData);
        drawBars(vizCtx, vizW, vizH, freqData);
      } else if (state.vizMode === 'wave') {
        analyser.getByteTimeDomainData(timeData);
        drawWave(vizCtx, vizW, vizH, timeData);
      } else {
        analyser.getByteFrequencyData(freqData);
        drawCircle(vizCtx, vizW, vizH, freqData, {
          baseR: Math.min(vizW, vizH) * 0.14,
          maxR: Math.min(vizW, vizH) * 0.48,
          bars: 56, lineW: 2
        });
      }
    } else {
      drawIdle(vizCtx, vizW, vizH, state.vizMode);
    }
  }

  if (state.fullscreenOpen && fsCtx && fsW > 0) {
    fsCtx.clearRect(0, 0, fsW, fsH);
    if (analyser && state.isPlaying) {
      analyser.getByteFrequencyData(freqData);
      drawCircle(fsCtx, fsW, fsH, freqData, {
        baseR: Math.min(fsW, fsH) * 0.22,
        maxR: Math.min(fsW, fsH) * 0.48,
        bars: 96, lineW: 2.5
      });
    } else {
      fsCtx.beginPath();
      fsCtx.arc(fsW / 2, fsH / 2, Math.min(fsW, fsH) * 0.35, 0, Math.PI * 2);
      fsCtx.strokeStyle = resolveColor(getCoverColor());
      fsCtx.globalAlpha = 0.4;
      fsCtx.lineWidth = 2;
      fsCtx.stroke();
      fsCtx.globalAlpha = 1;
    }
  }

  vizAnimFrame = requestAnimationFrame(drawViz);
}
