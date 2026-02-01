import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==================== GAME TUNING (Direct from Kotlin) ====================
const GameTuning = {
  BASE_PROGRESS_PER_TAP: 1.0,
  STRENGTH_STEP: 0.5,
  BASE_TIME_COST_PER_TAP: 0.10,
  EFFICIENCY_STEP: 0.005,
  MIN_TIME_COST_FLOOR: 0.01,
  BASE_START_TIME_SEC: 10.0,
  TIME_DECREASE_PER_LEVEL: 0.5,
  MIN_START_TIME_SEC: 3.0,
  BASE_PROGRESS_TARGET: 20.0,
  TARGET_STEP_PER_LEVEL: 6.0,
  BASE_SHARDS_REWARD: 10.0,
  SHARDS_REWARD_STEP: 5.0,
  BASE_STRENGTH_COST: 25.0,
  BASE_EFFICIENCY_COST: 25.0,
  COST_GROWTH: 1.22
};

// ==================== GAME CALCULATIONS ====================
const calculateStartTime = (level) => {
  const time = GameTuning.BASE_START_TIME_SEC - (level - 1) * GameTuning.TIME_DECREASE_PER_LEVEL;
  return Math.max(time, GameTuning.MIN_START_TIME_SEC);
};

const calculateTarget = (level) => {
  return GameTuning.BASE_PROGRESS_TARGET + (level - 1) * GameTuning.TARGET_STEP_PER_LEVEL;
};

const calculateReward = (level) => {
  return Math.floor(GameTuning.BASE_SHARDS_REWARD + (level - 1) * GameTuning.SHARDS_REWARD_STEP);
};

const calculateUpgradeCost = (baseConst, level) => {
  return Math.max(1, Math.floor(baseConst * Math.pow(GameTuning.COST_GROWTH, level)));
};

const calculateProgressPerTap = (strengthLevel) => {
  return GameTuning.BASE_PROGRESS_PER_TAP + strengthLevel * GameTuning.STRENGTH_STEP;
};

const calculateTimeCostPerTap = (efficiencyLevel) => {
  const cost = GameTuning.BASE_TIME_COST_PER_TAP - efficiencyLevel * GameTuning.EFFICIENCY_STEP;
  return Math.max(cost, GameTuning.MIN_TIME_COST_FLOOR);
};

// ==================== PERSISTENCE ====================
const STORAGE_KEY = 'tap_escape_speedrun_progress';

const loadProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return {
    shards: 0,
    level: 1,
    strengthLevel: 0,
    efficiencyLevel: 0
  };
};

const saveProgress = (shards, level, strengthLevel, efficiencyLevel) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      shards,
      level,
      strengthLevel,
      efficiencyLevel
    }));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
};

// ==================== MAIN COMPONENT ====================
export default function TapEscapeSpeedrun() {
  // Load initial state from localStorage
  const initialProgress = loadProgress();
  
  // Core state
  const [isRunning, setIsRunning] = useState(false);
  const [shards, setShards] = useState(initialProgress.shards);
  const [level, setLevel] = useState(initialProgress.level);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(calculateStartTime(initialProgress.level));
  const [taps, setTaps] = useState(0);
  
  // Upgrades
  const [strengthLevel, setStrengthLevel] = useState(initialProgress.strengthLevel);
  const [efficiencyLevel, setEfficiencyLevel] = useState(initialProgress.efficiencyLevel);
  
  // Derived values
  const progressTarget = calculateTarget(level);
  const startTime = calculateStartTime(level);
  const progressPerTap = calculateProgressPerTap(strengthLevel);
  const timeCostPerTap = calculateTimeCostPerTap(efficiencyLevel);
  const strengthCost = calculateUpgradeCost(GameTuning.BASE_STRENGTH_COST, strengthLevel);
  const efficiencyCost = calculateUpgradeCost(GameTuning.BASE_EFFICIENCY_COST, efficiencyLevel);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  
  // Refs for timing
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(null);
  
  // Save progress whenever relevant state changes (debounced in effect)
  useEffect(() => {
    if (!isRunning) {
      const timer = setTimeout(() => {
        saveProgress(shards, level, strengthLevel, efficiencyLevel);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [shards, level, strengthLevel, efficiencyLevel, isRunning]);
  
  // Keyboard input support
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent default for spacebar to avoid page scroll
      if (event.code === 'Space') {
        event.preventDefault();
      }
      
      // Don't handle keys when modals are open
      if (showSettings || showAbout || showResetConfirm) {
        return;
      }
      
      // Trigger tap
      handleTap();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap, showSettings, showAbout, showResetConfirm]);
  
  // Game loop (timing)
  useEffect(() => {
    if (!isRunning) {
      lastTimeRef.current = null;
      return;
    }
    
    const loop = (timestamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      
      const deltaMs = timestamp - lastTimeRef.current;
      const deltaSec = deltaMs / 1000;
      lastTimeRef.current = timestamp;
      
      setTimeLeft(prev => {
        const next = Math.max(0, prev - deltaSec);
        
        // Check for loss condition
        if (next <= 0 && progress < progressTarget) {
          endRun(false, 'Time Up');
        }
        
        return next;
      });
      
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    
    animationFrameRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, progress, progressTarget]);
  
  // Start a run
  const startRun = useCallback(() => {
    if (isRunning) return;
    
    const startTime = calculateStartTime(level);
    const target = calculateTarget(level);
    
    setIsRunning(true);
    setProgress(0);
    setTaps(0);
    setTimeLeft(startTime);
    setLastResult(null);
    lastTimeRef.current = null;
  }, [isRunning, level]);
  
  // End a run
  const endRun = useCallback((won, reason) => {
    setIsRunning(false);
    
    const reward = won ? calculateReward(level) : 0;
    const nextLevel = won ? level + 1 : level;
    
    if (won) {
      setShards(prev => prev + reward);
      setLevel(nextLevel);
    }
    
    setLastResult({
      won,
      reason,
      taps,
      timeLeft,
      shardsEarned: reward
    });
  }, [level, taps, timeLeft]);
  
  // Handle tap
  const handleTap = useCallback(() => {
    if (!isRunning) {
      startRun();
      return;
    }
    
    setProgress(prev => {
      const next = Math.min(progressTarget, prev + progressPerTap);
      
      // Check win condition
      if (next >= progressTarget) {
        endRun(true, 'Escaped');
      }
      
      return next;
    });
    
    setTimeLeft(prev => {
      const next = Math.max(0, prev - timeCostPerTap);
      
      // Check loss condition
      if (next <= 0 && progress + progressPerTap < progressTarget) {
        endRun(false, 'Time Up');
      }
      
      return next;
    });
    
    setTaps(prev => prev + 1);
  }, [isRunning, progressTarget, progressPerTap, timeCostPerTap, progress, startRun, endRun]);
  
  // Upgrade strength
  const upgradeStrength = () => {
    if (isRunning || shards < strengthCost) return;
    setShards(prev => prev - strengthCost);
    setStrengthLevel(prev => prev + 1);
  };
  
  // Upgrade efficiency
  const upgradeEfficiency = () => {
    if (isRunning || shards < efficiencyCost) return;
    setShards(prev => prev - efficiencyCost);
    setEfficiencyLevel(prev => prev + 1);
  };
  
  // Reset progress
  const resetProgress = () => {
    setShards(0);
    setLevel(1);
    setProgress(0);
    setTimeLeft(GameTuning.BASE_START_TIME_SEC);
    setTaps(0);
    setStrengthLevel(0);
    setEfficiencyLevel(0);
    setLastResult(null);
    setIsRunning(false);
    saveProgress(0, 1, 0, 0);
    setShowResetConfirm(false);
    setShowSettings(false);
  };
  
  // Stop run
  const stopRun = () => {
    if (isRunning) {
      endRun(false, 'Stopped');
    }
  };
  
  // Progress ratios
  const timeRatio = startTime > 0 ? Math.max(0, Math.min(1, timeLeft / startTime)) : 0;
  const progRatio = progressTarget > 0 ? Math.max(0, Math.min(1, progress / progressTarget)) : 0;
  
  // Colors
  const colors = {
    primary: '#00F0FF',
    secondary: '#FF2BD6',
    amber: '#FCEE0A',
    panel: '#0B0B16',
    panelStroke: '#1F1F33',
    bg: '#050510',
    text: '#E6E8F2',
    textDim: '#9AA0B4'
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none" style={{ backgroundColor: colors.bg }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse">
              <path d="M25 0L46.65 12.5V37.5L25 50L3.35 37.5V12.5z" 
                    fill="none" 
                    stroke={colors.primary} 
                    strokeWidth="0.5" 
                    opacity="0.3"/>
            </pattern>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 0.05 }} />
              <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
          <rect width="100%" height="100%" fill="url(#bgGrad)" />
        </svg>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full p-5 gap-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] tracking-wider" style={{ color: colors.textDim }}>SECTOR</div>
            <div className="text-3xl font-black tracking-tight" style={{ color: colors.primary }}>
              LVL {String(level).padStart(2, '0')}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] tracking-wider" style={{ color: colors.textDim }}>SHARDS</div>
              <div className="text-3xl font-black tracking-tight" style={{ color: colors.amber }}>
                {shards}
              </div>
            </div>
            
            <button 
              onClick={() => setShowAbout(true)}
              className="ml-3 text-xl transition-opacity hover:opacity-70"
              style={{ color: colors.primary }}
            >
              ⓘ
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="ml-2 text-xl transition-opacity hover:opacity-70"
              style={{ color: colors.primary }}
            >
              ⚙
            </button>
          </div>
        </div>
        
        {/* Meters */}
        <div className="flex-none">
          <div className="text-[10px] tracking-wider mb-2" style={{ color: colors.textDim }}>
            TIME INTEGRITY
          </div>
          <div 
            className="w-full h-2.5 rounded-sm border relative overflow-hidden"
            style={{ 
              backgroundColor: colors.panel, 
              borderColor: colors.panelStroke 
            }}
          >
            <div 
              className="absolute inset-y-0 left-0 transition-all duration-100"
              style={{ 
                width: `${timeRatio * 100}%`,
                backgroundColor: timeRatio < 0.3 ? colors.secondary : colors.primary
              }}
            />
          </div>
          <div className="text-right text-[10px] mt-1" style={{ color: colors.textDim }}>
            {timeLeft.toFixed(2)}s
          </div>
          
          <div className="flex justify-between items-center text-[10px] tracking-wider mt-4 mb-2" style={{ color: colors.textDim }}>
            <span>DECRYPTION</span>
            <span>{Math.floor(progress)} / {Math.floor(progressTarget)}</span>
          </div>
          <div 
            className="w-full h-2.5 rounded-sm border relative overflow-hidden"
            style={{ 
              backgroundColor: colors.panel, 
              borderColor: colors.panelStroke 
            }}
          >
            <div 
              className="absolute inset-y-0 left-0 transition-all duration-100"
              style={{ 
                width: `${progRatio * 100}%`,
                backgroundColor: colors.amber
              }}
            />
          </div>
        </div>
        
        {/* Result Display */}
        {lastResult && !isRunning && (
          <div 
            className="flex-none p-4 rounded-lg border text-center animate-pulse"
            style={{ 
              backgroundColor: colors.panel,
              borderColor: lastResult.won ? colors.primary : colors.secondary,
              color: lastResult.won ? colors.primary : colors.secondary
            }}
          >
            <div className="text-2xl font-black mb-1">
              {lastResult.won ? '✓ ESCAPED' : '✗ ' + lastResult.reason.toUpperCase()}
            </div>
            <div className="text-sm" style={{ color: colors.textDim }}>
              {lastResult.taps} taps • {lastResult.shardsEarned > 0 && `+${lastResult.shardsEarned} shards`}
            </div>
          </div>
        )}
        
        {/* Tap Button */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <button
              onClick={handleTap}
              className="relative w-52 h-52 rounded-full border-4 flex items-center justify-center text-4xl font-black tracking-wider transition-all active:scale-95"
              style={{
                backgroundColor: colors.panel,
                borderColor: isRunning ? colors.primary : colors.textDim,
                color: '#FFFFFF',
                boxShadow: isRunning ? `0 0 40px ${colors.primary}40` : 'none'
              }}
            >
              {isRunning ? 'TAP' : 'READY'}
            </button>
            <div className="text-xs tracking-wider mt-3" style={{ color: colors.textDim }}>
              CLICK OR PRESS ANY KEY
            </div>
          </div>
        </div>
        
        {/* Upgrades */}
        <div className="flex-none space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Strength Upgrade */}
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: colors.panel,
                borderColor: colors.panelStroke
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold" style={{ color: colors.text }}>Strength</div>
                <div className="text-xs" style={{ color: colors.textDim }}>LVL {strengthLevel}</div>
              </div>
              <div className="text-xs mb-3" style={{ color: colors.textDim }}>+Power/Tap</div>
              <button
                onClick={upgradeStrength}
                disabled={isRunning || shards < strengthCost}
                className="w-full py-2 rounded border text-xs font-bold transition-opacity disabled:opacity-40"
                style={{
                  backgroundColor: '#0E1224',
                  borderColor: shards >= strengthCost && !isRunning ? colors.primary : colors.panelStroke,
                  color: shards >= strengthCost && !isRunning ? colors.primary : colors.textDim
                }}
              >
                {strengthCost} SHARDS
              </button>
              {!isRunning && shards < strengthCost && (
                <div className="text-[10px] text-center mt-2" style={{ color: colors.secondary }}>
                  Insufficient
                </div>
              )}
            </div>
            
            {/* Efficiency Upgrade */}
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: colors.panel,
                borderColor: colors.panelStroke
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold" style={{ color: colors.text }}>Efficiency</div>
                <div className="text-xs" style={{ color: colors.textDim }}>LVL {efficiencyLevel}</div>
              </div>
              <div className="text-xs mb-3" style={{ color: colors.textDim }}>-Time Cost</div>
              <button
                onClick={upgradeEfficiency}
                disabled={isRunning || shards < efficiencyCost}
                className="w-full py-2 rounded border text-xs font-bold transition-opacity disabled:opacity-40"
                style={{
                  backgroundColor: '#0E1224',
                  borderColor: shards >= efficiencyCost && !isRunning ? colors.secondary : colors.panelStroke,
                  color: shards >= efficiencyCost && !isRunning ? colors.secondary : colors.textDim
                }}
              >
                {efficiencyCost} SHARDS
              </button>
              {!isRunning && shards < efficiencyCost && (
                <div className="text-[10px] text-center mt-2" style={{ color: colors.secondary }}>
                  Insufficient
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div 
            className="h-px"
            style={{ backgroundColor: colors.panelStroke, opacity: 0.7 }}
          />
          <div className="flex justify-between items-center">
            <div 
              className="text-xs tracking-wider"
              style={{ color: isRunning ? colors.secondary : colors.textDim }}
            >
              {isRunning ? 'RUN ACTIVE' : 'IDLE'}
            </div>
            <button
              onClick={stopRun}
              disabled={!isRunning}
              className="text-xs font-semibold transition-opacity disabled:opacity-30"
              style={{ color: colors.secondary }}
            >
              STOP
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div 
            className="w-full max-w-sm p-6 rounded-lg border"
            style={{ 
              backgroundColor: colors.panel,
              borderColor: colors.panelStroke
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>Settings</h2>
            <p className="text-sm mb-4" style={{ color: colors.textDim }}>
              Reset progress clears shards, level, and upgrades.
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 rounded border text-sm font-bold mb-4"
              style={{
                backgroundColor: '#2A0B1E',
                borderColor: colors.secondary,
                color: colors.secondary
              }}
            >
              Reset Progress
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 text-sm font-semibold"
              style={{ color: colors.primary }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Reset Confirm Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div 
            className="w-full max-w-sm p-6 rounded-lg border"
            style={{ 
              backgroundColor: colors.panel,
              borderColor: colors.panelStroke
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>Confirm Reset</h2>
            <p className="text-sm mb-6" style={{ color: colors.textDim }}>
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetProgress}
                className="flex-1 py-3 rounded border text-sm font-bold"
                style={{
                  backgroundColor: '#2A0B1E',
                  borderColor: colors.secondary,
                  color: colors.secondary
                }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded border text-sm font-bold"
                style={{
                  backgroundColor: colors.panel,
                  borderColor: colors.panelStroke,
                  color: colors.text
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* About Dialog */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div 
            className="w-full max-w-sm p-6 rounded-lg border"
            style={{ 
              backgroundColor: colors.panel,
              borderColor: colors.panelStroke
            }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>About</h2>
            <p className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
              Tap Escape: Pure Speedrun
            </p>
            <div className="text-sm space-y-1 mb-6" style={{ color: colors.textDim }}>
              <p>Version: 1.0.0</p>
              <p>Build: web</p>
              <p className="mt-4">A minimalist skill-based speedrun game.</p>
              <p className="mt-3 text-xs">
                <strong style={{ color: colors.text }}>Controls:</strong><br />
                Click the button or press any key to tap.
              </p>
            </div>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-2 text-sm font-semibold"
              style={{ color: colors.primary }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
