/* ============================================
   OctoCore — Survival Word Book
   Main Application Logic
   ============================================ */

const App = (() => {
  // ── Language Config ──────────────────────────
  const LANGS = {
    en: { flag: '🇺🇸', name: 'English', native: 'English', speechCode: 'en-US' },
    th: { flag: '🇹🇭', name: 'Thai', native: 'ภาษาไทย', speechCode: 'th-TH' },
    jp: { flag: '🇯🇵', name: 'Japanese', native: '日本語', speechCode: 'ja-JP' },
    cn: { flag: '🇨🇳', name: 'Chinese', native: '中文', speechCode: 'zh-CN' },
    hi: { flag: '🇮🇳', name: 'Hindi', native: 'हिन्दी', speechCode: 'hi-IN' },
    es: { flag: '🇪🇸', name: 'Spanish', native: 'Español', speechCode: 'es-ES' },
  };

  const CORE_COUNT = 20; // First 20 words are "Core"

  // ── External Config ─────────────────────────
  const CONFIG = window.OCTOCORE_CONFIG || {};
  const basePath = CONFIG.basePath || '';  // e.g. '../' when running from a subdirectory

  // ── Helper: Extract target text & pron from item ──
  // JSON formats vary by language:
  //   TH: { target: "ใช่", pron: "chai", native: "はい" }
  //   EN: { en: "Yes", native: "はい" }  (no "target" or "pron")
  function getTarget(item) {
    return item.target || item[state.targetLang] || '';
  }
  function getPron(item) {
    return item.pron || '';
  }

  // ── State ────────────────────────────────────
  let state = {
    targetLang: null,
    nativeLang: null,
    data: null,          // Array of 200 mandala groups
    filteredIndices: [],  // Indices after filtering
    filter: 'all',
    currentIndex: 0,     // Index in filteredIndices
    mastered: new Set(),
    revealed: false,
    autoPlaying: false,
    autoPlayAbort: null,
  };

  // ── DOM References ───────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {};
  function cacheDom() {
    dom.gateway = $('#gateway');
    dom.basecamp = $('#basecamp');
    dom.arena = $('#arena');
    dom.contextModal = $('#context-modal');
    dom.nativeGrid = $('#native-grid');
    dom.bcTitle = $('#bc-title');
    dom.progressFill = $('#progress-fill');
    dom.progressText = $('#progress-text');
    dom.filterTabs = $('#filter-tabs');
    dom.wordList = $('#word-list');
    dom.mandalaGrid = $('#mandala-grid');
    dom.mandalaContainer = $('#mandala-container');
    dom.arenaCurrent = $('#arena-current');
    dom.arenaTotal = $('#arena-total');
    dom.autoPlayBtn = $('#auto-play-btn');
    dom.prevBtn = $('#prev-btn');
    dom.prevBtn = $('#prev-btn');
    dom.nextBtn = $('#next-btn');
    // Cinema
    dom.cinema = $('#cinema');
    dom.cinemaWordDisplay = $('#cinema-word-display');
    dom.cinemaMandalaDisplay = $('#cinema-mandala-display');
    dom.cinemaMandalaGrid = $('#cinema-mandala-grid');
    dom.cinemaTarget = $('#cinema-target');
    dom.cinemaPron = $('#cinema-pron');
    dom.cinemaNative = $('#cinema-native');
    dom.cinemaNum = $('#cinema-num');
    dom.cinemaCurrent = $('#cinema-current');
    dom.cinemaTotal = $('#cinema-total');
    dom.cinemaProgressFill = $('#cinema-progress-fill');
    dom.cinemaPauseBtn = $('#cinema-pause-btn');
  }

  // ── Screen Navigation ────────────────────────
  function showScreen(id, animation) {
    $$('.screen').forEach(s => s.classList.remove('active', 'slide-left-enter', 'slide-right-enter'));
    const screen = $(`#${id}`);
    screen.classList.add('active');
    if (animation) {
      screen.classList.add(animation);
    }
  }

  // ── Gateway → Target Selection ───────────────
  function selectTarget(lang) {
    state.targetLang = lang;
    document.body.setAttribute('data-lang', lang);

    // Check if native language is saved
    const saved = localStorage.getItem(`octocore_native_${lang}`);
    if (saved && LANGS[saved]) {
      state.nativeLang = saved;
      loadDataAndShowBasecamp();
    } else {
      showContextModal();
    }
  }

  // ── Context Modal ────────────────────────────
  function showContextModal() {
    dom.nativeGrid.innerHTML = '';
    Object.entries(LANGS).forEach(([code, info]) => {
      if (code === state.targetLang) return; // Exclude target language
      const btn = document.createElement('button');
      btn.className = 'native-btn';
      btn.innerHTML = `<span class="flag">${info.flag}</span><span>${info.native}</span>`;
      btn.onclick = () => selectNative(code);
      dom.nativeGrid.appendChild(btn);
    });
    dom.contextModal.classList.add('active');
  }

  function selectNative(lang) {
    state.nativeLang = lang;
    localStorage.setItem(`octocore_native_${state.targetLang}`, lang);
    dom.contextModal.classList.remove('active');
    loadDataAndShowBasecamp();
  }

  function changeNative() {
    showContextModal();
  }

  // ── Data Loading ─────────────────────────────
  async function loadDataAndShowBasecamp() {
    const t = state.targetLang;
    const n = state.nativeLang;
    const url = `${basePath}${t}/${t}_${n}.json`;

    dom.wordList.innerHTML = '<div class="loading">Loading</div>';
    showScreen('basecamp', 'slide-left-enter');

    const langInfo = LANGS[t];
    dom.bcTitle.textContent = `${langInfo.flag} ${langInfo.name}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data = await res.json();
      loadMastered();
      state.filter = 'all';
      updateFilterTabs();
      applyFilter();
      renderWordList();
      updateProgress();
    } catch (err) {
      dom.wordList.innerHTML = `<div class="empty-state">Failed to load data.<br><small>${err.message}</small></div>`;
      console.error('Data load error:', err);
    }
  }

  // ── LocalStorage: Mastered ───────────────────
  function masteredKey() {
    return `octocore_mastered_${state.targetLang}_${state.nativeLang}`;
  }

  function loadMastered() {
    try {
      const raw = localStorage.getItem(masteredKey());
      state.mastered = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      state.mastered = new Set();
    }
  }

  function saveMastered() {
    localStorage.setItem(masteredKey(), JSON.stringify([...state.mastered]));
  }

  function markMastered(index) {
    if (!state.mastered.has(index)) {
      state.mastered.add(index);
      saveMastered();
      updateProgress();
    }
  }

  // ── Progress ─────────────────────────────────
  function updateProgress() {
    if (!state.data) return;
    const total = state.data.length;
    const done = state.mastered.size;
    const pct = total > 0 ? (done / total) * 100 : 0;
    dom.progressFill.style.width = `${pct}%`;
    dom.progressText.textContent = `${done} / ${total}`;
  }

  // ── Filter ───────────────────────────────────
  function setFilter(filter) {
    state.filter = filter;
    updateFilterTabs();
    applyFilter();
    renderWordList();
  }

  function updateFilterTabs() {
    $$('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === state.filter);
    });
  }

  function applyFilter() {
    if (!state.data) return;
    const total = state.data.length;
    if (state.filter === 'core') {
      state.filteredIndices = [];
      for (let i = 0; i < Math.min(CORE_COUNT, total); i++) {
        state.filteredIndices.push(i);
      }
    } else {
      state.filteredIndices = [];
      for (let i = 0; i < total; i++) {
        state.filteredIndices.push(i);
      }
    }
  }

  // ── Word List Rendering ──────────────────────
  function renderWordList() {
    if (!state.data) return;
    dom.wordList.innerHTML = '';

    if (state.filteredIndices.length === 0) {
      dom.wordList.innerHTML = '<div class="empty-state">No words found.</div>';
      return;
    }

    const frag = document.createDocumentFragment();

    state.filteredIndices.forEach((dataIdx) => {
      const group = state.data[dataIdx];
      const center = group.find(item => item.type === 'CENTER');
      if (!center) return;

      const item = document.createElement('div');
      item.className = 'word-item' + (state.mastered.has(dataIdx) ? ' mastered' : '');
      item.innerHTML = `
        <span class="word-num">${dataIdx + 1}</span>
        <div class="word-target">
          ${getTarget(center)}
          <div class="word-pron">${getPron(center)}</div>
        </div>
        <span class="word-native">${center.native}</span>
        <button class="word-play-btn" data-idx="${dataIdx}">🔊</button>
      `;

      // Tap word → Arena
      item.addEventListener('click', (e) => {
        if (e.target.closest('.word-play-btn')) return;
        openArena(dataIdx);
      });

      // Play button → Speak in place
      const playBtn = item.querySelector('.word-play-btn');
      playBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await speakAsync(getTarget(center), state.targetLang);
        await speakAsync(center.native, state.nativeLang);
      });

      frag.appendChild(item);
    });

    dom.wordList.appendChild(frag);
  }

  // ── Arena ────────────────────────────────────
  function openArena(dataIdx) {
    // Find position in filtered list
    const filteredPos = state.filteredIndices.indexOf(dataIdx);
    state.currentIndex = filteredPos >= 0 ? filteredPos : 0;

    showScreen('arena', 'slide-left-enter');
    renderMandala();
  }

  function renderMandala() {
    const dataIdx = state.filteredIndices[state.currentIndex];
    if (dataIdx === undefined || !state.data[dataIdx]) return;

    const group = state.data[dataIdx];
    state.revealed = false;

    // Update counter
    dom.arenaCurrent.textContent = dataIdx + 1;
    dom.arenaTotal.textContent = state.data.length;

    // Update nav buttons
    dom.prevBtn.disabled = state.currentIndex <= 0;
    dom.nextBtn.disabled = state.currentIndex >= state.filteredIndices.length - 1;

    // Build grid
    dom.mandalaGrid.innerHTML = '';

    // Sort items by position (1-9)
    const sorted = [...group].sort((a, b) => a.pos - b.pos);

    sorted.forEach((item) => {
      const cell = document.createElement('div');
      const isCenter = item.type === 'CENTER';
      cell.className = `mandala-cell ${isCenter ? 'center pulse' : 'phrase'}`;
      cell.dataset.pos = item.pos;

      cell.innerHTML = `
        <span class="cell-target">${getTarget(item)}</span>
        <span class="cell-pron">${getPron(item)}</span>
        <span class="cell-native">${item.native}</span>
      `;

      if (isCenter) {
        cell.addEventListener('click', () => handleCenterTap(dataIdx));
      } else {
        cell.addEventListener('click', () => handlePhraseTap(cell, item));
      }

      dom.mandalaGrid.appendChild(cell);
    });
  }

  function handleCenterTap(dataIdx) {
    const center = dom.mandalaGrid.querySelector('.center');
    if (center) {
      center.classList.remove('pulse');
    }

    // Speak center word (target → native)
    const group = state.data[dataIdx];
    const centerItem = group.find(i => i.type === 'CENTER');
    if (centerItem) {
      speakAsync(getTarget(centerItem), state.targetLang).then(() => {
        speakAsync(centerItem.native, state.nativeLang);
      });
    }

    // Reveal phrases
    if (!state.revealed) {
      state.revealed = true;
      dom.mandalaGrid.querySelectorAll('.phrase').forEach(cell => {
        cell.classList.add('revealed');
      });
      markMastered(dataIdx);
    }
  }

  async function handlePhraseTap(cell, item) {
    // Toggle native translation
    cell.classList.toggle('show-native');

    // Speak phrase (target → native)
    cell.classList.add('speaking');
    await speakAsync(getTarget(item), state.targetLang);
    await speakAsync(item.native, state.nativeLang);
    cell.classList.remove('speaking');
  }

  function nextWord() {
    if (state.currentIndex >= state.filteredIndices.length - 1) return;
    stopAutoPlay();
    state.currentIndex++;
    animateSwap('swipe-left');
  }

  function prevWord() {
    if (state.currentIndex <= 0) return;
    stopAutoPlay();
    state.currentIndex--;
    animateSwap('swipe-right');
  }

  function animateSwap(cls) {
    dom.mandalaGrid.classList.add(cls);
    setTimeout(() => {
      dom.mandalaGrid.classList.remove(cls);
      renderMandala();
    }, 150);
  }

  // ── Auto Play ────────────────────────────────
  function toggleAutoPlay() {
    if (state.autoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  async function startAutoPlay() {
    state.autoPlaying = true;
    const controller = new AbortController();
    state.autoPlayAbort = controller;
    dom.autoPlayBtn.classList.add('playing');
    dom.autoPlayBtn.textContent = '■ Stop';

    try {
      while (state.autoPlaying && !controller.signal.aborted) {
        const dataIdx = state.filteredIndices[state.currentIndex];
        if (dataIdx === undefined) break;

        const group = state.data[dataIdx];
        const center = group.find(i => i.type === 'CENTER');
        const phrases = group.filter(i => i.type === 'PHRASE').sort((a, b) => a.pos - b.pos);

        // Reveal
        if (!state.revealed) {
          handleCenterTap(dataIdx);
        }

        // Speak center (target → native)
        if (center) {
          highlightCell(center.pos);
          await speakAsync(getTarget(center), state.targetLang);
          await speakAsync(center.native, state.nativeLang);
          await delay(600, controller.signal);
        }

        // Speak each phrase
        for (const phrase of phrases) {
          if (controller.signal.aborted) break;
          highlightCell(phrase.pos);
          const cell = dom.mandalaGrid.querySelector(`[data-pos="${phrase.pos}"]`);
          if (cell) cell.classList.add('show-native');
          await speakAsync(getTarget(phrase), state.targetLang);
          if (controller.signal.aborted) break;
          await speakAsync(phrase.native, state.nativeLang);
          if (controller.signal.aborted) break;
          await delay(400, controller.signal);
        }

        if (controller.signal.aborted) break;

        // Move to next word
        if (state.currentIndex < state.filteredIndices.length - 1) {
          await delay(1000, controller.signal);
          if (controller.signal.aborted) break;
          state.currentIndex++;
          renderMandala();
          await delay(500, controller.signal);
        } else {
          break; // Reached end
        }
      }
    } catch (e) {
      // Aborted
    }

    stopAutoPlay();
  }

  function stopAutoPlay() {
    state.autoPlaying = false;
    if (state.autoPlayAbort) {
      state.autoPlayAbort.abort();
      state.autoPlayAbort = null;
    }
    speechSynthesis.cancel();
    dom.autoPlayBtn.classList.remove('playing');
    dom.autoPlayBtn.textContent = '▶ Auto';
  }

  function highlightCell(pos) {
    dom.mandalaGrid.querySelectorAll('.mandala-cell').forEach(c => c.classList.remove('speaking'));
    const cell = dom.mandalaGrid.querySelector(`[data-pos="${pos}"]`);
    if (cell) cell.classList.add('speaking');
  }

  function delay(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      }
    });
  }

  // ── Speech Synthesis ─────────────────────────
  function speak(text, langCode) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANGS[langCode]?.speechCode || 'en-US';
    utter.rate = 0.85;
    utter.pitch = 1;
    speechSynthesis.speak(utter);
  }

  function speakAsync(text, langCode) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = LANGS[langCode]?.speechCode || 'en-US';
      utter.rate = 0.85;
      utter.pitch = 1;
      utter.onend = resolve;
      utter.onerror = resolve;
      speechSynthesis.speak(utter);
      // Fallback in case onend never fires
      setTimeout(resolve, 5000);
    });
  }

  // ── Swipe Gestures ───────────────────────────
  function setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    const threshold = 50;

    dom.mandalaContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    dom.mandalaContainer.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      // Only horizontal swipes
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          nextWord();
        } else {
          prevWord();
        }
      }
    }, { passive: true });
  }

  // ── Navigation Helpers ───────────────────────
  function goGateway() {
    stopAutoPlay();
    if (CONFIG.targetLang) {
      // Sub-directory page → navigate to hub
      window.location.href = basePath + 'index.html';
      return;
    }
    showScreen('gateway');
    state.data = null;
    state.targetLang = null;
    document.body.removeAttribute('data-lang');
  }

  function goBasecamp() {
    stopAutoPlay();
    showScreen('basecamp', 'slide-right-enter');
    // Re-render to update mastered states
    renderWordList();
    updateProgress();
  }

  // ── Keyboard Navigation ──────────────────────
  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Cinema mode keyboard
      if (dom.cinema.classList.contains('active')) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleCinemaPause();
        } else if (e.key === 'Escape') {
          stopCinema();
        }
        return;
      }

      if (!dom.arena.classList.contains('active')) return;

      switch (e.key) {
        case 'ArrowLeft':
          prevWord();
          break;
        case 'ArrowRight':
          nextWord();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          const dataIdx = state.filteredIndices[state.currentIndex];
          if (dataIdx !== undefined) {
            if (!state.revealed) {
              handleCenterTap(dataIdx);
            }
          }
          break;
        case 'Escape':
          goBasecamp();
          break;
      }
    });
  }

  // ── Cinema (Continuous Playback) ─────────────
  let cinemaState = {
    mode: null,       // 'word' or 'mandala'
    index: 0,         // current data index
    playing: false,
    paused: false,
    abort: null,
    pauseResolve: null,
  };

  function startCinema(mode) {
    if (!state.data || state.data.length === 0) return;
    cinemaState.mode = mode;
    cinemaState.index = 0;
    cinemaState.playing = true;
    cinemaState.paused = false;
    cinemaState.abort = new AbortController();

    // Toggle display areas
    if (mode === 'word') {
      dom.cinemaWordDisplay.style.display = '';
      dom.cinemaMandalaDisplay.style.display = 'none';
    } else {
      dom.cinemaWordDisplay.style.display = 'none';
      dom.cinemaMandalaDisplay.style.display = '';
    }

    dom.cinemaTotal.textContent = state.data.length;
    dom.cinemaPauseBtn.textContent = '⏸';
    dom.cinemaPauseBtn.classList.remove('paused');

    showScreen('cinema');
    runCinema();
  }

  async function runCinema() {
    const signal = cinemaState.abort.signal;
    const total = state.data.length;

    try {
      for (let i = cinemaState.index; i < total; i++) {
        if (signal.aborted) break;
        cinemaState.index = i;

        // Update counter & progress
        dom.cinemaCurrent.textContent = i + 1;
        dom.cinemaProgressFill.style.width = `${((i + 1) / total) * 100}%`;

        const group = state.data[i];
        const center = group.find(item => item.type === 'CENTER');
        if (!center) continue;

        if (cinemaState.mode === 'word') {
          await runCinemaWord(i, group, center, signal);
        } else {
          await runCinemaMandala(i, group, center, signal);
        }

        if (signal.aborted) break;

        // Pause between words
        await cinemaDelay(800, signal);
      }
    } catch (e) {
      // Aborted
    }

    if (cinemaState.playing) {
      // Reached end naturally
      stopCinema();
    }
  }

  async function runCinemaWord(idx, group, center, signal) {
    // Show number
    dom.cinemaNum.textContent = `# ${idx + 1}`;

    // Show target word with animation
    dom.cinemaTarget.textContent = getTarget(center);
    dom.cinemaTarget.style.animation = 'none';
    dom.cinemaTarget.offsetHeight; // trigger reflow
    dom.cinemaTarget.style.animation = '';

    // Show pron
    dom.cinemaPron.textContent = getPron(center);

    // Hide native first, show after speaking
    dom.cinemaNative.textContent = '';
    dom.cinemaNative.style.opacity = '0';

    // Speak target
    await checkPause(signal);
    await speakAsync(getTarget(center), state.targetLang);
    if (signal.aborted) return;

    // Reveal native translation & speak it
    dom.cinemaNative.textContent = center.native;
    dom.cinemaNative.style.opacity = '1';
    await speakAsync(center.native, state.nativeLang);
    if (signal.aborted) return;

    // Pause to read
    await cinemaDelay(1000, signal);
  }

  async function runCinemaMandala(idx, group, center, signal) {
    const phrases = group.filter(item => item.type === 'PHRASE').sort((a, b) => a.pos - b.pos);
    const grid = dom.cinemaMandalaGrid;

    // Build grid (all cells visible in cinema mode via CSS)
    grid.innerHTML = '';
    const sorted = [...group].sort((a, b) => a.pos - b.pos);
    sorted.forEach(item => {
      const cell = document.createElement('div');
      const isCenter = item.type === 'CENTER';
      cell.className = `mandala-cell ${isCenter ? 'center' : 'phrase'}`;
      cell.dataset.pos = item.pos;
      cell.innerHTML = `
        <span class="cell-target">${getTarget(item)}</span>
        <span class="cell-pron">${getPron(item)}</span>
        <span class="cell-native">${item.native}</span>
      `;
      grid.appendChild(cell);
    });

    // Speak center (target → native)
    highlightCinemaCell(center.pos);
    await checkPause(signal);
    await speakAsync(getTarget(center), state.targetLang);
    if (signal.aborted) return;
    await speakAsync(center.native, state.nativeLang);
    if (signal.aborted) return;
    await cinemaDelay(400, signal);
    // Speak each phrase
    for (const phrase of phrases) {
      if (signal.aborted) break;
      highlightCinemaCell(phrase.pos);
      await checkPause(signal);
      await speakAsync(getTarget(phrase), state.targetLang);
      if (signal.aborted) break;
      await speakAsync(phrase.native, state.nativeLang);
      if (signal.aborted) break;
      await cinemaDelay(400, signal);
    }

    // Extra pause before next mandala
    if (!signal.aborted) {
      await cinemaDelay(500, signal);
    }
  }

  function highlightCinemaCell(pos) {
    dom.cinemaMandalaGrid.querySelectorAll('.mandala-cell').forEach(c => {
      c.classList.remove('speaking');
      c.style.opacity = '0.4';
    });
    const cell = dom.cinemaMandalaGrid.querySelector(`[data-pos="${pos}"]`);
    if (cell) {
      cell.classList.add('speaking');
      cell.style.opacity = '1';
    }
  }

  function toggleCinemaPause() {
    if (!cinemaState.playing) return;
    cinemaState.paused = !cinemaState.paused;
    dom.cinemaPauseBtn.textContent = cinemaState.paused ? '▶' : '⏸';
    dom.cinemaPauseBtn.classList.toggle('paused', cinemaState.paused);

    // If resuming, resolve the pause promise
    if (!cinemaState.paused && cinemaState.pauseResolve) {
      cinemaState.pauseResolve();
      cinemaState.pauseResolve = null;
    }
  }

  function checkPause(signal) {
    if (!cinemaState.paused) return Promise.resolve();
    return new Promise((resolve, reject) => {
      cinemaState.pauseResolve = resolve;
      const onAbort = () => {
        cinemaState.pauseResolve = null;
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  function cinemaDelay(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (cinemaState.paused) {
          // Wait for resume before resolving
          cinemaState.pauseResolve = resolve;
        } else {
          resolve();
        }
      }, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }

  function stopCinema() {
    cinemaState.playing = false;
    cinemaState.paused = false;
    if (cinemaState.abort) {
      cinemaState.abort.abort();
      cinemaState.abort = null;
    }
    if (cinemaState.pauseResolve) {
      cinemaState.pauseResolve = null;
    }
    speechSynthesis.cancel();
    showScreen('basecamp', 'slide-right-enter');
  }

  // ── Initialize ───────────────────────────────
  function init() {
    cacheDom();
    setupSwipeGestures();
    setupKeyboard();

    // Auto-init if target language is pre-configured
    if (CONFIG.targetLang && LANGS[CONFIG.targetLang]) {
      // Hide gateway, go straight to native selection
      selectTarget(CONFIG.targetLang);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ───────────────────────────────
  return {
    selectTarget,
    selectNative,
    changeNative,
    setFilter,
    goGateway,
    goBasecamp,
    nextWord,
    prevWord,
    toggleAutoPlay,
    startCinema,
    stopCinema,
    toggleCinemaPause,
  };
})();
