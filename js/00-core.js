/* ============================================================
   Lumen Player — 常量与运行时状态
   ------------------------------------------------------------
   由 music.html 的单一 IIFE 拆分而来：各文件按顺序以经典
   <script> 载入，顶层 const / let / function 处于同一个全局
   词法作用域，引用关系与拆分前一致。
   ============================================================ */

'use strict';

const PALETTE = [
  'rosewater','flamingo','pink','mauve','red','maroon','peach',
  'yellow','green','teal','sky','sapphire','blue','lavender'
];
const SUPPORTED_EXTS = ['mp3','m4a','flac','ogg','wav','aac','opus','oga','m4b','mp4','webm'];
const EQ_FREQS = [60, 230, 910, 3600, 14000];
const EQ_TYPES = ['lowshelf','peaking','peaking','peaking','highshelf'];

const EQ_PRESETS = {
  flat:       [0, 0, 0, 0, 0],
  bass:       [8, 5, 0, -1, 2],
  vocal:      [-2, -1, 3, 4, 2],
  rock:       [5, 2, -1, 3, 5],
  jazz:       [3, 1, 1, 2, 3],
  electronic: [6, 3, 0, 2, 5],
  classical:  [-2, -1, 0, 3, 4]
};

const DB_NAME = 'lumen-player-db';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks';
const STORE_LYRICS = 'lyrics';
const STORE_SETTINGS = 'settings';

const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (id) => document.getElementById(id);

const els = {
  spectrum:       $('spectrum'),
  searchInput:    $('searchInput'),
  btnAdd:         $('btnAdd'),
  btnTheme:       $('btnTheme'),
  themeIcon:      $('themeIcon'),
  themeName:      $('themeName'),
  fileInput:      $('fileInput'),
  lrcInput:       $('lrcInput'),
  // 封面
  coverWrap:      $('coverWrap'),
  coverArt:       $('coverArt'),
  coverPlaceholder: $('coverPlaceholder'),
  trackTitle:     $('trackTitle'),
  trackArtist:    $('trackArtist'),
  trackFormat:    $('trackFormat'),
  vizCanvas:      $('vizCanvas'),
  vizModeBtns:    document.querySelectorAll('.viz-mode-btn'),
  // 歌词视图
  lyricView:      $('lyricView'),
  lyricViewTitle: $('lyricViewTitle'),
  lyricContainer: $('lyricContainer'),
  lyricContainerBig: $('lyricContainerBig'),
  lyricEmpty:     $('lyricEmpty'),
  btnViewPlayer:  $('btnViewPlayer'),
  btnViewLyric:   $('btnViewLyric'),
  // 歌词按钮
  btnImportLrc:   $('btnImportLrc'),
  btnEditLrc:     $('btnEditLrc'),
  // 歌词对话框
  lyricDialog:    $('lyricDialog'),
  lyricDialogTitle: $('lyricDialogTitle'),
  lyricDialogClose: $('lyricDialogClose'),
  lyricTextarea:  $('lyricTextarea'),
  btnDeleteLrc:   $('btnDeleteLrc'),
  btnCancelLrc:   $('btnCancelLrc'),
  btnSaveLrc:     $('btnSaveLrc'),
  // 列表
  sortSelect:     $('sortSelect'),
  btnFilterFav:   $('btnFilterFav'),
  btnClearAll:    $('btnClearAll'),
  playlistBody:   $('playlistBody'),
  playlistEmpty:  $('playlistEmpty'),
  // EQ
  eqSwitch:       $('eqSwitch'),
  eqSliders:      $('eqSliders'),
  presetGrid:     $('presetGrid'),
  speedGrid:      $('speedGrid'),
  // 信息
  infoTitle:      $('infoTitle'),
  infoArtist:     $('infoArtist'),
  infoDuration:   $('infoDuration'),
  infoSize:       $('infoSize'),
  infoFormat:     $('infoFormat'),
  infoBitrate:    $('infoBitrate'),
  infoSampleRate: $('infoSampleRate'),
  infoChannels:   $('infoChannels'),
  infoIndex:      $('infoIndex'),
  infoTotal:      $('infoTotal'),
  infoFavCount:   $('infoFavCount'),
  infoTotalDuration: $('infoTotalDuration'),
  infoLyricCount: $('infoLyricCount'),
  // 工具
  timerValue:     $('timerValue'),
  timerLabel:     $('timerLabel'),
  timerBtns:      document.querySelectorAll('.timer-btn'),
  btnSetA:        $('btnSetA'),
  btnSetB:        $('btnSetB'),
  btnClearAB:     $('btnClearAB'),
  abStatus:       $('abStatus'),
  // 控制条
  pbThumb:        $('pbThumb'),
  pbTitle:        $('pbTitle'),
  pbArtist:       $('pbArtist'),
  btnShuffle:     $('btnShuffle'),
  btnPrev:        $('btnPrev'),
  btnPlay:        $('btnPlay'),
  playIcon:       $('playIcon'),
  btnNext:        $('btnNext'),
  btnRepeat:      $('btnRepeat'),
  repeatIcon:     $('repeatIcon'),
  seekBar:        $('seekBar'),
  seekFill:       $('seekFill'),
  seekKnob:       $('seekKnob'),
  seekAB:         $('seekAB'),
  timeCurrent:    $('timeCurrent'),
  timeTotal:      $('timeTotal'),
  btnFullscreen:  $('btnFullscreen'),
  btnMute:        $('btnMute'),
  muteIcon:       $('muteIcon'),
  volumeBar:      $('volumeBar'),
  volumeFill:     $('volumeFill'),
  // 全屏
  fullscreenViz:  $('fullscreenViz'),
  fsBackdrop:     $('fsBackdrop'),
  fsCanvas:       $('fsCanvas'),
  fsCover:        $('fsCover'),
  fsCoverPlaceholder: $('fsCoverPlaceholder'),
  fsTitle:        $('fsTitle'),
  fsArtist:       $('fsArtist'),
  fsLyric:        $('fsLyric'),
  fsBack:         $('fsBack'),
  fsClose:        $('fsClose'),
  // 其它
  audio:          $('audio'),
  toast:          $('toast'),
  toastIcon:      $('toastIcon'),
  toastText:      $('toastText')
};

/* ==========================================================
   状态
   ========================================================== */
const state = {
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  shuffle: false,
  repeat: 'off',
  volume: 0.8,
  muted: false,
  seeking: false,
  playbackRate: 1,
  eqEnabled: false,
  eqPreset: 'flat',
  eqGains: [0, 0, 0, 0, 0],
  sleepTimerEnd: 0,
  sleepTimerTotal: 0,
  sleepTimerSavedVolume: null,
  abA: -1,
  abB: -1,
  vizMode: 'bars',
  searchQuery: '',
  filterFav: false,
  sortBy: 'added',
  sortDir: 'desc',
  fullscreenOpen: false,
  lyricViewActive: false,
  // 歌词
  currentLyric: null,     // { lines: [{time, text}], raw: string, offset: 0 }
  currentLyricLine: -1,
  lyricPanelVisible: true
};

let audioCtx = null;
let analyser = null;
let sourceNode = null;
let eqFilters = [];
let eqBypassGain = null;
let freqData = null;
let timeData = null;

let vizCtx = null, vizW = 0, vizH = 0;
let fsCtx = null, fsW = 0, fsH = 0;
let vizAnimFrame = 0;

let trackIdSeq = 0;
let db = null;
const favStorageKey = 'lumen-player-favs';
