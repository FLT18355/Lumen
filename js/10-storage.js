/* ============================================================
   Lumen Player — IndexedDB 与设置持久化
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

function openDB() {
  return new Promise(function (resolve, reject) {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = function (e) {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_TRACKS)) {
        const store = database.createObjectStore(STORE_TRACKS, {
          keyPath: 'id', autoIncrement: true
        });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('addedAt', 'addedAt', { unique: false });
      }
      if (!database.objectStoreNames.contains(STORE_LYRICS)) {
        database.createObjectStore(STORE_LYRICS, { keyPath: 'trackId' });
      }
      if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
        database.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function (e) { reject(e.target.error); };
    req.onblocked = function () {
      console.warn('IndexedDB blocked, 请关闭其他标签页');
    };
  });
}

function dbPut(storeName, data) {
  return new Promise(function (resolve, reject) {
    if (!db) return reject(new Error('DB not ready'));
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

function dbGet(storeName, key) {
  return new Promise(function (resolve, reject) {
    if (!db) return reject(new Error('DB not ready'));
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

function dbGetAll(storeName) {
  return new Promise(function (resolve, reject) {
    if (!db) return reject(new Error('DB not ready'));
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = function () { resolve(req.result || []); };
    req.onerror = function () { reject(req.error); };
  });
}

function dbDelete(storeName, key) {
  return new Promise(function (resolve, reject) {
    if (!db) return reject(new Error('DB not ready'));
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = function () { resolve(); };
    req.onerror = function () { reject(req.error); };
  });
}

function dbClear(storeName) {
  return new Promise(function (resolve, reject) {
    if (!db) return reject(new Error('DB not ready'));
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = function () { resolve(); };
    req.onerror = function () { reject(req.error); };
  });
}

/* ==========================================================
   设置持久化（轻量数据用 localStorage，重数据用 IndexedDB）
   ========================================================== */
function saveSettings() {
  const data = {
    key: 'player-settings',
    volume: state.volume,
    muted: state.muted,
    shuffle: state.shuffle,
    repeat: state.repeat,
    playbackRate: state.playbackRate,
    eqEnabled: state.eqEnabled,
    eqPreset: state.eqPreset,
    eqGains: state.eqGains.slice(),
    vizMode: state.vizMode,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
    filterFav: state.filterFav
  };
  if (db) {
    dbPut(STORE_SETTINGS, data).catch(function () {});
  }
  // 备份到 localStorage
  try {
    localStorage.setItem('lumen-player-settings', JSON.stringify(data));
  } catch (e) {}
}

async function loadSettings() {
  let data = null;
  if (db) {
    try { data = await dbGet(STORE_SETTINGS, 'player-settings'); } catch (e) {}
  }
  if (!data) {
    try {
      const raw = localStorage.getItem('lumen-player-settings');
      if (raw) data = JSON.parse(raw);
    } catch (e) {}
  }
  if (!data) return;

  if (typeof data.volume === 'number') state.volume = data.volume;
  if (typeof data.muted === 'boolean') state.muted = data.muted;
  if (typeof data.shuffle === 'boolean') state.shuffle = data.shuffle;
  if (typeof data.repeat === 'string') state.repeat = data.repeat;
  if (typeof data.playbackRate === 'number') state.playbackRate = data.playbackRate;
  if (typeof data.eqEnabled === 'boolean') state.eqEnabled = data.eqEnabled;
  if (typeof data.eqPreset === 'string') state.eqPreset = data.eqPreset;
  if (Array.isArray(data.eqGains)) state.eqGains = data.eqGains;
  if (typeof data.vizMode === 'string') state.vizMode = data.vizMode;
  if (typeof data.sortBy === 'string') state.sortBy = data.sortBy;
  if (typeof data.sortDir === 'string') state.sortDir = data.sortDir;
  if (typeof data.filterFav === 'boolean') state.filterFav = data.filterFav;
}

async function saveLyricForTrack(trackId, rawText) {
  if (!db) return;
  try {
    await dbPut(STORE_LYRICS, { trackId: trackId, raw: rawText });
  } catch (e) {
    console.warn('保存歌词失败', e);
  }
}

async function loadLyricForTrack(trackId) {
  if (!db) return null;
  try {
    const row = await dbGet(STORE_LYRICS, trackId);
    return row ? row.raw : null;
  } catch (e) {
    return null;
  }
}

async function deleteLyricForTrack(trackId) {
  if (!db) return;
  try { await dbDelete(STORE_LYRICS, trackId); } catch (e) {}
}

async function loadAllLyrics() {
  if (!db) return [];
  try { return await dbGetAll(STORE_LYRICS); } catch (e) { return []; }
}
