# EchoKeys - Bug Fix: Replay Button Issue

## Issue Reported
**Symptom:** After using the "Replay" button, subsequent key presses do not register. The game becomes unresponsive and cannot progress positively or negatively.

**Affected Versions:** v1.0, v1.1 (initial haptic release)

## Root Cause Analysis

### The Problem
The `replaySequence()` function was calling `startInput()` directly instead of using the proper state machine transition via `setState(STATES.INPUT)`.

```javascript
// BUGGY CODE (v1.1)
function replaySequence() {
    disableKeys();
    hideButtons();
    setStatus('🎵 Listen again...');
    
    playSequence(gameState.targetSequence, () => {
        startInput();  // ❌ Bypasses state machine!
    });
}
```

### Why This Caused the Bug

The `handleKeyPress()` function validates the current state before processing input:

```javascript
function handleKeyPress(index) {
    if (gameState.currentState !== STATES.INPUT) return; // ❌ State check fails!
    // ... rest of code
}
```

**Flow breakdown:**
1. Player clicks "🔁 Replay" button
2. `replaySequence()` is called
3. Sequence plays
4. `startInput()` is called directly
5. Keys are enabled, buttons shown
6. **BUT** `gameState.currentState` was never updated to `STATES.INPUT`!
7. Player clicks a key
8. `handleKeyPress()` checks state → still in `STATES.RESULT` or undefined
9. Function returns early, ignoring the key press
10. Game appears frozen

### State Machine Flow

**Correct flow (used by nextLevel/retryLevel):**
```
User Action → setState(STATES.PLAYBACK) 
  → startPlayback() 
  → playSequence() 
  → setState(STATES.INPUT) 
  → startInput() 
  → enableKeys()
```

**Broken flow (replaySequence before fix):**
```
User Action → replaySequence() 
  → playSequence() 
  → startInput() 
  → enableKeys()
  ❌ State never updated!
```

## The Fix

### Changed Code

```javascript
// FIXED CODE (v1.2)
function replaySequence() {
    disableKeys();
    hideButtons();
    setStatus('🎵 Listen again...');
    
    playSequence(gameState.targetSequence, () => {
        setState(STATES.INPUT);  // ✅ Proper state transition!
    });
}
```

### Why This Works

By calling `setState(STATES.INPUT)`:
1. `gameState.currentState` is properly updated to `STATES.INPUT`
2. `setState()` then calls `startInput()` automatically
3. The state machine maintains consistency
4. `handleKeyPress()` state validation passes
5. Key presses are processed normally

## Testing the Fix

### Test Cases

**Test 1: Replay from first-time failure**
1. Start game
2. Play wrong sequence
3. Click "🔁 Replay"
4. Listen to sequence
5. ✅ Keys should respond to input

**Test 2: Replay multiple times**
1. Start game
2. Play wrong sequence
3. Click "🔁 Replay"
4. Play wrong sequence again
5. Click "🔁 Replay" again
6. ✅ Should work every time

**Test 3: Replay then Try Again**
1. Start game
2. Play wrong sequence
3. Click "🔁 Replay"
4. Play correct sequence
5. ✅ Should advance level

**Test 4: Replay after success (via Next button)**
1. Complete level successfully
2. Click "Next →"
3. Play sequence
4. ✅ Keys should work normally

### Verification

The debug version logs state transitions:
```
State: result → input
Enabling 3 keys
Key pressed: 0, currentState: input ✅
```

Before fix, you would see:
```
Key pressed: 0, currentState: result
Ignoring key press - not in INPUT state ❌
```

## Additional Debug Logging Added

For troubleshooting, added console logging to:

1. **handleKeyPress():**
   - Logs current state on every key press
   - Logs when keys are ignored
   - Shows player vs target sequence

2. **enableKeys():**
   - Logs how many keys are being enabled
   - Helps verify DOM elements exist

### Example Console Output (Fixed Version)
```
State: boot → playback
State: playback → input
Enabling 3 keys
Key pressed: 0, currentState: input
Player sequence: [0], target: [0]
State: input → result
State: result → input
Enabling 3 keys
Key pressed: 1, currentState: input
Player sequence: [1], target: [0]
```

## Files Modified

- **app.js** - Fixed `replaySequence()` function, added debug logging
- **echokeys-mobile-test.html** - Updated with fix
- **echokeys-mobile-test-debug.html** - Version with verbose logging

## Impact

- **Severity:** High (feature-breaking bug)
- **Frequency:** 100% reproducible when using Replay button
- **User Impact:** Game becomes unplayable after first replay attempt
- **Fix Complexity:** Simple (1 line change)
- **Testing Required:** Moderate (verify all button flows)

## Version History

- **v1.0** - Initial release (bug present but unreported)
- **v1.1** - Haptic feedback added (bug still present)
- **v1.2** - Replay button fixed ✅

## Lessons Learned

### Design Principles
1. **Always use the state machine** - Never bypass `setState()` for state transitions
2. **Consistent patterns** - `nextLevel()` and `retryLevel()` both called `setState()` correctly, but `replaySequence()` didn't follow the same pattern
3. **Defensive programming** - The state check in `handleKeyPress()` caught the bug, but better would be to prevent the invalid state

### Prevention
- Code review checklist: Verify all user actions properly transition state
- Add state validation: Warn if `startInput()` is called without state being INPUT
- Unit tests for state transitions

## Recommendation

Consider adding a state validation helper:

```javascript
function validateState(expectedState, functionName) {
    if (gameState.currentState !== expectedState) {
        console.warn(`${functionName} called in wrong state: ${gameState.currentState}, expected: ${expectedState}`);
    }
}

function startInput() {
    validateState(STATES.INPUT, 'startInput');
    // ... rest of function
}
```

This would catch state machine violations during development.

---

**Status:** ✅ Fixed in v1.2  
**Tested:** Mobile (iOS/Android)  
**Released:** January 27, 2026
