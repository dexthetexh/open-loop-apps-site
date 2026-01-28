/*
 * EchoKeys - Musical Memory Game
 * NoteLoop Series by Open Loop Apps
 *
 * STATE MACHINE:
 * BOOT → AUDIO_UNLOCK → MENU → PLAYBACK → INPUT → RESULT → NEXT
 *
 * KEY FUNCTIONS:
 * - initAudio(): Set up Web Audio API context and synth
 * - playNote(freq, duration): Schedule single note with envelope
 * - playSequence(notes): Play array of notes with timing
 * - generateLevel(): Create challenge based on difficulty params
 * - checkInput(): Validate player's note sequence
 * - advanceLevel(): Increment difficulty and reset for next round
 */

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const STATES = {
    BOOT: 'boot',
    AUDIO_UNLOCK: 'audio_unlock',
    MENU: 'menu',
    PLAYBACK: 'playback',
    INPUT: 'input',
    RESULT: 'result'
};

const NOTES = {
    3: [262, 330, 392], // C4, E4, G4 (3-key mode)
    5: [262, 294, 330, 392, 440], // C4, D4, E4, G4, A4 (5-key mode)
    7: [262, 294, 330, 349, 392, 440, 494] // C4-B4 (7-key mode)
};

const NOTE_LABELS = {
    3: ['Do', 'Mi', 'Sol'],
    5: ['Do', 'Re', 'Mi', 'Sol', 'La'],
    7: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti']
};

const CONFIG = {
    NOTE_DURATION: 0.3, // seconds
    NOTE_GAP: 0.15, // seconds between notes in sequence
    ATTACK: 0.01,
    DECAY: 0.05,
    SUSTAIN: 0.7,
    RELEASE: 0.1,
    MASTER_VOLUME: 0.3,
    PLAYBACK_DELAY: 1000, // ms before starting playback
    INPUT_DELAY: 500 // ms after playback before allowing input
};

// ============================================================================
// GAME STATE
// ============================================================================

let gameState = {
    currentState: STATES.BOOT,
    level: 1,
    score: 0,
    bestScore: 0,
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
    vibrationEnabled: true
};

// ============================================================================
// AUDIO SYSTEM
// ============================================================================

function initAudio() {
    gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master gain node
    gameState.masterGain = gameState.audioContext.createGain();
    gameState.masterGain.gain.value = CONFIG.MASTER_VOLUME;
    gameState.masterGain.connect(gameState.audioContext.destination);
    
    console.log('Audio initialized');
}

function playNote(frequency, startTime, duration = CONFIG.NOTE_DURATION) {
    const ctx = gameState.audioContext;
    const now = startTime || ctx.currentTime;
    
    // Oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    // Envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + CONFIG.ATTACK);
    gainNode.gain.linearRampToValueAtTime(CONFIG.SUSTAIN, now + CONFIG.ATTACK + CONFIG.DECAY);
    gainNode.gain.setValueAtTime(CONFIG.SUSTAIN, now + duration - CONFIG.RELEASE);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(gainNode);
    gainNode.connect(gameState.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
    
    return now + duration;
}

function playSequence(noteIndices, onComplete) {
    const frequencies = NOTES[gameState.keyCount];
    const ctx = gameState.audioContext;
    let time = ctx.currentTime + 0.1;
    
    noteIndices.forEach(idx => {
        time = playNote(frequencies[idx], time, CONFIG.NOTE_DURATION);
        time += CONFIG.NOTE_GAP;
    });
    
    // Schedule completion callback
    if (onComplete) {
        const totalDuration = (time - ctx.currentTime) * 1000;
        setTimeout(onComplete, totalDuration);
    }
}

function playFeedbackSound(success) {
    const ctx = gameState.audioContext;
    const now = ctx.currentTime;
    
    if (success) {
        // Ascending chord
        playNote(523, now, 0.15); // C5
        playNote(659, now + 0.08, 0.15); // E5
        playNote(784, now + 0.16, 0.2); // G5
    } else {
        // Descending tone
        playNote(330, now, 0.2);
        playNote(262, now + 0.15, 0.3);
    }
}

// ============================================================================
// VIBRATION SYSTEM
// ============================================================================

function vibrate(pattern) {
    if (!gameState.vibrationEnabled) return;
    if (!navigator.vibrate) return;
    
    try {
        navigator.vibrate(pattern);
    } catch (e) {
        console.log('Vibration not supported');
    }
}

function vibrateKeyPress() {
    vibrate(50); // Short 50ms pulse
}

function vibrateSuccess() {
    vibrate([100, 50, 100, 50, 150]); // Success pattern: buzz-pause-buzz-pause-long buzz
}

function vibrateError() {
    vibrate([200, 100, 200]); // Error pattern: long-pause-long
}

// ============================================================================
// GAME LOGIC
// ============================================================================

function generateLevel() {
    // Difficulty scaling
    if (gameState.level <= 3) {
        gameState.keyCount = 3;
        gameState.seqLen = 1;
    } else if (gameState.level <= 6) {
        gameState.keyCount = 3;
        gameState.seqLen = Math.min(2, Math.floor((gameState.level - 2) / 2));
    } else if (gameState.level <= 10) {
        gameState.keyCount = 5;
        gameState.seqLen = Math.min(3, Math.floor((gameState.level - 6) / 2) + 2);
    } else if (gameState.level <= 15) {
        gameState.keyCount = 5;
        gameState.seqLen = Math.min(4, Math.floor((gameState.level - 10) / 2) + 3);
    } else if (gameState.level <= 20) {
        gameState.keyCount = 7;
        gameState.seqLen = Math.min(5, Math.floor((gameState.level - 15) / 2) + 4);
    } else {
        gameState.keyCount = 7;
        gameState.seqLen = Math.min(6, 5 + Math.floor((gameState.level - 20) / 5));
    }
    
    // Generate random sequence
    gameState.targetSequence = [];
    for (let i = 0; i < gameState.seqLen; i++) {
        gameState.targetSequence.push(Math.floor(Math.random() * gameState.keyCount));
    }
    
    gameState.playerSequence = [];
    
    console.log(`Level ${gameState.level}: ${gameState.keyCount} keys, ${gameState.seqLen} notes`, gameState.targetSequence);
}

function checkInput() {
    const target = gameState.targetSequence;
    const player = gameState.playerSequence;
    
    // Check if sequences match
    if (player.length !== target.length) return false;
    
    for (let i = 0; i < target.length; i++) {
        if (player[i] !== target[i]) return false;
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
    
    // Update best score
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        saveProgress();
    }
    
    updateDisplay();
}

function failLevel() {
    gameState.combo = 0;
    // Don't reset level or score - let player retry
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateDisplay() {
    document.getElementById('level-display').textContent = gameState.level;
    document.getElementById('score-display').textContent = gameState.score;
    document.getElementById('best-display').textContent = gameState.bestScore;
}

function setStatus(message, className = '') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + className;
}

function renderKeys() {
    const container = document.getElementById('keys-container');
    container.innerHTML = '';
    
    const frequencies = NOTES[gameState.keyCount];
    const labels = NOTE_LABELS[gameState.keyCount];
    
    frequencies.forEach((freq, idx) => {
        const key = document.createElement('button');
        key.className = 'piano-key';
        key.dataset.index = idx;
        key.innerHTML = `
            <span class="key-label">${labels[idx]}</span>
            <span class="key-number">${idx + 1}</span>
        `;
        
        key.addEventListener('click', () => handleKeyPress(idx));
        
        container.appendChild(key);
    });
}

function animateKey(index, className = 'active') {
    const keys = document.querySelectorAll('.piano-key');
    const key = keys[index];
    if (!key) return;
    
    key.classList.add(className);
    setTimeout(() => key.classList.remove(className), 300);
}

function disableKeys() {
    document.querySelectorAll('.piano-key').forEach(key => {
        key.disabled = true;
    });
}

function enableKeys() {
    const keys = document.querySelectorAll('.piano-key');
    console.log(`Enabling ${keys.length} keys`);
    keys.forEach(key => {
        key.disabled = false;
    });
}

function showButtons(buttons) {
    const container = document.getElementById('action-buttons');
    container.classList.remove('hidden');
    
    document.getElementById('replay-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('retry-btn').classList.add('hidden');
    
    buttons.forEach(btn => {
        document.getElementById(btn + '-btn').classList.remove('hidden');
    });
}

function hideButtons() {
    document.getElementById('action-buttons').classList.add('hidden');
}

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

function setState(newState) {
    console.log(`State: ${gameState.currentState} → ${newState}`);
    gameState.currentState = newState;
    
    switch (newState) {
        case STATES.PLAYBACK:
            startPlayback();
            break;
        case STATES.INPUT:
            startInput();
            break;
        case STATES.RESULT:
            showResult();
            break;
    }
}

function startGame() {
    document.getElementById('audio-unlock').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    
    loadProgress();
    updateDisplay();
    generateLevel();
    renderKeys();
    
    setState(STATES.PLAYBACK);
}

function startPlayback() {
    disableKeys();
    hideButtons();
    setStatus('🎵 Listen carefully...');
    
    setTimeout(() => {
        playSequence(gameState.targetSequence, () => {
            setState(STATES.INPUT);
        });
    }, CONFIG.PLAYBACK_DELAY);
}

function startInput() {
    setTimeout(() => {
        enableKeys();
        setStatus(`Repeat the ${gameState.seqLen} note${gameState.seqLen > 1 ? 's' : ''}`, 'pulse');
        showButtons(['replay']);
    }, CONFIG.INPUT_DELAY);
}

function showResult() {
    disableKeys();
    
    const success = checkInput();
    
    if (success) {
        playFeedbackSound(true);
        vibrateSuccess();
        setStatus('✨ Perfect!', 'success');
        advanceLevel();
        
        setTimeout(() => {
            showButtons(['next']);
        }, 500);
    } else {
        playFeedbackSound(false);
        vibrateError();
        setStatus('❌ Not quite...', 'error');
        failLevel();
        updateDisplay();
        
        setTimeout(() => {
            showButtons(['replay', 'retry']);
        }, 500);
    }
}

function nextLevel() {
    generateLevel();
    renderKeys();
    setState(STATES.PLAYBACK);
}

function retryLevel() {
    gameState.playerSequence = [];
    renderKeys();
    setState(STATES.PLAYBACK);
}

function replaySequence() {
    gameState.playerSequence = []; // Clear previous attempts
    disableKeys();
    hideButtons();
    setStatus('🎵 Listen again...');
    
    playSequence(gameState.targetSequence, () => {
        setState(STATES.INPUT);
    });
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

function handleKeyPress(index) {
    console.log(`Key pressed: ${index}, currentState: ${gameState.currentState}`);
    
    if (gameState.currentState !== STATES.INPUT) {
        console.log(`Ignoring key press - not in INPUT state`);
        return;
    }
    
    // Play note and vibrate
    const frequencies = NOTES[gameState.keyCount];
    playNote(frequencies[index], null, CONFIG.NOTE_DURATION);
    vibrateKeyPress();
    animateKey(index);
    
    // Record input
    gameState.playerSequence.push(index);
    console.log(`Player sequence: [${gameState.playerSequence}], target: [${gameState.targetSequence}]`);
    
    // Check if sequence complete
    if (gameState.playerSequence.length === gameState.targetSequence.length) {
        disableKeys();
        setTimeout(() => setState(STATES.RESULT), 300);
    } else {
        // Update status with progress
        setStatus(`${gameState.playerSequence.length} / ${gameState.seqLen}`, 'pulse');
    }
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function saveProgress() {
    try {
        localStorage.setItem('echokeys_best', gameState.bestScore);
        localStorage.setItem('echokeys_vibration', gameState.vibrationEnabled);
    } catch (e) {
        console.log('localStorage not available');
    }
}

function loadProgress() {
    try {
        const saved = localStorage.getItem('echokeys_best');
        if (saved) {
            gameState.bestScore = parseInt(saved, 10);
        }
        
        const vibrationSetting = localStorage.getItem('echokeys_vibration');
        if (vibrationSetting !== null) {
            gameState.vibrationEnabled = vibrationSetting === 'true';
            updateVibrationToggle();
        }
    } catch (e) {
        console.log('localStorage not available');
    }
}

function updateVibrationToggle() {
    const toggle = document.getElementById('vibration-toggle');
    if (toggle) {
        toggle.checked = gameState.vibrationEnabled;
    }
}

// ============================================================================
// SETTINGS UI
// ============================================================================

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

function handleVibrationToggle() {
    gameState.vibrationEnabled = document.getElementById('vibration-toggle').checked;
    saveProgress();
    
    // Give feedback when toggling
    if (gameState.vibrationEnabled) {
        vibrate(50); // Quick buzz to confirm it's on
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        startGame();
    });
    
    // Action buttons
    document.getElementById('replay-btn').addEventListener('click', replaySequence);
    document.getElementById('next-btn').addEventListener('click', nextLevel);
    document.getElementById('retry-btn').addEventListener('click', retryLevel);
    
    // Settings buttons
    document.getElementById('settings-btn').addEventListener('click', toggleSettings);
    document.getElementById('close-settings-btn').addEventListener('click', toggleSettings);
    document.getElementById('vibration-toggle').addEventListener('change', handleVibrationToggle);
    
    console.log('EchoKeys loaded');
});
