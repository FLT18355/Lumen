/* ============================================================
   Lumen Player — 封面处理
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function extractCoverColor(imgEl) {
  try {
    const canvas = document.createElement('canvas');
    const size = 40;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imgEl, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] < 128) continue;
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];
      const mx = Math.max(pr, pg, pb), mn = Math.min(pr, pg, pb);
      if (mx - mn < 24 && (mx < 60 || mx > 200)) continue;
      r += pr; g += pg; b += pb; n++;
    }
    if (n === 0) return '';
    return 'rgb(' + Math.round(r / n) + ',' + Math.round(g / n) + ',' + Math.round(b / n) + ')';
  } catch (e) { return ''; }
}

function applyCoverColor(color) {
  document.documentElement.style.setProperty(
    '--cover-color', color || 'var(--ctp-mauve)'
  );
}

function extractEmbeddedCover(file) {
  return new Promise(function (resolve) {
    if (!file) return resolve('');
    const ext = getExt(file.name);
    if (ext !== 'mp3') return resolve('');
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const buf = e.target.result;
        const view = new DataView(buf);
        if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 ||
            view.getUint8(2) !== 0x33) return resolve('');
        const bytes = new Uint8Array(buf);
        const apic = findApicFrame(bytes);
        if (apic) {
          const blob = new Blob([apic], { type: 'image/jpeg' });
          return resolve(URL.createObjectURL(blob));
        }
        resolve('');
      } catch (err) { resolve(''); }
    };
    reader.onerror = function () { resolve(''); };
    reader.readAsArrayBuffer(file.slice(0, 512 * 1024));
  });
}

function findApicFrame(bytes) {
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x41 && bytes[i + 1] === 0x50 &&
        bytes[i + 2] === 0x49 && bytes[i + 3] === 0x43) {
      let j = i + 4;
      j++;
      while (j < bytes.length && bytes[j] !== 0) j++;
      j += 2;
      while (j < bytes.length && bytes[j] !== 0) j++;
      j++;
      for (let k = j; k < bytes.length - 3; k++) {
        if (bytes[k] === 0xFF && bytes[k + 1] === 0xD8) {
          let end = k;
          for (let m = bytes.length - 2; m > k; m--) {
            if (bytes[m] === 0xFF && bytes[m + 1] === 0xD9) {
              end = m + 2; break;
            }
          }
          if (end > k) return bytes.slice(k, end);
        }
        if (bytes[k] === 0x89 && bytes[k + 1] === 0x50 &&
            bytes[k + 2] === 0x4E && bytes[k + 3] === 0x47) {
          return bytes.slice(k, Math.min(k + 200000, bytes.length));
        }
      }
      return null;
    }
  }
  return null;
}

function loadCoverForTrack(track) {
  els.coverArt.hidden = true;
  els.coverPlaceholder.hidden = false;
  els.fsCover.classList.remove('is-visible');
  els.fsCoverPlaceholder.style.display = 'grid';
  applyCoverColor('');

  extractEmbeddedCover(track.file).then(function (dataUrl) {
    if (dataUrl) {
      els.coverArt.src = dataUrl;
      els.coverArt.hidden = false;
      els.coverPlaceholder.hidden = true;
      els.coverArt.onload = function () {
        const color = extractCoverColor(els.coverArt);
        applyCoverColor(color);
        updatePbThumb(dataUrl);
        els.fsCover.src = dataUrl;
        els.fsCover.classList.add('is-visible');
        els.fsCoverPlaceholder.style.display = 'none';
        els.fsBackdrop.style.backgroundImage = 'url(' + dataUrl + ')';
      };
    } else {
      updatePbThumb('');
      const hue = hashString(track.title) % 360;
      applyCoverColor('hsl(' + hue + ', 55%, 55%)');
      els.fsCover.classList.remove('is-visible');
      els.fsCoverPlaceholder.style.display = 'grid';
      els.fsBackdrop.style.backgroundImage = '';
    }
  });
}

function updatePbThumb(dataUrl) {
  if (dataUrl) {
    els.pbThumb.innerHTML = '<img src="' + dataUrl + '" alt="">';
  } else {
    els.pbThumb.innerHTML = '<i class="ph ph-music-note" aria-hidden="true"></i>';
  }
}
