/*
 * EchoKeys - Musical Memory Game
 * NoteLoop Series by Open Loop Apps
 * Codename: EchoKeys-NoteLoop
 *
 * STATE MACHINE:
 * BOOT → AUDIO_UNLOCK → MENU → PLAYBACK → INPUT → RESULT
 *
 * v1.3+ polish additions:
 * - Daily best tracking (local-only)
 * - Toast feedback layer
 * - Restart run (keeps best + settings)
 * - Hotkeys: Enter / R / Esc
 */

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const STATES = {
  BOOT: "boot",
  AUDIO_UNLOCK: "audio_unlock",
  MENU: "menu",
  PLAYBACK: "playback",
  INPUT: "input",
  RESULT: "result",
};

const NOTES = {
  3: [262, 330, 392], // C4, E4, G4 (3-key mode)
  5: [262, 294, 330, 392, 440], // C4, D4, E4, G4, A4 (5-key mode)
  7: [262, 294, 330, 349, 392, 440, 494], // C4-B4 (7-key mode)
};

const NOTE_LABELS = {
  3: ["Do", "Mi", "Sol"],
  5: ["Do", "Re", "Mi", "Sol", "La"],
  7: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"],
};

const CONFIG = {
  MASTER_VOLUME: 0.3,
  NOTE_DURATION: 0.35,
  GAP_DURATION: 0.18,
  PLAYBACK_LEAD_IN: 0.5,
  INPUT_DELAY_AFTER_PLAYBACK: 250,
};

// Storage keys (keep backward compatibility)
const STORE = {
  BEST: "echokeys_best", // all-time best (legacy)
  VIBRATION: "echokeys_vibration",
  DAILY_BEST: "echokeys_daily_best",
  DAILY_DATE: "echokeys_daily_date",
};

// ============================================================================
// STATE
// ============================================================================

let gameState = {
  currentState: STATES.BOOT,
  level: 1,
  score: 0,

  bestScore: 0, // all-time best
  dailyBest: 0,
  dailyDate: "",

  combo: 0,

  // Difficulty params
  keyCount: 3,
  seqLen: 1,
  tempoBPM: 60,

  // Current challenge
  targetSequence: [],
  playerSequence: [],

  // Audio
  audioContext: null,
  masterGain: null,

  // Settings
  vibrationEnabled: true,
};

// ============================================================================
// TOAST
// ============================================================================

let toastTimer = null;

function toast(msg, kind = "") {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = msg;
  el.className = "";
  el.classList.add("show");
  if (kind) el.classList.add(kind);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "";
  }, 750);
}

// ============================================================================
// DATE HELPERS (daily best)
// ============================================================================

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ensureDailyFresh() {
  const t = todayKey();
  if (gameState.dailyDate !== t) {
    gameState.dailyDate = t;
    gameState.dailyBest = 0;
    // Persist immediately so refresh doesn't resurrect yesterday
    saveProgress();
  }
}

// ============================================================================
// AUDIO SYSTEM
// ============================================================================

function initAudio() {
  gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Master gain node
  gameState.masterGain = gameState.audioContext.createGain();
  gameState.masterGain.gain.value = CONFIG.MASTER_VOLUME;
  gameState.masterGain.connect(gameState.audioContext.destination);

  console.log("Audio initialized");
}

function playNote(frequency, startTime, duration = CONFIG.NOTE_DURATION) {
  const ctx = gameState.audioContext;
  const now = startTime || ctx.currentTime;

  // Oscillator
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = frequency;

  // Envelope (ADSR-ish)
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);

  const attack = 0.01;
  const decay = 0.05;
  const sustain = 0.7;
  const release = 0.1;

  gain.gain.exponentialRampToValueAtTime(1.0, now + attack);
  gain.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

  // Connect
  osc.connect(gain);
  gain.connect(gameState.masterGain);

  osc.start(now);
  osc.stop(now + duration + release);
}

async function playSequence(notes) {
  if (!gameState.audioContext) return;

  disableKeys();
  hideButtons();

  setStatus("Listen carefully...", "");

  // Small lead-in to make playback feel intentional
  let t = gameState.audioContext.currentTime + CONFIG.PLAYBACK_LEAD_IN;

  for (let i = 0; i < notes.length; i++) {
    const idx = notes[i];
    const freq = NOTES[gameState.keyCount][idx];

    playNote(freq, t);

    // Visual highlight aligned to playback
    setTimeout(() => {
      animateKey(idx, "active");
      vibrateKeyPress();
    }, Math.max(0, (t - gameState.audioContext.currentTime) * 1000));

    t += CONFIG.NOTE_DURATION + CONFIG.GAP_DURATION;
  }

  setTimeout(() => {
    setState(STATES.INPUT);
  }, (t - gameState.audioContext.currentTime) * 1000 + CONFIG.INPUT_DELAY_AFTER_PLAYBACK);
}

function playFeedbackSound(success) {
  if (!gameState.audioContext) return;

  const now = gameState.audioContext.currentTime;
  const freq = success ? 880 : 220;

  playNote(freq, now, success ? 0.12 : 0.18);
}

// ============================================================================
// HAPTICS
// ============================================================================

function vibrate(pattern) {
  if (!gameState.vibrationEnabled) return;
  if (!navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch (_) {}
}

function vibrateKeyPress() {
  vibrate(50);
}

function vibrateSuccess() {
  vibrate([100, 50, 100, 50, 150]);
}

function vibrateError() {
  vibrate([200, 100, 200]);
}

// ============================================================================
// GAME LOGIC
// ============================================================================

function generateLevel() {
  // Difficulty scaling
  if (gameState.level >= 16) {
    gameState.keyCount = 7;
  } else if (gameState.level >= 7) {
    gameState.keyCount = 5;
  } else {
    gameState.keyCount = 3;
  }

  // Sequence length: 1–6
  gameState.seqLen = Math.min(6, 1 + Math.floor((gameState.level - 1) / 3));

  // Reset sequences
  gameState.playerSequence = [];
  gameState.targetSequence = [];

  for (let i = 0; i < gameState.seqLen; i++) {
    const idx = Math.floor(Math.random() * gameState.keyCount);
    gameState.targetSequence.push(idx);
  }
}

function checkInput() {
  if (gameState.playerSequence.length !== gameState.targetSequence.length) return false;

  for (let i = 0; i < gameState.targetSequence.length; i++) {
    if (gameState.playerSequence[i] !== gameState.targetSequence[i]) return false;
  }
  return true;
}

function advanceLevel() {
  gameState.level++;
  gameState.combo++;

  // Score: base points + combo bonus
  const basePoints = 10 * gameState.seqLen;
  const comboBonus = gameState.combo * 5;
  const levelBonus = Math.floor(gameState.level / 5) * 10;

  gameState.score += basePoints + comboBonus + levelBonus;

  ensureDailyFresh();

  // Update best scores (persist if improved)
  let bestBumped = false;
  let dailyBumped = false;

  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = gameState.score;
    bestBumped = true;
  }
  if (gameState.score > gameState.dailyBest) {
    gameState.dailyBest = gameState.score;
    dailyBumped = true;
  }

  if (bestBumped || dailyBumped) {
    saveProgress();
    if (bestBumped && dailyBumped) toast("New all-time & daily best!", "ok");
    else if (bestBumped) toast("New all-time best!", "ok");
    else if (dailyBumped) toast("New daily best!", "ok");
  }

  updateDisplay();
}

function failLevel() {
  gameState.combo = 0;
  // Don't reset level or score - let player retry
}

function resetRun() {
  // Keep best/daily + settings, reset only the run state
  gameState.level = 1;
  gameState.score = 0;
  gameState.combo = 0;

  gameState.keyCount = 3;
  gameState.seqLen = 1;
  gameState.tempoBPM = 60;

  gameState.targetSequence = [];
  gameState.playerSequence = [];

  ensureDailyFresh();
  updateDisplay();
  generateLevel();
  renderKeys();
}

// ============================================================================
// UI HELPERS
// ============================================================================

function updateDisplay() {
  const lvl = document.getElementById("level-display");
  const score = document.getElementById("score-display");
  const best = document.getElementById("best-display");
  const daily = document.getElementById("daily-display");

  if (lvl) lvl.textContent = gameState.level;
  if (score) score.textContent = gameState.score;
  if (best) best.textContent = gameState.bestScore;
  if (daily) daily.textContent = gameState.dailyBest;
}

function setStatus(text, type) {
  const el = document.getElementById("status-message");
  if (!el) return;

  el.textContent = text;
  el.classList.remove("success", "error");
  if (type) el.classList.add(type);
}

function renderKeys() {
  const container = document.getElementById("keys-container");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < gameState.keyCount; i++) {
    const key = document.createElement("div");
    key.className = "key";
    key.dataset.index = String(i);

    const label = document.createElement("div");
    label.className = "key-label";
    label.textContent = NOTE_LABELS[gameState.keyCount][i];

    const note = document.createElement("div");
    note.className = "key-note";
    note.textContent = `${NOTES[gameState.keyCount][i]} Hz`;

    key.appendChild(label);
    key.appendChild(note);

    key.addEventListener("click", () => handleKeyPress(i));

    container.appendChild(key);
  }

  // Responsive grid rows
  container.style.gridTemplateColumns = `repeat(${Math.min(gameState.keyCount, 3)}, 1fr)`;
  if (gameState.keyCount > 3) container.style.gridAutoFlow = "row";
}

function animateKey(index, className) {
  const container = document.getElementById("keys-container");
  if (!container) return;

  const key = container.querySelector(`[data-index="${index}"]`);
  if (!key) return;

  key.classList.add(className);
  setTimeout(() => {
    key.classList.remove(className);
  }, 300);
}

function disableKeys() {
  const container = document.getElementById("keys-container");
  if (!container) return;
  container.querySelectorAll(".key").forEach((k) => k.classList.add("disabled"));
}

function enableKeys() {
  const container = document.getElementById("keys-container");
  if (!container) return;
  container.querySelectorAll(".key").forEach((k) => k.classList.remove("disabled"));
}

function showButtons(which) {
  const actions = document.getElementById("action-buttons");
  const replay = document.getElementById("replay-btn");
  const next = document.getElementById("next-btn");
  const retry = document.getElementById("retry-btn");

  if (actions) actions.classList.remove("hidden");

  const want = new Set(which || []);

  if (replay) replay.classList.toggle("hidden", !want.has("replay"));
  if (next) next.classList.toggle("hidden", !want.has("next"));
  if (retry) retry.classList.toggle("hidden", !want.has("retry"));
}

function hideButtons() {
  const actions = document.getElementById("action-buttons");
  if (actions) actions.classList.add("hidden");
}

function setState(state) {
  gameState.currentState = state;

  switch (state) {
    case STATES.PLAYBACK:
      startPlayback();
      break;
    case STATES.INPUT:
      startInput();
      break;
    case STATES.RESULT:
      showResult();
      break;
    default:
      break;
  }
}

// ============================================================================
// GAME FLOW
// ============================================================================

function startGame() {
  // Unlock audio on user interaction (browser requirement)
  if (!gameState.audioContext) initAudio();

  document.getElementById("audio-unlock")?.classList.add("hidden");
  document.getElementById("game-container")?.classList.remove("hidden");

  loadProgress();
  ensureDailyFresh();
  updateDisplay();

  generateLevel();
  renderKeys();

  setState(STATES.PLAYBACK);
}

function startPlayback() {
  hideButtons();
  disableKeys();
  playSequence(gameState.targetSequence);
}

function startInput() {
  enableKeys();
  gameState.playerSequence = [];
  setStatus(`Your turn: ${gameState.seqLen} note${gameState.seqLen === 1 ? "" : "s"}`, "");
}

function showResult() {
  disableKeys();

  const success = checkInput();

  if (success) {
    playFeedbackSound(true);
    vibrateSuccess();
    setStatus("✨ Perfect!", "success");
    toast("✅ Correct", "ok");

    advanceLevel();

    setTimeout(() => {
      showButtons(["next"]);
    }, 450);
  } else {
    playFeedbackSound(false);
    vibrateError();
    setStatus("❌ Not quite...", "error");
    toast("❌ Miss", "bad");

    failLevel();
    updateDisplay();

    setTimeout(() => {
      showButtons(["replay", "retry"]);
    }, 450);
  }
}

function nextLevel() {
  generateLevel();
  renderKeys();
  setState(STATES.PLAYBACK);
}

function retryLevel() {
  // Same level, same target, clear input
  gameState.playerSequence = [];
  setStatus("Try again...", "");
  setTimeout(() => {
    setState(STATES.PLAYBACK);
  }, 150);
}

function replaySequence() {
  // Replay current target and ensure input is cleared (v1.3 fix)
  gameState.playerSequence = [];
  setStatus("Replaying...", "");
  setTimeout(() => {
    setState(STATES.PLAYBACK);
  }, 150);
}

function handleKeyPress(index) {
  if (gameState.currentState !== STATES.INPUT) return;

  // Audio feedback
  if (gameState.audioContext) {
    playNote(NOTES[gameState.keyCount][index], gameState.audioContext.currentTime, 0.22);
  }

  animateKey(index, "active");
  vibrateKeyPress();

  gameState.playerSequence.push(index);

  // Auto-evaluate when done
  if (gameState.playerSequence.length >= gameState.seqLen) {
    setState(STATES.RESULT);
  }
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function saveProgress() {
  try {
    localStorage.setItem(STORE.BEST, String(gameState.bestScore));
    localStorage.setItem(STORE.VIBRATION, String(gameState.vibrationEnabled));

    // daily best tracking (new)
    localStorage.setItem(STORE.DAILY_BEST, String(gameState.dailyBest));
    localStorage.setItem(STORE.DAILY_DATE, String(gameState.dailyDate));
  } catch (e) {
    console.log("localStorage not available");
  }
}

function loadProgress() {
  try {
    const savedBest = localStorage.getItem(STORE.BEST);
    if (savedBest) gameState.bestScore = parseInt(savedBest, 10) || 0;

    const vibrationSetting = localStorage.getItem(STORE.VIBRATION);
    if (vibrationSetting !== null) {
      gameState.vibrationEnabled = vibrationSetting === "true";
      updateVibrationToggle();
    }

    // daily best (new; safe if missing)
    const savedDaily = localStorage.getItem(STORE.DAILY_BEST);
    if (savedDaily) gameState.dailyBest = parseInt(savedDaily, 10) || 0;

    const savedDate = localStorage.getItem(STORE.DAILY_DATE);
    if (savedDate) gameState.dailyDate = String(savedDate);
  } catch (e) {
    console.log("localStorage not available");
  }
}

function updateVibrationToggle() {
  const toggle = document.getElementById("vibration-toggle");
  if (toggle) toggle.checked = gameState.vibrationEnabled;
}

// ============================================================================
// SETTINGS
// ============================================================================

function toggleSettings(forceOpen = null) {
  const panel = document.getElementById("settings-panel");
  if (!panel) return;

  const isHidden = panel.classList.contains("hidden");
  const shouldOpen = forceOpen === null ? isHidden : forceOpen;

  panel.classList.toggle("hidden", !shouldOpen);
}

function handleVibrationToggle(e) {
  gameState.vibrationEnabled = !!e.target.checked;
  saveProgress();
  toast(gameState.vibrationEnabled ? "Vibration on" : "Vibration off", "ok");
}

// ============================================================================
// BOOTSTRAP
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Buttons
  document.getElementById("start-btn")?.addEventListener("click", startGame);

  document.getElementById("replay-btn")?.addEventListener("click", replaySequence);
  document.getElementById("next-btn")?.addEventListener("click", nextLevel);
  document.getElementById("retry-btn")?.addEventListener("click", retryLevel);

  document.getElementById("settings-btn")?.addEventListener("click", () => toggleSettings());
  document.getElementById("close-settings-btn")?.addEventListener("click", () => toggleSettings(false));
  document.getElementById("restart-btn")?.addEventListener("click", () => {
    toggleSettings(false);
    toast("Run restarted", "ok");
    resetRun();
    setState(STATES.PLAYBACK);
  });

  document.getElementById("vibration-toggle")?.addEventListener("change", handleVibrationToggle);

  // Load persisted values early so header renders correctly even before start
  loadProgress();
  ensureDailyFresh();
  updateDisplay();

  // Hotkeys
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      toggleSettings(false);
      return;
    }

    if (e.code === "KeyR") {
      // Restart run (only if already in game container)
      const gc = document.getElementById("game-container");
      if (gc && !gc.classList.contains("hidden")) {
        toast("Run restarted", "ok");
        resetRun();
        setState(STATES.PLAYBACK);
      }
      return;
    }

    if (e.code === "Enter") {
      // Start from overlay, or advance when "Next" is visible
      const overlay = document.getElementById("audio-unlock");
      if (overlay && !overlay.classList.contains("hidden")) {
        startGame();
        return;
      }

      const next = document.getElementById("next-btn");
      if (next && !next.classList.contains("hidden")) {
        nextLevel();
      }
    }
  });
});
