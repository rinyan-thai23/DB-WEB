/**
 * CORE 2809 - Application Logic v5 (Multilingual)
 * 3モード: スライド / 音声再生 / アニメーション
 * 言語切替対応
 */

// ========== 言語定義 ==========
const LANGUAGES = [
  { code: 'JP', flag: '🇯🇵', name: '日本語', dir: 'core2809_EN-JP', prefix: 'core2809_EN-JP_' },
  { code: 'ZH_CN', flag: '🇨🇳', name: '中文', dir: 'core2809_EN-ZH_CN', prefix: 'core2809_EN-ZH_CN_' },
  { code: 'KO', flag: '🇰🇷', name: '한국어', dir: 'core2809_EN-KO', prefix: 'core2809_EN-KO_' },
  { code: 'TH', flag: '🇹🇭', name: 'ไทย', dir: 'core2809_EN-TH', prefix: 'core2809_EN-TH_' },
  { code: 'HI', flag: '🇮🇳', name: 'हिन्दी', dir: 'core2809_EN-HI', prefix: 'core2809_EN-HI_' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', dir: 'core2809_EN-ID', prefix: 'core2809_EN-ID_' },
  { code: 'AR', flag: '🇸🇦', name: 'العربية', dir: 'core2809_EN-AR', prefix: 'core2809_EN-AR_' },
  { code: 'FR', flag: '🇫🇷', name: 'Français', dir: 'core2809_EN-FR', prefix: 'core2809_EN-FR_' },
  { code: 'ES', flag: '🇪🇸', name: 'Español', dir: 'core2809_EN-ES', prefix: 'core2809_EN-ES_' },
  { code: 'PT', flag: '🇧🇷', name: 'Português', dir: 'core2809_EN-PT', prefix: 'core2809_EN-PT_' },
  { code: 'DE', flag: '🇩🇪', name: 'Deutsch', dir: 'core2809_EN-DE', prefix: 'core2809_EN-DE_' },
  { code: 'RU', flag: '🇷🇺', name: 'Русский', dir: 'core2809_EN-RU', prefix: 'core2809_EN-RU_' }
];

// ========== 設定 ==========
const CONFIG = {
  AUDIO_DIR: 'https://pub-1cb8d5bae9ea4a93a941d9e2607437b3.r2.dev/EN',
  CHUNK_SIZE: 100,
  TOTAL_WORDS: 2809,
  MAX_FREQUENCY: 60910,
  ANIMATION_INTERVAL: 5000
};

// 現在の言語設定（動的）
let currentLang = null;

function getLangConfig() {
  return {
    DATA_DIR: currentLang.dir,
    FILE_PREFIX: currentLang.prefix
  };
}

// ========== 状態管理 ==========
const state = {
  currentChunkIndex: 0,
  currentWords: [],
  currentFilter: '',
  isLoading: false,
  currentMode: 'slide',
  animationIndex: 0,
  animationTimer: null,
  audioIndex: 0,
  audioPlayer: null,
  isAudioPlaying: false
};

// ========== チャンク情報を生成 ==========
function generateChunkInfo() {
  const chunks = [];
  const numChunks = Math.ceil(CONFIG.TOTAL_WORDS / CONFIG.CHUNK_SIZE);
  const langConfig = getLangConfig();
  
  for (let i = 0; i < numChunks; i++) {
    const start = i * CONFIG.CHUNK_SIZE + 1;
    const end = Math.min((i + 1) * CONFIG.CHUNK_SIZE, CONFIG.TOTAL_WORDS);
    const startPad = String(start).padStart(4, '0');
    const endPad = String(end).padStart(4, '0');
    
    chunks.push({
      index: i,
      start: start,
      end: end,
      filename: `${langConfig.FILE_PREFIX}${startPad}-${endPad}.json`,
      label: `${start}-${end}`
    });
  }
  
  return chunks;
}

let CHUNKS = [];

// ========== 言語セレクター ==========
function initLangSelector() {
  const currentBtn = document.getElementById('langCurrentBtn');
  const dropdown = document.getElementById('langDropdown');
  
  // ドロップダウン内容を生成
  dropdown.innerHTML = LANGUAGES.map(lang => `
    <div class="lang-option ${lang.code === currentLang.code ? 'active' : ''}" data-lang="${lang.code}">
      <span class="lang-option-flag">${lang.flag}</span>
      <span class="lang-option-name">${lang.name}</span>
    </div>
  `).join('');
  
  // トグル
  currentBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  
  // 言語選択
  dropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.lang-option');
    if (!option) return;
    
    const langCode = option.dataset.lang;
    if (langCode === currentLang.code) {
      dropdown.classList.remove('open');
      return;
    }
    
    switchLanguage(langCode);
    dropdown.classList.remove('open');
  });
  
  // 外側クリックで閉じる
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });
}

function switchLanguage(langCode) {
  const lang = LANGUAGES.find(l => l.code === langCode);
  if (!lang) return;
  
  stopAllPlayback();
  
  currentLang = lang;
  localStorage.setItem('core2809-lang', langCode);
  
  // UI更新
  document.getElementById('langCurrentFlag').textContent = lang.flag;
  document.getElementById('langCurrentName').textContent = lang.name;
  
  // ドロップダウンのactive更新
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === langCode);
  });
  
  // チャンク再生成 & リロード
  CHUNKS = generateChunkInfo();
  state.currentChunkIndex = 0;
  renderNavigation();
  loadChunk(0);
}

function updateLangUI() {
  document.getElementById('langCurrentFlag').textContent = currentLang.flag;
  document.getElementById('langCurrentName').textContent = currentLang.name;
}

// ========== ナビゲーション生成 ==========
function renderNavigation() {
  const container = document.getElementById('navContainer');
  
  const groups = [
    { name: 'Top', icon: '🔥', range: [0, 0] },
    { name: 'High', icon: '📈', range: [1, 4] },
    { name: 'Mid', icon: '📊', range: [5, 14] },
    { name: 'Low', icon: '📉', range: [15, 28] }
  ];
  
  let html = '';
  
  groups.forEach((group, groupIdx) => {
    const isFirst = groupIdx === 0;
    const chunksInGroup = CHUNKS.slice(group.range[0], group.range[1] + 1);
    
    if (chunksInGroup.length === 0) return;
    
    const startWord = chunksInGroup[0].start;
    const endWord = chunksInGroup[chunksInGroup.length - 1].end;
    
    html += `
      <div class="nav-group ${isFirst ? 'open' : ''}" data-group="${groupIdx}">
        <div class="nav-group-header" onclick="toggleNavGroup(this)">
          <span class="nav-group-label">
            <span class="nav-group-icon">${group.icon}</span>
            <span>${group.name} ${startWord}-${endWord}</span>
          </span>
          <span class="nav-group-arrow">▼</span>
        </div>
        <div class="nav-items">
          ${chunksInGroup.map(chunk => `
            <div class="nav-item ${chunk.index === 0 ? 'active' : ''}" data-chunk="${chunk.index}" onclick="loadChunk(${chunk.index})">
              ${chunk.label}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function toggleNavGroup(header) {
  const group = header.parentElement;
  group.classList.toggle('open');
}

// ========== JSONファイル読み込み ==========
async function loadChunk(chunkIndex) {
  if (state.isLoading) return;
  if (chunkIndex < 0 || chunkIndex >= CHUNKS.length) return;
  
  stopAllPlayback();
  
  state.isLoading = true;
  state.currentChunkIndex = chunkIndex;
  const chunk = CHUNKS[chunkIndex];
  const langConfig = getLangConfig();
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (parseInt(item.dataset.chunk) === chunkIndex) {
      item.classList.add('active');
    }
  });
  
  const container = document.getElementById('wordList');
  container.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>${chunk.label} loading...</div>
    </div>
  `;
  
  try {
    const response = await fetch(`${langConfig.DATA_DIR}/${chunk.filename}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${chunk.filename}`);
    
    const words = await response.json();
    
    state.currentWords = words.map(w => ({
      rank: w.rank,
      lemma: w.lemma,
      en: w.source,
      target: w.target,
      frequency: w.frequency
    }));
    
    renderByMode();
    updateStats();
    updateNavButtons();
    
  } catch (error) {
    console.error(`Failed to load chunk ${chunkIndex}:`, error);
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">⚠️</div>
        <div class="no-results-text">Failed to load<br><small>${error.message}</small></div>
      </div>
    `;
  }
  
  state.isLoading = false;
}

// ========== モード別レンダリング ==========
function renderByMode() {
  switch (state.currentMode) {
    case 'slide':
      renderWords();
      break;
    case 'audio':
      state.audioIndex = 0;
      renderAudioMode(0);
      break;
    case 'animation':
      state.animationIndex = 0;
      renderAnimationMode(0);
      startAnimation();
      break;
  }
}

// ========== スライドモード ==========
function renderWords() {
  const container = document.getElementById('wordList');
  
  let wordsToShow = state.currentWords;
  
  if (state.currentFilter) {
    const query = state.currentFilter.toLowerCase();
    wordsToShow = state.currentWords.filter(word => 
      word.en.word.toLowerCase().includes(query) ||
      word.target.word.includes(query) ||
      word.en.phrases.some(p => p.toLowerCase().includes(query)) ||
      word.target.phrases.some(p => p.includes(query))
    );
  }
  
  document.getElementById('displayCount').textContent = `${wordsToShow.length} words`;
  
  if (wordsToShow.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">No words found</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = wordsToShow.map((word, idx) => createWordCardHtml(word, idx * 0.02)).join('');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 音声再生モード ==========
function renderAudioMode(index) {
  const container = document.getElementById('wordList');
  const word = state.currentWords[index];
  
  if (!word) return;
  
  document.getElementById('displayCount').textContent = `${index + 1} / ${state.currentWords.length}`;
  
  const audioFile = `${CONFIG.AUDIO_DIR}/${String(word.rank).padStart(4, '0')}_${word.lemma}.mp3`;
  
  container.innerHTML = `
    <div class="audio-container">
      <div class="audio-counter">${index + 1} / ${state.currentWords.length}</div>
      ${createWordCardHtml(word, 0, true)}
      <div class="audio-controls">
        <button class="audio-btn" onclick="audioPrev()">◀◀ Prev</button>
        <button class="audio-btn audio-btn-play" id="audioPlayBtn" onclick="audioTogglePlay()">
          ${state.isAudioPlaying ? '⏸ Stop' : '▶ Play'}
        </button>
        <button class="audio-btn" onclick="audioNext()">Next ▶▶</button>
      </div>
      <div class="audio-status" id="audioStatus">
        ${state.isAudioPlaying ? '🔊 Playing...' : '⏸ Stopped'}
      </div>
      <audio id="audioPlayer" src="${audioFile}" preload="auto"></audio>
    </div>
  `;
  
  state.audioPlayer = document.getElementById('audioPlayer');
  state.audioPlayer.onended = onAudioEnded;
  state.audioPlayer.onerror = onAudioError;
  
  if (state.isAudioPlaying) {
    state.audioPlayer.play().catch(e => console.log('Auto-play blocked:', e));
  }
}

function audioTogglePlay() {
  if (state.isAudioPlaying) {
    audioStop();
  } else {
    audioStart();
  }
}

function audioStart() {
  state.isAudioPlaying = true;
  if (state.audioPlayer) {
    state.audioPlayer.play().catch(e => {
      console.log('Play failed:', e);
      state.isAudioPlaying = false;
      updateAudioUI();
    });
  }
  updateAudioUI();
}

function audioStop() {
  state.isAudioPlaying = false;
  if (state.audioPlayer) {
    state.audioPlayer.pause();
  }
  updateAudioUI();
}

function updateAudioUI() {
  const btn = document.getElementById('audioPlayBtn');
  const status = document.getElementById('audioStatus');
  if (btn) {
    btn.textContent = state.isAudioPlaying ? '⏸ Stop' : '▶ Play';
  }
  if (status) {
    status.textContent = state.isAudioPlaying ? '🔊 Playing...' : '⏸ Stopped';
  }
}

function onAudioEnded() {
  if (!state.isAudioPlaying) return;
  
  if (state.audioIndex < state.currentWords.length - 1) {
    state.audioIndex++;
    renderAudioMode(state.audioIndex);
  } else if (state.currentChunkIndex < CHUNKS.length - 1) {
    loadChunk(state.currentChunkIndex + 1).then(() => {
      if (state.currentMode === 'audio') {
        state.isAudioPlaying = true;
        renderAudioMode(0);
      }
    });
  } else {
    state.isAudioPlaying = false;
    updateAudioUI();
  }
}

function onAudioError(e) {
  console.error('Audio error:', e);
  const status = document.getElementById('audioStatus');
  if (status) {
    status.textContent = '⚠️ Audio file not found';
  }
}

function audioPrev() {
  audioStop();
  if (state.audioIndex > 0) {
    state.audioIndex--;
    renderAudioMode(state.audioIndex);
  } else if (state.currentChunkIndex > 0) {
    loadChunk(state.currentChunkIndex - 1).then(() => {
      if (state.currentMode === 'audio') {
        state.audioIndex = state.currentWords.length - 1;
        renderAudioMode(state.audioIndex);
      }
    });
  }
}

function audioNext() {
  audioStop();
  if (state.audioIndex < state.currentWords.length - 1) {
    state.audioIndex++;
    renderAudioMode(state.audioIndex);
  } else if (state.currentChunkIndex < CHUNKS.length - 1) {
    loadChunk(state.currentChunkIndex + 1);
  }
}

// ========== アニメーションモード ==========
function renderAnimationMode(index) {
  const container = document.getElementById('wordList');
  const word = state.currentWords[index];
  
  if (!word) return;
  
  document.getElementById('displayCount').textContent = `${index + 1} / ${state.currentWords.length}`;
  
  const isPaused = !state.animationTimer;
  
  container.innerHTML = `
    <div class="animation-container">
      <div class="animation-progress">
        <div class="animation-progress-bar ${isPaused ? 'paused' : ''}" style="animation-duration: ${CONFIG.ANIMATION_INTERVAL}ms"></div>
      </div>
      <div class="animation-counter">${index + 1} / ${state.currentWords.length}</div>
      ${createWordCardHtml(word, 0, true)}
      <div class="animation-controls">
        <button class="anim-btn" onclick="animPrev()">◀ Prev</button>
        <button class="anim-btn anim-btn-pause" onclick="animTogglePause()">
          ${state.animationTimer ? '⏸ Pause' : '▶ Play'}
        </button>
        <button class="anim-btn" onclick="animNext()">Next ▶</button>
      </div>
    </div>
  `;
}

function startAnimation() {
  if (state.animationTimer) return;
  
  state.animationTimer = setInterval(() => {
    state.animationIndex++;
    if (state.animationIndex >= state.currentWords.length) {
      if (state.currentChunkIndex < CHUNKS.length - 1) {
        loadChunk(state.currentChunkIndex + 1);
      } else {
        stopAnimation();
        state.animationIndex = state.currentWords.length - 1;
        renderAnimationMode(state.animationIndex);
      }
    } else {
      renderAnimationMode(state.animationIndex);
    }
  }, CONFIG.ANIMATION_INTERVAL);
}

function stopAnimation() {
  if (state.animationTimer) {
    clearInterval(state.animationTimer);
    state.animationTimer = null;
  }
}

function animTogglePause() {
  if (state.animationTimer) {
    stopAnimation();
  } else {
    startAnimation();
  }
  renderAnimationMode(state.animationIndex);
}

function animPrev() {
  stopAnimation();
  if (state.animationIndex > 0) {
    state.animationIndex--;
    renderAnimationMode(state.animationIndex);
  } else if (state.currentChunkIndex > 0) {
    loadChunk(state.currentChunkIndex - 1).then(() => {
      if (state.currentMode === 'animation') {
        state.animationIndex = state.currentWords.length - 1;
        renderAnimationMode(state.animationIndex);
      }
    });
  }
}

function animNext() {
  stopAnimation();
  if (state.animationIndex < state.currentWords.length - 1) {
    state.animationIndex++;
    renderAnimationMode(state.animationIndex);
  } else if (state.currentChunkIndex < CHUNKS.length - 1) {
    loadChunk(state.currentChunkIndex + 1);
  }
}

// ========== 全再生停止 ==========
function stopAllPlayback() {
  stopAnimation();
  audioStop();
}

// ========== 単語カードHTML生成 ==========
function createWordCardHtml(word, delay = 0, isSpecialMode = false) {
  const animClass = isSpecialMode ? 'word-card-special' : '';
  const delayStyle = delay > 0 ? `animation-delay: ${Math.min(delay, 0.5)}s` : '';
  
  return `
    <div class="word-card ${animClass}" id="rank-${word.rank}" style="${delayStyle}">
      <div class="word-card-header">
        <div class="word-rank">
          <div class="rank-number">#${word.rank}</div>
          <div class="word-main">
            <div class="word-en">${escapeHtml(word.en.word)}</div>
            <div class="word-target">${escapeHtml(word.target.word)}</div>
          </div>
        </div>
        <div class="word-freq">
          <div class="freq-label">Frequency</div>
          <div class="freq-bar-mini">
            <div class="freq-bar-mini-fill" style="width: ${(word.frequency / CONFIG.MAX_FREQUENCY) * 100}%"></div>
          </div>
        </div>
      </div>
      <div class="word-card-body">
        <div class="phrases-title">Learn with phrases</div>
        <div class="phrases-list">
          ${word.en.phrases.map((phrase, i) => `
            <div class="phrase-item ${isSpecialMode ? 'phrase-item-anim' : ''}" style="${isSpecialMode ? `animation-delay: ${0.3 + i * 0.2}s` : ''}">
              <span class="phrase-en">${escapeHtml(phrase)}</span>
              <span class="phrase-arrow">→</span>
              <span class="phrase-target">${escapeHtml(word.target.phrases[i] || '')}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ========== 前後チャンク移動 ==========
function loadPrevChunk() {
  if (state.currentChunkIndex > 0) {
    loadChunk(state.currentChunkIndex - 1);
  }
}

function loadNextChunk() {
  if (state.currentChunkIndex < CHUNKS.length - 1) {
    loadChunk(state.currentChunkIndex + 1);
  }
}

function updateNavButtons() {
  const prevBtn = document.getElementById('prevChunkBtn');
  const nextBtn = document.getElementById('nextChunkBtn');
  
  if (prevBtn) prevBtn.disabled = state.currentChunkIndex === 0;
  if (nextBtn) nextBtn.disabled = state.currentChunkIndex >= CHUNKS.length - 1;
}

// ========== 統計情報更新 ==========
function updateStats() {
  const chunk = CHUNKS[state.currentChunkIndex];
  document.getElementById('currentRangeTitle').textContent = chunk.label;
}

// ========== モード切替 ==========
function setMode(mode) {
  if (state.currentMode === mode) return;
  
  stopAllPlayback();
  state.currentMode = mode;
  
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });
  
  renderByMode();
  
  localStorage.setItem('core2809-mode', mode);
}

// ========== 検索機能 ==========
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  let debounceTimer;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.currentFilter = e.target.value.trim();
      if (state.currentMode === 'slide') {
        renderWords();
      }
    }, 200);
  });
}

// ========== テーマ切り替え ==========
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('core2809-theme') || 'dark';
  if (savedTheme === 'light') {
    html.setAttribute('data-theme', 'light');
    themeIcon.textContent = '☀️';
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'light') {
      html.removeAttribute('data-theme');
      themeIcon.textContent = '🌙';
      localStorage.setItem('core2809-theme', 'dark');
    } else {
      html.setAttribute('data-theme', 'light');
      themeIcon.textContent = '☀️';
      localStorage.setItem('core2809-theme', 'light');
    }
  });
}

// ========== モード初期化 ==========
function initMode() {
  const validModes = ['slide', 'audio', 'animation'];
  const savedMode = localStorage.getItem('core2809-mode') || 'slide';
  state.currentMode = validModes.includes(savedMode) ? savedMode : 'slide';
  
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === state.currentMode) {
      btn.classList.add('active');
    }
  });
}

// ========== 言語初期化 ==========
function initLanguage() {
  const savedLang = localStorage.getItem('core2809-lang') || 'JP';
  const lang = LANGUAGES.find(l => l.code === savedLang) || LANGUAGES[0];
  currentLang = lang;
  CHUNKS = generateChunkInfo();
}

// ========== モバイルメニュー ==========
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  });
}

// ========== ユーティリティ ==========
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ========== 初期化 ==========
async function init() {
  initLanguage();
  updateLangUI();
  renderNavigation();
  initLangSelector();
  initSearch();
  initThemeToggle();
  initMode();
  initMobileMenu();
  
  await loadChunk(0);
}

document.addEventListener('DOMContentLoaded', init);