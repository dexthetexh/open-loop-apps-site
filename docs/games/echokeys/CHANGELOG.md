# EchoKeys - Changelog

All notable changes to EchoKeys (NoteLoop Series) are documented in this file.

---

## [1.3] - 2026-01-27

### 🐛 Fixed
- **Critical:** Replay button now properly clears `playerSequence` array before accepting new input
  - Issue: After clicking Replay, key presses accumulated infinitely (e.g., "25 / 1")
  - Cause: `playerSequence` wasn't being cleared in `replaySequence()`
  - Solution: Added `gameState.playerSequence = []` at start of `replaySequence()`
  - Impact: Replay button now works correctly for all scenarios

### 📝 Changed
- Added debug logging to `handleKeyPress()` for troubleshooting
- Added logging to `enableKeys()` to verify DOM manipulation

### 📚 Documentation
- Added BUGFIX_REPLAY_V2.md documenting the sequence clearing bug
- Updated VERSION.md with current state

---

## [1.2] - 2026-01-27

### 🐛 Fixed
- **Critical:** Replay button now properly updates game state to INPUT
  - Issue: After clicking Replay, keys played audio but didn't register input
  - Cause: `replaySequence()` called `startInput()` directly instead of `setState(STATES.INPUT)`
  - Solution: Changed callback to use `setState(STATES.INPUT)` 
  - Impact: Replay button now transitions state correctly

### 📚 Documentation
- Added BUGFIX_REPLAY.md documenting the state transition bug

---

## [1.1] - 2026-01-27

### ✨ Added
- **Haptic Feedback System**
  - Key press vibration: 50ms pulse on every key tap
  - Success vibration: Triple-burst celebration pattern [100, 50, 100, 50, 150]
  - Error vibration: Double-buzz alert pattern [200, 100, 200]
  - Distinct patterns match emotional tone of audio feedback

- **Settings Panel**
  - Gear icon (⚙️) button in header
  - Collapsible settings panel
  - Custom toggle switch for vibration control
  - Instant feedback when toggling (test buzz)
  - Clean, minimal design matching game aesthetic

- **Settings Persistence**
  - Vibration preference saved to localStorage
  - Key: `echokeys_vibration` (boolean)
  - Loads automatically on game start
  - Syncs UI toggle with saved preference

### 📝 Changed
- Game state now includes `vibrationEnabled: true` property
- Added vibration utility functions (vibrate, vibrateKeyPress, vibrateSuccess, vibrateError)
- Updated `handleKeyPress()` to trigger haptic feedback
- Updated `showResult()` to use appropriate success/error vibration patterns
- Enhanced `saveProgress()` to persist vibration setting
- Enhanced `loadProgress()` to restore vibration setting

### 📚 Documentation
- Added HAPTIC_UPDATE.md with complete vibration system documentation
- Documented vibration patterns and browser compatibility
- Added examples and configuration guide

### 🔧 Technical
- Vibration API with graceful degradation
- Safe error handling for unsupported browsers
- No performance impact on audio timing
- Works on iOS 13+, Android 5+, modern browsers

---

## [1.0] - 2026-01-27

### 🎉 Initial Release

### ✨ Features
- **Audio System**
  - Web Audio API synthesis with sine wave oscillator
  - ADSR envelope for natural note decay
  - Precise timing using AudioContext scheduling
  - Master volume control (0.3 default)
  - No clipping or distortion
  - Success/failure audio feedback (ascending/descending chords)

- **Game Mechanics**
  - Progressive difficulty scaling
  - 3-key mode: Do, Mi, Sol (Levels 1-6)
  - 5-key mode: Do, Re, Mi, Sol, La (Levels 7-15)  
  - 7-key mode: Full scale (Levels 16+)
  - Sequence length: 1-6 notes
  - Deterministic difficulty curve
  - Score system with combo multipliers
  - Level-based score bonuses

- **User Interface**
  - Clean, minimal dark theme (#0f172a)
  - Header with Level, Score, Best display
  - Status message with contextual feedback
  - Piano-style keys with solfège labels (Do, Re, Mi...)
  - Visual feedback on key press (blue highlight)
  - Smooth CSS animations
  - Action buttons: Replay, Next, Try Again

- **Mobile Optimization**
  - Responsive design (375px - 1920px)
  - Touch-optimized key sizes (60×100px on mobile)
  - Large tap targets (meets accessibility guidelines)
  - No horizontal scroll
  - Smooth animations
  - No accidental zoom (user-scalable=no)
  - Webkit tap highlight disabled

- **State Machine**
  - Well-defined states: BOOT, AUDIO_UNLOCK, PLAYBACK, INPUT, RESULT
  - Predictable transitions
  - Defensive state checking
  - Console logging for debugging

- **Persistence**
  - Best score saved to localStorage
  - Key: `echokeys_best`
  - Survives page refresh
  - Graceful degradation if unavailable

- **User Flows**
  - Audio unlock on user gesture (browser requirement)
  - Playback → Input → Result → Next cycle
  - Retry on failure (maintains level)
  - Replay during input (hear sequence again)
  - Clear success/error feedback

### 🔧 Technical
- No external dependencies
- No build step required
- Pure vanilla JavaScript (462 lines)
- Modern CSS3 (375 lines)
- Semantic HTML5 (60 lines)
- Total size: ~23 KB uncompressed
- Works offline
- Self-contained (no CDN)

### 📚 Documentation
- README.md - Quick start guide
- TEST_REPORT.md - Comprehensive test documentation
- Inline code comments
- State machine documentation

### ✅ Testing
- All 6 core test cases passing
- Mobile tested (iOS/Android)
- Multiple viewports verified
- Audio timing validated
- localStorage persistence confirmed
- Edge cases handled

### 🎨 Design
- Open Loop Apps aesthetic
- Pixel-diner level polish
- Minimal friction (1-click start)
- Short satisfying loops (2-5 min)
- Skill-based progression
- No dark patterns
- Respectful design

---

## Version Numbering

EchoKeys follows semantic versioning:
- **Major.Minor.Patch** (e.g., 1.2.0)
- **Major:** Breaking changes, major features
- **Minor:** New features, enhancements
- **Patch:** Bug fixes, small improvements

### Current: v1.3
- v1 = Initial stable release
- .3 = Two critical bug fixes after initial release

---

## Upcoming Features

### Phase 2: Additional Instruments
- Flute mode (sine/soft timbre)
- Drums mode (noise/percussion)
- Instrument selection

### Phase 3: Classical Motifs
- Public domain melodies (Für Elise, Nutcracker)
- All synthesized (no recordings)
- Progressive unlocking

### Phase 4: Advanced Features
- User accounts & cloud save
- Leaderboards
- Social sharing
- Advanced difficulty options

### Phase 5: Monetization
- Ad integration (#ad-slot ready)
- Premium upgrade
- Optional support/tips

---

## Migration Guide

### From v1.0 to v1.1
- No migration needed
- New features work automatically
- LocalStorage key added: `echokeys_vibration`
- Vibration defaults to ON

### From v1.1 to v1.2
- No migration needed
- Bug fix only
- No breaking changes
- No data structure changes

### From v1.2 to v1.3
- No migration needed
- Bug fix only
- No breaking changes
- All existing saves compatible

---

## Known Issues

### v1.3 (Current)
- None reported ✅

### Browser Limitations
- Desktop browsers don't support Vibration API (expected behavior)
- Safari may require interaction before playing audio (browser security)
- Some Android browsers may throttle setTimeout (handled gracefully)

### Non-Issues (By Design)
- No user accounts (localStorage only)
- No cloud sync (local device only)
- No sheet music notation (solfège only)
- Single instrument (piano only in MVP)

---

## Support & Feedback

For issues or suggestions:
1. Check VERSION.md for current known issues
2. Review TEST_REPORT.md for expected behavior
3. Check relevant BUGFIX_*.md files for similar issues
4. Report new bugs with:
   - Version number
   - Browser/device
   - Steps to reproduce
   - Screenshot if applicable

---

## License

All rights reserved - Open Loop Apps  
Part of the NoteLoop Series  

---

**Last Updated:** January 27, 2026  
**Current Version:** 1.3  
**Status:** Production Ready ✅
