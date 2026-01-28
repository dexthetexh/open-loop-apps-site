/*
 * EchoKeys - Musical Memory Game
 * NoteLoop Series by Open Loop Apps
 * Codename: EchoKeys-NoteLoop
 */

const STATES = {
  BOOT: "boot",
  AUDIO_UNLOCK: "audio_unlock",
  PLAYBACK: "playback",
  INPUT: "input",
  RESULT: "result",
};

const NOTES = {
  3: [262, 330, 392],
  5: [262, 294, 330, 392, 440],
  7: [262, 294, 330, 349, 392, 440, 494],
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

const STORE = {
  BEST: "echokeys_best",
  VIBRATION: "echokeys_vibration",
  DAILY_BEST: "echokeys_daily_best",
  DAILY_DATE: "echokeys_daily_date",
};

let gameState = {
  currentState: STATES.BOOT,
  level: 1,
  score: 0,

  bestScore: 0,
  dailyBest: 0,
  dailyDate: "",

  combo: 0,

  keyCount: 3,
  seqLen: 1,

  targetSequence: [],
  playerSequence: [],

  audioContext: null,
  masterGain: null,

  vibrationEnabled: true,
};

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
    saveProgress();
  }
}

function initAudio() {
  gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  gameState.masterGain = gameState.audioContext.createGain();
  gameState.masterGain.gain.value = CONFIG.MASTER_VOLUME;
  gameState.masterGain.connect(gameState.audioContext.destination);
}

function playNote(frequency, startTime, duration = CONFIG.NOTE_DURATION) {
  const ctx = gameState.audioContext;
  const now = startTime || ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = frequency;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);

  const attack = 0.01;
  const decay = 0.05;
  const sustain = 0.7;
  const release = 0.1;

  gain.gain.exponentialRampToValueAtTime(1.0, now + attack);
  gain.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

  osc.connect(gain);
  gain.connect(gameState.masterGain);

  osc.start(now);
  osc.stop(now + duration + release);
}

function vibrate(pattern) {
  if (!gameState.vibrationEnabled) return;
  if (!navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch {}
}

function vibrateKeyPress() { vibrate(50); }
function vibrateSuccess() { vibrate([100, 50, 100, 50, 150]); }
function vibrateError() { vibrate([200, 100, 200]); }

function disableKeys() {
  const c = document.getElementById("keys-container");
  if (!c) return;
  c.querySelectorAll(".key").forEach((k) => k.classList.add("disabled"));
}

function enableKeys() {
  const c = document.getElementById("keys-container");
  if (!c) return;
  c.querySelectorAll(".key").forEach((k) => k.classList.remove("disabled"));
}

function hideButtons() {
  const actions = document.getElementById("action-buttons");
  if (actions) actions.classList.add("hidden");
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

function setStatus(text, type) {
  const el = document.getElementById("status-message");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("success", "error");
  if (type) el.classList.add(type);
}

function updateDisplay() {
  const lvl = document.getElementById("level-display");
  const score = document.getElementById("score-display");
  const best = document.getElementById("best-display");
  const daily = document.getElementById("daily-display");

  if (lvl) lvl.textContent = String(gameState.level);
  if (score) score.textContent = String(gameState.score);
  if (best) best.textContent = String(gameState.bestScore);
  if (daily) daily.textContent = String(gameState.dailyBest);
}

function generateLevel() {
  if (gameState.level >= 16) gameState.keyCount = 7;
  else if (gameState.level >= 7) gameState.keyCount = 5;
  else gameState.keyCount = 3;

  gameState.seqLen = Math.min(6, 1 + Math.floor((gameState.level - 1) / 3));
  gameState.playerSequence = [];
  gameState.targetSequence = [];

  for (let i = 0; i < gameState.seqLen; i++) {
    gameState.targetSequence.push(Math.floor(Math.random() * gameState.keyCount));
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

  const basePoints = 10 * gameState.seqLen;
  const comboBonus = gameState.combo * 5;
  const levelBonus = Math.floor(gameState.level / 5) * 10;
  gameState.score += basePoints + comboBonus + levelBonus;

  ensureDailyFresh();

  let bestBumped = false;
  let dailyBumped = false;

  if (gameState.score > gameState.bestScore) { gameState.bestScore = gameState.score; bestBumped = true; }
  if (gameState.score > gameState.dailyBest) { gameState.dailyBest = gameState.score; dailyBumped = true; }

  if (bestBumped || dailyBumped) {
    saveProgress();
    if (bestBumped && dailyBumped) toast("New all-time & daily best!", "ok");
    else if (bestBumped) toast("New all-time best!", "ok");
    else toast("New daily best!", "ok");
  }

  updateDisplay();
}

function resetRun() {
  gameState.level = 1;
  gameState.score = 0;
  gameState.combo = 0;
  gameState.keyCount = 3;
  gameState.seqLen = 1;
  gameState.targetSequence = [];
  gameState.playerSequence = [];

  ensureDailyFresh();
  updateDisplay();
  generateLevel();
  renderKeys();
}

function animateKey(index, className) {
  const c = document.getElementById("keys-container");
  if (!c) return;
  const key = c.querySelector(`[data-index="${index}"]`);
  if (!key) return;
  key.classList.add(className);
  setTimeout(() => key.classList.remove(className), 300);
}

async function playSequence(notes) {
  if (!gameState.audioContext) return;

  disableKeys();
  hideButtons();
  setStatus("Listen carefully...", "");

  let t = gameState.audioContext.currentTime + CONFIG.PLAYBACK_LEAD_IN;

  for (let i = 0; i < notes.length; i++) {
    const idx = notes[i];
    const freq = NOTES[gameState.keyCount][idx];

    playNote(freq, t);

    setTimeout(() => {
      animateKey(idx, "active");
      vibrateKeyPress();
    }, Math.max(0, (t - gameState.audioContext.currentTime) * 1000));

    t += CONFIG.NOTE_DURATION + CONFIG.GAP_DURATION;
  }

  setTimeout(() => setState(STATES.INPUT), (t - gameState.audioContext.currentTime) * 1000 + CONFIG.INPUT_DELAY_AFTER_PLAYBACK);
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

  container.style.gridTemplateColumns = `repeat(${Math.min(gameState.keyCount, 3)}, 1fr)`;
  if (gameState.keyCount > 3) container.style.gridAutoFlow = "row";
}

function setState(state) {
  gameState.currentState = state;
  if (state === STATES.PLAYBACK) startPlayback();
  if (state === STATES.INPUT) startInput();
  if (state === STATES.RESULT) showResult();
}

function startGame() {
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
    vibrateSuccess();
    setStatus("✨ Perfect!", "success");
    toast("✅ Correct", "ok");
    advanceLevel();
    setTimeout(() => showButtons(["next"]), 450);
  } else {
    vibrateError();
    setStatus("❌ Not quite...", "error");
    toast("❌ Miss", "bad");
    updateDisplay();
    setTimeout(() => showButtons(["replay", "retry"]), 450);
  }
}

function nextLevel() {
  generateLevel();
  renderKeys();
  setState(STATES.PLAYBACK);
}

function retryLevel() {
  gameState.playerSequence = [];
  setStatus("Try again...", "");
  setTimeout(() => setState(STATES.PLAYBACK), 150);
}

function replaySequence() {
  gameState.playerSequence = [];
  setStatus("Replaying...", "");
  setTimeout(() => setState(STATES.PLAYBACK), 150);
}

function handleKeyPress(index) {
  if (gameState.currentState !== STATES.INPUT) return;

  playNote(NOTES[gameState.keyCount][index], gameState.audioContext.currentTime, 0.22);
  animateKey(index, "active");
  vibrateKeyPress();

  gameState.playerSequence.push(index);

  if (gameState.playerSequence.length >= gameState.seqLen) {
    setState(STATES.RESULT);
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE.BEST, String(gameState.bestScore));
    localStorage.setItem(STORE.VIBRATION, String(gameState.vibrationEnabled));
    localStorage.setItem(STORE.DAILY_BEST, String(gameState.dailyBest));
    localStorage.setItem(STORE.DAILY_DATE, String(gameState.dailyDate));
  } catch {}
}

function loadProgress() {
  try {
    const savedBest = localStorage.getItem(STORE.BEST);
    if (savedBest) gameState.bestScore = parseInt(savedBest, 10) || 0;

    const vib = localStorage.getItem(STORE.VIBRATION);
    if (vib !== null) gameState.vibrationEnabled = vib === "true";

    const savedDaily = localStorage.getItem(STORE.DAILY_BEST);
    if (savedDaily) gameState.dailyBest = parseInt(savedDaily, 10) || 0;

    const savedDate = localStorage.getItem(STORE.DAILY_DATE);
    if (savedDate) gameState.dailyDate = String(savedDate);

    const toggle = document.getElementById("vibration-toggle");
    if (toggle) toggle.checked = gameState.vibrationEnabled;
  } catch {}
}

function toggleSettings(forceOpen = null) {
  const panel = document.getElementById("settings-panel");
  if (!panel) return;

  const isHidden = panel.classList.contains("hidden");
  const shouldOpen = forceOpen === null ? isHidden : forceOpen;
  panel.classList.toggle("hidden", !shouldOpen);
}

document.addEventListener("DOMContentLoaded", () => {
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

  document.getElementById("vibration-toggle")?.addEventListener("change", (e) => {
    gameState.vibrationEnabled = !!e.target.checked;
    saveProgress();
    toast(gameState.vibrationEnabled ? "Vibration on" : "Vibration off", "ok");
  });

  loadProgress();
  ensureDailyFresh();
  updateDisplay();

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") toggleSettings(false);

    if (e.code === "KeyR") {
      const gc = document.getElementById("game-container");
      if (gc && !gc.classList.contains("hidden")) {
        toast("Run restarted", "ok");
        resetRun();
        setState(STATES.PLAYBACK);
      }
    }

    if (e.code === "Enter") {
      const overlay = document.getElementById("audio-unlock");
      if (overlay && !overlay.classList.contains("hidden")) startGame();
      else {
        const next = document.getElementById("next-btn");
        if (next && !next.classList.contains("hidden")) nextLevel();
      }
    }
  });
});
