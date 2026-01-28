'use strict';

/*
  ScaleTrainer - Note Recognition Game
  NoteLoop Series by Open Loop Apps

  Goals (EchoKeys style):
  - Fast boot, zero dependencies
  - Deterministic state updates
  - Mobile-first (touch + haptics)
*/

const GAME_MODES = Object.freeze({
  VISUAL: 'visual',
  AUDIO: 'audio',
  NAME: 'name'
});

// MIDI -> metadata (subset for this build)
const NOTE_DATA = Object.freeze({
  60: { name: 'C', octave: 4, frequency: 261.63, staffPos: 0 },
  61: { name: 'C#', octave: 4, frequency: 277.18, staffPos: 0 },
  62: { name: 'D', octave: 4, frequency: 293.66, staffPos: 1 },
  63: { name: 'D#', octave: 4, frequency: 311.13, staffPos: 1 },
  64: { name: 'E', octave: 4, frequency: 329.63, staffPos: 2 },
  65: { name: 'F', octave: 4, frequency: 349.23, staffPos: 3 },
  66: { name: 'F#', octave: 4, frequency: 369.99, staffPos: 3 },
  67: { name: 'G', octave: 4, frequency: 392.0, staffPos: 4 },
  68: { name: 'G#', octave: 4, frequency: 415.3, staffPos: 4 },
  69: { name: 'A', octave: 4, frequency: 440.0, staffPos: 5 },
  70: { name: 'A#', octave: 4, frequency: 466.16, staffPos: 5 },
  71: { name: 'B', octave: 4, frequency: 493.88, staffPos: 6 },
  72: { name: 'C', octave: 5, frequency: 523.25, staffPos: 7 },
  73: { name: 'C#', octave: 5, frequency: 554.37, staffPos: 7 },
  74: { name: 'D', octave: 5, frequency: 587.33, staffPos: 8 },
  75: { name: 'D#', octave: 5, frequency: 622.25, staffPos: 8 },
  76: { name: 'E', octave: 5, frequency: 659.25, staffPos: 9 }
});

// White keys are laid out with flex; black keys are absolutely positioned over them.
const PIANO_BLACK_KEYS = Object.freeze([
  { midi: 61, left: 40 },
  { midi: 63, left: 100 },
  { midi: 66, left: 220 },
  { midi: 68, left: 280 },
  { midi: 70, left: 340 },
  { midi: 73, left: 460 },
  { midi: 75, left: 520 }
]);

const CONFIG = Object.freeze({
  NOTE_DURATION: 0.5,
  ATTACK: 0.01,
  DECAY: 0.05,
  SUSTAIN: 0.7,
  RELEASE: 0.2,
  MASTER_VOLUME: 0.3,
  QUESTIONS_PER_LEVEL: 10,
  PASS_ACCURACY: 80
});

const storage = {
  get(key, fallback = null) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); } catch {}
  }
};

const state = {
  mode: GAME_MODES.VISUAL,
  level: 1,
  score: 0,
  bestScore: 0,

  questionNumber: 1,
  correctMidi: null,
  correctAnswers: 0,

  tutorialStep: 0,
  tutorialCompleted: false,
  quizCompleted: false,
  quizIndex: 0,

  vibrationEnabled: true,
  soundEnabled: true,

  audioContext: null,
  masterGain: null
};

// -----------------------------
// DOM helpers
// -----------------------------

const $ = (id) => document.getElementById(id);

function setHidden(el, hidden) {
  el.classList.toggle('hidden', !!hidden);
}

function setStatus(message, className = '') {
  const el = $('status-message');
  el.textContent = message;
  el.className = `status-message ${className}`.trim();
}

// -----------------------------
// Audio + haptics
// -----------------------------

function ensureAudio() {
  if (state.audioContext) return;

  const Ctx = window.AudioContext || window.webkitAudioContext;
  state.audioContext = new Ctx();
  state.masterGain = state.audioContext.createGain();
  state.masterGain.gain.value = CONFIG.MASTER_VOLUME;
  state.masterGain.connect(state.audioContext.destination);
}

async function resumeAudioIfNeeded() {
  if (!state.audioContext) return;
  if (state.audioContext.state === 'suspended') {
    try { await state.audioContext.resume(); } catch {}
  }
}

function playNote(freq, duration = CONFIG.NOTE_DURATION) {
  if (!state.soundEnabled) return;
  if (!state.audioContext || !state.masterGain) return;

  const ctx = state.audioContext;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(1, now + CONFIG.ATTACK);
  gain.gain.linearRampToValueAtTime(CONFIG.SUSTAIN, now + CONFIG.ATTACK + CONFIG.DECAY);
  gain.gain.setValueAtTime(CONFIG.SUSTAIN, now + Math.max(0, duration - CONFIG.RELEASE));
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(state.masterGain);

  osc.start(now);
  osc.stop(now + duration);
}

function playFeedback(success) {
  if (!state.soundEnabled) return;
  const ok = [523, 659, 784];
  const bad = [330, 262];
  if (success) {
    playNote(ok[0], 0.15);
    setTimeout(() => playNote(ok[1], 0.15), 80);
    setTimeout(() => playNote(ok[2], 0.2), 160);
  } else {
    playNote(bad[0], 0.2);
    setTimeout(() => playNote(bad[1], 0.3), 150);
  }
}

function vibrate(pattern) {
  if (!state.vibrationEnabled) return;
  if (!navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch {}
}

const haptics = {
  tap: () => vibrate(50),
  ok: () => vibrate([100, 50, 100, 50, 150]),
  bad: () => vibrate([200, 100, 200])
};

// -----------------------------
// Persistence
// -----------------------------

function loadProgress() {
  const best = storage.get('scaletrainer_best', '0');
  state.bestScore = Number.parseInt(best, 10) || 0;

  const vib = storage.get('scaletrainer_vibration', 'true');
  state.vibrationEnabled = vib === 'true';

  const snd = storage.get('scaletrainer_sound', 'true');
  state.soundEnabled = snd === 'true';

  const tut = storage.get('scaletrainer_tutorial_completed', 'false');
  state.tutorialCompleted = tut === 'true';

  $('vibration-toggle').checked = state.vibrationEnabled;
  $('sound-toggle').checked = state.soundEnabled;
}

function saveProgress() {
  storage.set('scaletrainer_best', String(state.bestScore));
  storage.set('scaletrainer_vibration', String(state.vibrationEnabled));
  storage.set('scaletrainer_sound', String(state.soundEnabled));
}

function saveTutorialDone() {
  storage.set('scaletrainer_tutorial_completed', 'true');
}

// -----------------------------
// Game logic
// -----------------------------

function availableNotesForLevel(level) {
  if (level <= 3) return [60, 62, 64, 65, 67]; // C-G
  if (level <= 6) return [60, 62, 64, 65, 67, 69, 71]; // C-B
  if (level <= 10) return [60, 62, 64, 65, 67, 69, 71, 72]; // +C5
  return [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]; // add accidentals
}

function pickQuestion() {
  const pool = availableNotesForLevel(state.level);
  state.correctMidi = pool[Math.floor(Math.random() * pool.length)];
}

function updateHeader() {
  $('level-display').textContent = String(state.level);
  $('score-display').textContent = String(state.score);
  $('best-display').textContent = String(state.bestScore);
}

function updateProgress() {
  const pct = ((state.questionNumber - 1) / CONFIG.QUESTIONS_PER_LEVEL) * 100;
  $('progress-fill').style.width = `${pct}%`;
  $('question-number').textContent = `Question ${state.questionNumber} / ${CONFIG.QUESTIONS_PER_LEVEL}`;
}

function showQuestion() {
  const staffSvg = $('staff-svg');
  const noteName = $('note-name-display');
  const audioBox = $('audio-mode-display');

  staffSvg.style.display = 'none';
  setHidden(noteName, true);
  setHidden(audioBox, true);

  const note = NOTE_DATA[state.correctMidi];

  if (state.mode === GAME_MODES.VISUAL) {
    staffSvg.style.display = 'block';
    renderStaff();
    drawNoteOnStaff(state.correctMidi);
    setStatus('Click the correct note on the piano');
  } else if (state.mode === GAME_MODES.AUDIO) {
    setHidden(audioBox, false);
    setStatus('Listen and find the note');
    setTimeout(() => playNote(note.frequency), 250);
  } else {
    setHidden(noteName, false);
    $('note-name-text').textContent = `${note.name}${note.octave}`;
    setStatus('Find this note on the piano');
  }
}

function handleAnswer(midi) {
  const clicked = NOTE_DATA[midi];
  if (!clicked) return;

  playNote(clicked.frequency);
  haptics.tap();

  const keyEl = document.querySelector(`[data-midi="${midi}"]`);
  if (!keyEl) return;

  if (midi === state.correctMidi) {
    keyEl.classList.add('correct');
    playFeedback(true);
    haptics.ok();
    setStatus('✨ Correct!', 'success');

    state.correctAnswers += 1;
    state.score += 15; // base + “speed” baked in

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      saveProgress();
    }

    updateHeader();

    setTimeout(() => {
      keyEl.classList.remove('correct');
      advance();
    }, 650);
  } else {
    keyEl.classList.add('incorrect');
    playFeedback(false);
    haptics.bad();
    setStatus('❌ Try again', 'error');
    setTimeout(() => keyEl.classList.remove('incorrect'), 350);
  }
}

function advance() {
  state.questionNumber += 1;

  if (state.questionNumber > CONFIG.QUESTIONS_PER_LEVEL) {
    const accuracy = (state.correctAnswers / CONFIG.QUESTIONS_PER_LEVEL) * 100;
    if (accuracy >= CONFIG.PASS_ACCURACY) {
      const prev = state.level;
      state.level += 1;
      setStatus(`🎉 Level ${prev} complete. Level ${state.level} unlocked.`, 'success');
    } else {
      setStatus(`Try again: ${accuracy.toFixed(0)}% (need ${CONFIG.PASS_ACCURACY}%).`, 'error');
    }

    updateHeader();

    setTimeout(() => {
      state.questionNumber = 1;
      state.correctAnswers = 0;
      pickQuestion();
      showQuestion();
      updateProgress();
    }, 1200);

    return;
  }

  pickQuestion();
  showQuestion();
  updateProgress();
}

// -----------------------------
// Rendering: piano + staff
// -----------------------------

function renderPiano() {
  const root = $('piano-keyboard');
  root.innerHTML = '';

  // White keys in order (C4..E5)
  const white = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76];
  for (const midi of white) {
    const note = NOTE_DATA[midi];
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'piano-key white';
    key.dataset.midi = String(midi);
    key.setAttribute('aria-label', `Key ${note.name}${note.octave}`);
    key.innerHTML = `<div class="key-label">${note.name}${note.octave}</div>`;
    key.addEventListener('click', () => handleAnswer(midi));
    root.appendChild(key);
  }

  // Black keys overlay (pixel offsets assume 60px white width; matches CSS defaults)
  for (const bk of PIANO_BLACK_KEYS) {
    const note = NOTE_DATA[bk.midi];
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'piano-key black';
    key.dataset.midi = String(bk.midi);
    key.style.left = `${bk.left}px`;
    key.setAttribute('aria-label', `Key ${note.name}${note.octave}`);
    key.innerHTML = `<div class="key-label">${note.name}${note.octave}</div>`;
    key.addEventListener('click', () => handleAnswer(bk.midi));
    root.appendChild(key);
  }
}

function renderStaff() {
  const svg = $('staff-svg');
  svg.innerHTML = '';

  const staffY = 60;
  const lineSpacing = 15;

  for (let i = 0; i < 5; i++) {
    const y = staffY + i * lineSpacing;
    svg.appendChild(svgLine(50, y, 350, y, 'staff-line'));
  }

  const clef = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  clef.setAttribute('x', '60');
  clef.setAttribute('y', String(staffY + 50));
  clef.setAttribute('font-size', '80');
  clef.setAttribute('fill', '#f1f5f9');
  clef.textContent = '𝄞';
  svg.appendChild(clef);
}

function drawNoteOnStaff(midi) {
  const svg = $('staff-svg');
  const note = NOTE_DATA[midi];
  if (!note) return;

  const staffY = 60;
  const lineSpacing = 15;
  const noteX = 210;

  // staffPos mapping:
  // 2 = E4 bottom line; each +1 is a half-step (line/space) upward
  const baseY = staffY + 4 * lineSpacing; // E4 bottom line
  const noteY = baseY - ((note.staffPos - 2) * (lineSpacing / 2));

  // ledger lines (below staff: staffPos < 2; above staff: staffPos > 10-ish)
  if (note.staffPos < 2) {
    for (let pos = 2; pos >= note.staffPos; pos -= 2) {
      const y = baseY + ((2 - pos) * (lineSpacing / 2));
      svg.appendChild(svgLine(noteX - 15, y, noteX + 15, y, 'ledger-line'));
    }
  } else if (note.staffPos > 10) {
    for (let pos = 8; pos <= note.staffPos; pos += 2) {
      const y = baseY - ((pos - 2) * (lineSpacing / 2));
      svg.appendChild(svgLine(noteX - 15, y, noteX + 15, y, 'ledger-line'));
    }
  }

  const head = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  head.setAttribute('cx', String(noteX));
  head.setAttribute('cy', String(noteY));
  head.setAttribute('rx', '8');
  head.setAttribute('ry', '6');
  head.setAttribute('class', 'note-head');
  svg.appendChild(head);

  const stemUp = note.staffPos >= 4;
  const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  if (stemUp) {
    stem.setAttribute('x1', String(noteX + 7));
    stem.setAttribute('y1', String(noteY));
    stem.setAttribute('x2', String(noteX + 7));
    stem.setAttribute('y2', String(noteY - 40));
  } else {
    stem.setAttribute('x1', String(noteX - 7));
    stem.setAttribute('y1', String(noteY));
    stem.setAttribute('x2', String(noteX - 7));
    stem.setAttribute('y2', String(noteY + 40));
  }
  stem.setAttribute('class', 'note-stem');
  svg.appendChild(stem);

  if (note.name.includes('#')) {
    const sharp = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sharp.setAttribute('x', String(noteX - 25));
    sharp.setAttribute('y', String(noteY + 5));
    sharp.setAttribute('font-size', '20');
    sharp.setAttribute('fill', '#f1f5f9');
    sharp.textContent = '♯';
    svg.appendChild(sharp);
  }
}

function svgLine(x1, y1, x2, y2, cls) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('class', cls);
  return line;
}

// -----------------------------
// Tutorial rendering + quiz
// -----------------------------

function showTutorial() {
  setHidden($('audio-unlock'), true);
  setHidden($('tutorial-overlay'), false);
  renderTutorialStep(0);
}

function renderTutorialStep(step) {
  state.tutorialStep = step;

  document.querySelectorAll('.tutorial-dots .dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === step);
    dot.classList.toggle('completed', idx < step);
  });

  document.querySelectorAll('.tutorial-step').forEach((el, idx) => {
    el.classList.toggle('active', idx === step);
  });

  $('tutorial-back-btn').disabled = step === 0;

  const nextBtn = $('tutorial-next-btn');
  const startBtn = $('tutorial-start-btn');

  if (step === 5) {
    startBtn.classList.add('hidden');
    nextBtn.classList.toggle('hidden', !state.quizCompleted);
    initQuiz();
  } else if (step === 6) {
    nextBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.remove('hidden');
    startBtn.classList.add('hidden');
  }

  if (step === 1) renderTutorialStaff();
  if (step === 2) renderTutorialClef();
  if (step === 3) renderTutorialNote();
  if (step === 4) renderTutorialPiano();
}

function renderTutorialStaff() {
  const g = $('tutorial-staff-lines');
  g.innerHTML = '';
  const staffY = 30, spacing = 15;

  for (let i = 0; i < 5; i++) {
    const y = staffY + i * spacing;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '30');
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', '270');
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', '#94a3b8');
    line.setAttribute('stroke-width', '2');
    g.appendChild(line);
  }
}

function renderTutorialClef() {
  const g = $('tutorial-clef-display');
  g.innerHTML = '';

  const staffY = 30, spacing = 15;
  for (let i = 0; i < 5; i++) {
    const y = staffY + i * spacing;
    g.appendChild(svgLine(30, y, 270, y, ''));
    g.lastChild.setAttribute('stroke', '#94a3b8');
    g.lastChild.setAttribute('stroke-width', '2');
  }

  const clef = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  clef.setAttribute('x', '50');
  clef.setAttribute('y', String(staffY + 50));
  clef.setAttribute('font-size', '70');
  clef.setAttribute('fill', '#6366f1');
  clef.textContent = '𝄞';
  g.appendChild(clef);
}

function renderTutorialNote() {
  const g = $('tutorial-note-anatomy');
  g.innerHTML = '';

  const staffY = 40, spacing = 15;
  for (let i = 0; i < 5; i++) {
    const y = staffY + i * spacing;
    g.appendChild(svgLine(30, y, 270, y, ''));
    g.lastChild.setAttribute('stroke', '#94a3b8');
    g.lastChild.setAttribute('stroke-width', '2');
  }

  const noteX = 150;
  const noteY = staffY + 2 * spacing;

  const head = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  head.setAttribute('cx', String(noteX));
  head.setAttribute('cy', String(noteY));
  head.setAttribute('rx', '10');
  head.setAttribute('ry', '8');
  head.setAttribute('fill', '#6366f1');
  g.appendChild(head);

  const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  stem.setAttribute('x1', String(noteX + 9));
  stem.setAttribute('y1', String(noteY));
  stem.setAttribute('x2', String(noteX + 9));
  stem.setAttribute('y2', String(noteY - 50));
  stem.setAttribute('stroke', '#6366f1');
  stem.setAttribute('stroke-width', '2.5');
  g.appendChild(stem);
}

function renderTutorialPiano() {
  const container = $('tutorial-piano-display');
  container.innerHTML = '';

  const row = document.createElement('div');
  row.className = 'tutorial-piano-row';

  const keys = [
    { midi: 60, label: 'C' },
    { midi: 62, label: 'D' },
    { midi: 64, label: 'E' },
    { midi: 65, label: 'F' },
    { midi: 67, label: 'G' },
    { midi: 69, label: 'A' },
    { midi: 71, label: 'B' }
  ];

  for (const k of keys) {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'tutorial-piano-key white';
    key.innerHTML = `<div class="tutorial-key-label">${k.label}</div>`;
    key.addEventListener('click', () => {
      const note = NOTE_DATA[k.midi];
      if (!note) return;
      playNote(note.frequency, 0.5);
    });
    row.appendChild(key);
  }

  container.appendChild(row);
}

function initQuiz() {
  state.quizIndex = 0;
  state.quizCompleted = false;

  document.querySelectorAll('.quiz-question').forEach((q, idx) => {
    q.classList.toggle('hidden', idx !== 0);
    q.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('correct', 'incorrect');
    });
    const fb = q.querySelector('.quiz-feedback');
    fb.className = 'quiz-feedback';
    fb.textContent = '';
  });

  document.querySelector('.quiz-complete')?.classList.add('hidden');
}

function handleQuizClick(target) {
  if (!target.classList.contains('quiz-option')) return;
  const question = target.closest('.quiz-question');
  if (!question) return;

  const options = question.querySelectorAll('.quiz-option');
  options.forEach((b) => (b.disabled = true));

  const feedback = question.querySelector('.quiz-feedback');
  const ok = target.dataset.answer === 'correct';

  if (ok) {
    target.classList.add('correct');
    feedback.textContent = '✓ Correct!';
    feedback.classList.add('show', 'correct');

    setTimeout(() => {
      state.quizIndex += 1;
      if (state.quizIndex < 3) {
        document.querySelectorAll('.quiz-question').forEach((q, idx) => {
          q.classList.toggle('hidden', idx !== state.quizIndex);
        });
      } else {
        document.querySelectorAll('.quiz-question').forEach((q) => q.classList.add('hidden'));
        document.querySelector('.quiz-complete')?.classList.remove('hidden');
        state.quizCompleted = true;
        $('tutorial-next-btn').classList.remove('hidden');
      }
    }, 700);
  } else {
    target.classList.add('incorrect');
    feedback.textContent = '✗ Try again!';
    feedback.classList.add('show', 'incorrect');

    setTimeout(() => {
      options.forEach((b) => (b.disabled = false));
      target.classList.remove('incorrect');
      feedback.className = 'quiz-feedback';
      feedback.textContent = '';
    }, 900);
  }
}

// -----------------------------
// UI wiring
// -----------------------------

function switchMode(mode) {
  state.mode = mode;

  document.querySelectorAll('.mode-btn').forEach((btn) => btn.classList.remove('active'));
  $('mode-' + mode).classList.add('active');

  state.questionNumber = 1;
  state.correctAnswers = 0;

  pickQuestion();
  showQuestion();
  updateProgress();
}

function toggleSettings() {
  $('settings-panel').classList.toggle('hidden');
}

function startGame() {
  setHidden($('audio-unlock'), true);
  setHidden($('tutorial-overlay'), true);
  setHidden($('game-container'), false);

  loadProgress();
  updateHeader();
  renderPiano();

  state.questionNumber = 1;
  state.correctAnswers = 0;
  state.score = 0;

  pickQuestion();
  showQuestion();
  updateProgress();
}

function completeTutorialAndStart() {
  state.tutorialCompleted = true;
  saveTutorialDone();
  startGame();
}

// -----------------------------
// Boot
// -----------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  updateHeader();

  $('start-btn').addEventListener('click', async () => {
    ensureAudio();
    await resumeAudioIfNeeded();

    if (state.tutorialCompleted) startGame();
    else showTutorial();
  });

  // Tutorial nav
  $('tutorial-next-btn').addEventListener('click', () => {
    if (state.tutorialStep === 5 && !state.quizCompleted) return;
    if (state.tutorialStep < 6) renderTutorialStep(state.tutorialStep + 1);
  });

  $('tutorial-back-btn').addEventListener('click', () => {
    if (state.tutorialStep > 0) renderTutorialStep(state.tutorialStep - 1);
  });

  $('tutorial-skip-btn').addEventListener('click', completeTutorialAndStart);
  $('tutorial-start-btn').addEventListener('click', completeTutorialAndStart);

  // Tutorial dots: allow jump back (not forward)
  document.querySelectorAll('.tutorial-dots .dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const step = Number.parseInt(dot.dataset.step, 10);
      if (Number.isFinite(step) && step <= state.tutorialStep) renderTutorialStep(step);
    });
  });

  // Quiz delegation
  $('quiz-container').addEventListener('click', (e) => handleQuizClick(e.target));

  // Mode buttons
  $('mode-visual').addEventListener('click', () => switchMode(GAME_MODES.VISUAL));
  $('mode-audio').addEventListener('click', () => switchMode(GAME_MODES.AUDIO));
  $('mode-name').addEventListener('click', () => switchMode(GAME_MODES.NAME));

  // Audio mode replay
  $('play-note-btn').addEventListener('click', () => {
    const note = NOTE_DATA[state.correctMidi];
    if (note) playNote(note.frequency);
  });

  // Settings
  $('settings-btn').addEventListener('click', toggleSettings);
  $('close-settings-btn').addEventListener('click', toggleSettings);

  $('vibration-toggle').addEventListener('change', (e) => {
    state.vibrationEnabled = !!e.target.checked;
    saveProgress();
    if (state.vibrationEnabled) haptics.tap();
  });

  $('sound-toggle').addEventListener('change', (e) => {
    state.soundEnabled = !!e.target.checked;
    saveProgress();
  });
});
