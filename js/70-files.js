/* ============================================================
   Lumen Player — 文件导入处理
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function isSupportedAudio(file) {
  if (!file) return false;
  if (file.type && file.type.indexOf('audio') === 0) return true;
  return SUPPORTED_EXTS.indexOf(getExt(file.name)) >= 0;
}

function isLRCFile(file) {
  if (!file) return false;
  return getExt(file.name) === 'lrc';
}

async function addFiles(fileList) {
  const files = Array.from(fileList || []);
  const audioFiles = files.filter(isSupportedAudio);

  // 先处理 LRC 文件（匹配当前选中的或即将添加的曲目）
  const lrcFiles = files.filter(isLRCFile);
  for (const lrc of lrcFiles) {
    await handleLRCFile(lrc);
  }

  if (audioFiles.length === 0) {
    if (lrcFiles.length === 0) showToast('未找到支持的音频文件', 'error');
    return;
  }

  let added = 0;
  for (const file of audioFiles) {
    try {
      const parsed = parseTrackName(file.name);
      const ext = getExt(file.name);
      const addedAt = Date.now();

      // 存入 IndexedDB
      const record = {
        name: file.name,
        title: parsed.title,
        artist: parsed.artist,
        format: ext ? ext.toUpperCase() : 'AUDIO',
        size: file.size,
        duration: 0,
        addedAt: addedAt,
        isFavorite: favoriteSet.has(file.name),
        blob: file
      };
      const id = await dbPut(STORE_TRACKS, record);

      // 创建对象 URL 用于播放
      const url = URL.createObjectURL(file);

      const track = {
        id: id,
        file: file,
        name: file.name,
        title: parsed.title,
        artist: parsed.artist,
        url: url,
        duration: 0,
        format: ext ? ext.toUpperCase() : 'AUDIO',
        size: file.size,
        addedAt: addedAt,
        isFavorite: favoriteSet.has(file.name),
        hasLyric: false
      };
      state.tracks.push(track);
      added++;

      // 异步读取时长
      probeDuration(track);
    } catch (err) {
      console.warn('保存曲目失败', err);
    }
  }

  applySortIfNeeded();
  renderPlaylist();
  updateInfoPanel();
  showToast('已添加 ' + added + ' 首音乐', 'success');

  if (state.currentIndex < 0 && state.tracks.length > 0) {
    loadTrack(0, false);
  }
}

function probeDuration(track) {
  const probe = document.createElement('audio');
  probe.preload = 'metadata';
  probe.src = track.url;
  probe.addEventListener('loadedmetadata', function () {
    track.duration = probe.duration || 0;
    // 同步更新 IndexedDB
    if (db) {
      dbGet(STORE_TRACKS, track.id).then(function (rec) {
        if (rec) { rec.duration = track.duration; dbPut(STORE_TRACKS, rec).catch(function(){}); }
      }).catch(function(){});
    }
    renderPlaylist();
    updateInfoPanel();
  });
  probe.addEventListener('error', function () {
    console.warn('无法读取音频元数据:', track.name);
  });
}

async function handleLRCFile(file) {
  try {
    const text = await file.text();
    // 如果当前有选中曲目，直接给它
    if (state.currentIndex >= 0) {
      const track = state.tracks[state.currentIndex];
      await applyLyricToTrack(track, text);
      showToast('歌词已应用到「' + track.title + '」', 'success');
      return;
    }
    // 否则尝试按文件名匹配
    const baseName = file.name.replace(/\.lrc$/i, '').toLowerCase();
    const matched = state.tracks.find(function (t) {
      const tBase = t.name.replace(/\.[^.]+$/, '').toLowerCase();
      return tBase === baseName || tBase.indexOf(baseName) >= 0 ||
             baseName.indexOf(tBase) >= 0;
    });
    if (matched) {
      await applyLyricToTrack(matched, text);
      showToast('歌词已匹配到「' + matched.title + '」', 'success');
    } else {
      showToast('未找到匹配的曲目，请先选中目标曲目再导入', 'error');
    }
  } catch (err) {
    console.warn('读取 LRC 失败', err);
    showToast('读取 LRC 文件失败', 'error');
  }
}

async function applyLyricToTrack(track, rawText) {
  await saveLyricForTrack(track.id, rawText);
  track.hasLyric = true;
  if (state.currentIndex >= 0 && state.tracks[state.currentIndex].id === track.id) {
    setCurrentLyric(rawText);
  }
  renderPlaylist();
  updateInfoPanel();
}
