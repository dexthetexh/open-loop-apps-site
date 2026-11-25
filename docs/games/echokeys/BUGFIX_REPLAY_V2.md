# EchoKeys - Bug Fix #2: Replay Doesn't Clear Player Sequence

## Issue Reported
**Symptom:** After clicking Replay, key presses are registered but never evaluated. Status shows "25 / 1" (or similar) indicating multiple key presses for a 1-note sequence. Game never advances to next level or shows success/failure.

**Screenshot Evidence:** Status showing "25 / 1" with keys responding but no progression.

## Root Cause Analysis

### The Problem
The `replaySequence()` function was not clearing `gameState.playerSequence` before allowing new input. 

**What happened:**
1. Player enters sequence → `playerSequence = [0]` (for example)
2. Game evaluates result → goes to RESULT state
3. Player clicks "Replay"
4. `replaySequence()` is called
5. ❌ `playerSequence` still contains `[0]` from previous attempt
6. Game transitions to INPUT state
7. Player presses a key (index 1)
8. `playerSequence.push(1)` → `playerSequence = [0, 1]`
9. Check: `playerSequence.length (2) === targetSequence.length (1)` → FALSE
10. Loop continues forever - every key press adds to the array
11. Status shows accumulated length: "25 / 1"

### Code Flow

```javascript
// BUGGY CODE (v1.2)
function replaySequence() {
    disableKeys();
    hideButtons();
    setStatus('🎵 Listen again...');
    
    playSequence(gameState.targetSequence, () => {
        setState(STATES.INPUT);
    });
    // ❌ playerSequence never cleared!
}
```

**Trace of playerSequence:**
```
Initial: []
After first attempt: [0]
After clicking Replay: [0]  ❌ Should be []
After pressing key: [0, 1]  ❌ Length is 2, never matches target length 1
After pressing key: [0, 1, 2]  ❌ Continues growing
After pressing key 25 times: [0, 1, 2, ..., 24]  ❌ Shows "25 / 1"
```

### Why Other Flows Work

**nextLevel()** works because `generateLevel()` clears the sequence:
```javascript
function generateLevel() {
    // ...
    gameState.playerSequence = []; // ✅ Explicitly cleared
}
```

**retryLevel()** works because it explicitly clears:
```javascript
function retryLevel() {
    gameState.playerSequence = []; // ✅ Explicitly cleared
    renderKeys();
    setState(STATES.PLAYBACK);
}
```

But **replaySequence()** didn't have this clearing step!

## The Fix

### Changed Code

```javascript
// FIXED CODE (v1.3)
function replaySequence() {
    gameState.playerSequence = []; // ✅ Clear previous attempts
    disableKeys();
    hideButtons();
    setStatus('🎵 Listen again...');
    
    playSequence(gameState.targetSequence, () => {
        setState(STATES.INPUT);
    });
}
```

### Why This Works

Now the flow is:
```
Initial: []
After first attempt: [0]
After clicking Replay: []  ✅ Cleared!
After pressing correct key: [0]  ✅ Length 1 matches target length 1
Check passes → advances to RESULT state ✅
```

## Testing the Fix

### Test Case 1: Single Replay
1. Start game
2. Press wrong key
3. Click "🔁 Replay"
4. Press correct key
5. ✅ Should show success and advance

### Test Case 2: Multiple Replays
1. Start game  
2. Press wrong key
3. Click "🔁 Replay"
4. Press wrong key again
5. Click "🔁 Replay" again
6. Press correct key
7. ✅ Should work after multiple replays

### Test Case 3: Status Display
1. Start game
2. For 1-note sequence, status should show "1 / 1" after first key
3. Not "2 / 1", "3 / 1", etc.
4. ✅ Counter should match sequence length

## Related Bug: Original Replay Issue (v1.2)

This fix builds on the previous replay fix where `setState(STATES.INPUT)` was used instead of calling `startInput()` directly. Both issues needed to be fixed:

1. **Bug #1 (v1.2):** State not updated → keys ignored
2. **Bug #2 (v1.3):** Player sequence not cleared → keys never evaluate

## Design Pattern Established

All functions that transition to INPUT state should clear playerSequence:

✅ **Correct pattern:**
```javascript
function anyFunctionThatRestartsInput() {
    gameState.playerSequence = []; // Always clear first
    // ... other setup ...
    setState(STATES.INPUT); // or setState(STATES.PLAYBACK)
}
```

### Functions Following This Pattern:
- ✅ `generateLevel()` - clears in new level generation
- ✅ `retryLevel()` - clears before replay
- ✅ `replaySequence()` - NOW clears before replay

## Prevention for Future

Consider adding validation:
```javascript
function startInput() {
    // Defensive check
    if (gameState.playerSequence.length > 0) {
        console.warn('startInput called with non-empty playerSequence:', 
                     gameState.playerSequence);
        gameState.playerSequence = []; // Auto-clear as safety net
    }
    
    setTimeout(() => {
        enableKeys();
        setStatus(`Repeat the ${gameState.seqLen} note${gameState.seqLen > 1 ? 's' : ''}`, 'pulse');
        showButtons(['replay']);
    }, CONFIG.INPUT_DELAY);
}
```

This would catch similar bugs in development.

## Files Modified

- **app.js** - Added `gameState.playerSequence = []` to `replaySequence()`
- **echokeys-mobile-test.html** - Updated with fix

## Version History

- **v1.0** - Initial release
- **v1.1** - Haptic feedback added
- **v1.2** - Replay state transition fixed (Bug #1)
- **v1.3** - Replay sequence clearing fixed (Bug #2) ✅

## Impact

- **Severity:** Critical (game unplayable after replay)
- **Frequency:** 100% reproducible on every replay
- **User Impact:** Complete loss of game functionality
- **Fix Complexity:** Trivial (1 line addition)
- **Testing Required:** Moderate (verify all input flows)

---

**Status:** ✅ Fixed in v1.3  
**Tested:** Pending mobile verification  
**Released:** January 27, 2026
