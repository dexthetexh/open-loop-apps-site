/* ReelLoop core — pure data + rules (no DOM). Loaded before game.js.
 * Also loadable in Node for balance tests: module.exports = RL.
 */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- VISTAS ---------------- */
  const VISTAS = [
    { id: 'sunny_lake', name: 'Sunny Lake', emoji: '☀️', unlockLevel: 1, unlockCost: 0, mechanic: 'precision_cast', bodyClass: 'vista-sunny' },
    { id: 'frozen_tundra', name: 'Frozen Tundra', emoji: '❄️', unlockLevel: 5, unlockCost: 200, mechanic: 'drill', bodyClass: 'vista-ice' },
    { id: 'bayou_blackwater', name: 'Bayou Blackwater', emoji: '🐊', unlockLevel: 10, unlockCost: 500, mechanic: 'precision_cast', bodyClass: 'vista-bayou' },
  ];

  /* ---------------- FISH ----------------
   * power: base pull (0..~1.3). stamina: how long it fights (multiplier).
   * surge: [minGap,maxGap] seconds, len seconds, mul pull multiplier.
   * art: procedural drawing params used by game.js drawFish().
   */
  const FISH = [
    // SUNNY
    { id: 'bluegill', name: 'Bluegill', vista: 'sunny_lake', rarity: 'Common', spawnWeight: 80, coins: 10, xp: 10, lb: [0.2, 1.2], power: 0.22, stamina: 0.7, surge: [3.0, 5.0], surgeLen: 0.5, surgeMul: 1.6,
      art: { shape: 'fish', h: 0.55, top: '#2f5d8a', belly: '#f0b25a', fin: '#26496c', pattern: 'bars', pc: 'rgba(20,40,70,0.45)' } },
    { id: 'yellow_perch', name: 'Yellow Perch', vista: 'sunny_lake', rarity: 'Common', spawnWeight: 55, coins: 22, xp: 14, lb: [0.3, 1.8], power: 0.3, stamina: 0.8, surge: [2.8, 4.6], surgeLen: 0.55, surgeMul: 1.7,
      art: { shape: 'fish', h: 0.34, top: '#5b6b2a', belly: '#f4d64e', fin: '#e07a2e', pattern: 'bars', pc: 'rgba(40,60,20,0.55)' } },
    { id: 'rainbow_trout', name: 'Rainbow Trout', vista: 'sunny_lake', rarity: 'Uncommon', spawnWeight: 30, coins: 55, xp: 26, lb: [1, 8], power: 0.48, stamina: 1.0, surge: [2.4, 4.0], surgeLen: 0.7, surgeMul: 1.8,
      art: { shape: 'fish', h: 0.28, top: '#4a6b5a', belly: '#ece6d4', fin: '#7d8f7f', pattern: 'stripe', pc: '#e46a8a', spots: '#2b3a30' } },
    { id: 'largemouth_bass', name: 'Largemouth Bass', vista: 'sunny_lake', rarity: 'Rare', spawnWeight: 10, coins: 160, xp: 60, lb: [2, 12], power: 0.7, stamina: 1.25, surge: [2.0, 3.4], surgeLen: 0.8, surgeMul: 1.9,
      art: { shape: 'fish', h: 0.36, top: '#3d5a2a', belly: '#e2e8c4', fin: '#4e6a35', pattern: 'blotch', pc: 'rgba(25,40,15,0.7)', mouth: 1.4 } },
    { id: 'muskie', name: 'Muskie', vista: 'sunny_lake', rarity: 'Legendary', spawnWeight: 2, coins: 600, xp: 220, lb: [15, 55], power: 1.0, stamina: 1.5, surge: [1.8, 3.0], surgeLen: 1.0, surgeMul: 2.0, mechanic: 'boss', isJackpot: true,
      art: { shape: 'fish', h: 0.2, top: '#6b7a4a', belly: '#ebe5c8', fin: '#9a5a32', pattern: 'bars', pc: 'rgba(40,50,25,0.45)', snout: 1.35 } },

    // ICE
    { id: 'ice_minnow', name: 'Ice Minnow', vista: 'frozen_tundra', rarity: 'Common', spawnWeight: 85, coins: 10, xp: 10, lb: [0.05, 0.4], power: 0.18, stamina: 0.6, surge: [3.0, 5.0], surgeLen: 0.4, surgeMul: 1.6,
      art: { shape: 'fish', h: 0.24, top: '#7a9bb5', belly: '#f2f9fd', fin: '#9fb8cc', pattern: 'stripe', pc: '#c9dbe8' } },
    { id: 'frost_perch', name: 'Frost Perch', vista: 'frozen_tundra', rarity: 'Common', spawnWeight: 60, coins: 30, xp: 15, lb: [0.3, 2], power: 0.3, stamina: 0.85, surge: [2.8, 4.6], surgeLen: 0.55, surgeMul: 1.7,
      art: { shape: 'fish', h: 0.34, top: '#4b7fa6', belly: '#dcf1ff', fin: '#7fb4da', pattern: 'bars', pc: 'rgba(30,70,110,0.5)' } },
    { id: 'glacier_trout', name: 'Glacier Trout', vista: 'frozen_tundra', rarity: 'Uncommon', spawnWeight: 35, coins: 75, xp: 28, lb: [2, 12], power: 0.5, stamina: 1.05, surge: [2.4, 4.0], surgeLen: 0.7, surgeMul: 1.8,
      art: { shape: 'fish', h: 0.27, top: '#3a6f8f', belly: '#e3f5ff', fin: '#5e93b3', pattern: 'spots', pc: 'rgba(255,255,255,0.75)' } },
    { id: 'arctic_pike', name: 'Arctic Pike', vista: 'frozen_tundra', rarity: 'Rare', spawnWeight: 15, coins: 190, xp: 65, lb: [4, 25], power: 0.75, stamina: 1.3, surge: [2.0, 3.4], surgeLen: 0.8, surgeMul: 1.9, mechanic: 'last_run',
      art: { shape: 'fish', h: 0.19, top: '#3d5f4f', belly: '#e8f0e2', fin: '#5f7f63', pattern: 'spots', pc: 'rgba(220,235,200,0.7)', snout: 1.4 } },
    { id: 'frost_wyrm', name: 'Frost Wyrm', vista: 'frozen_tundra', rarity: 'Legendary', spawnWeight: 2, coins: 800, xp: 260, lb: [40, 160], power: 1.1, stamina: 1.5, surge: [1.7, 2.8], surgeLen: 1.0, surgeMul: 2.0, mechanic: 'boss', isJackpot: true,
      art: { shape: 'serpent', h: 0.16, top: '#2b7fa8', belly: '#bff7ff', fin: '#7ff3ff', glow: '#7ff3ff' } },

    // BAYOU
    { id: 'swamp_guppy', name: 'Swamp Guppy', vista: 'bayou_blackwater', rarity: 'Common', spawnWeight: 80, coins: 15, xp: 11, lb: [0.1, 0.6], power: 0.2, stamina: 0.65, surge: [2.6, 4.2], surgeLen: 0.45, surgeMul: 1.6, mechanic: 'jerk',
      art: { shape: 'fish', h: 0.3, top: '#556b2f', belly: '#cfcf92', fin: '#b0563a', pattern: 'spots', pc: 'rgba(30,40,10,0.5)', tail: 1.5 } },
    { id: 'mud_catfish', name: 'Mud Catfish', vista: 'bayou_blackwater', rarity: 'Common', spawnWeight: 55, coins: 45, xp: 18, lb: [2, 15], power: 0.42, stamina: 0.95, surge: [2.8, 4.4], surgeLen: 0.6, surgeMul: 1.7, mechanic: 'heavy_drag',
      art: { shape: 'fish', h: 0.26, top: '#4a4436', belly: '#c4b99c', fin: '#3a352a', pattern: 'none', whiskers: true } },
    { id: 'snapping_turtle', name: 'Snapping Turtle', vista: 'bayou_blackwater', rarity: 'Uncommon', spawnWeight: 30, coins: 90, xp: 32, lb: [5, 35], power: 0.55, stamina: 1.1, surge: [2.6, 4.0], surgeLen: 0.6, surgeMul: 1.8, mechanic: 'snap_tension',
      art: { shape: 'turtle', top: '#3b4a33', belly: '#8a8a5a', fin: '#5a6648' } },
    { id: 'ghost_gar', name: 'Ghost Gar', vista: 'bayou_blackwater', rarity: 'Rare', spawnWeight: 10, coins: 240, xp: 70, lb: [5, 30], power: 0.78, stamina: 1.3, surge: [2.0, 3.4], surgeLen: 0.8, surgeMul: 1.9, mechanic: 'fake_out',
      art: { shape: 'fish', h: 0.15, top: '#8a96a0', belly: '#eef1f3', fin: '#9aa6af', pattern: 'spots', pc: 'rgba(40,50,60,0.55)', snout: 1.8, ghost: true } },
    { id: 'king_croc', name: 'King Croc', vista: 'bayou_blackwater', rarity: 'Legendary', spawnWeight: 1, coins: 1500, xp: 320, lb: [150, 800], power: 1.1, stamina: 1.6, surge: [1.6, 2.6], surgeLen: 1.1, surgeMul: 2.0, mechanic: 'boss', isJackpot: true,
      art: { shape: 'croc', top: '#2c4a34', belly: '#a9b98a', fin: '#1c3324' } },
  ];

  const RARITY = {
    Common: { color: '#cbd5e1', order: 0 },
    Uncommon: { color: '#4ade80', order: 1 },
    Rare: { color: '#60a5fa', order: 2 },
    Legendary: { color: '#fbbf24', order: 3 },
  };

  /* ---------------- GEAR ----------------
   * Rods reduce tension gain. Reels raise reel speed + drill speed. Lures change bite speed / rare odds.
   * Reel ids match v4 save ids so selections migrate.
   */
  const RODS = [
    { id: 'willow', name: 'Willow Rod', emoji: '🎋', level: 1, cost: 0, tensionMul: 1.0, desc: 'Reliable starter rod.' },
    { id: 'graphite', name: 'Graphite Rod', emoji: '🎣', level: 3, cost: 300, tensionMul: 0.88, desc: '−12% line tension.' },
    { id: 'carbon', name: 'Carbon Rod', emoji: '🪝', level: 8, cost: 1200, tensionMul: 0.78, desc: '−22% line tension.' },
    { id: 'titan', name: 'Titan Rod', emoji: '🔱', level: 15, cost: 4000, tensionMul: 0.68, desc: '−32% line tension.' },
  ];
  const REELS = [
    { id: 'basic', name: 'Basic Reel', emoji: '⚙️', level: 1, cost: 0, speed: 1.0, oldLevel: 1, desc: 'Gets the job done.' },
    { id: 'bronze', name: 'Bronze Reel', emoji: '🥉', level: 4, cost: 250, speed: 1.12, oldLevel: 8, desc: '+12% reel speed.' },
    { id: 'silver', name: 'Silver Reel', emoji: '🥈', level: 8, cost: 900, speed: 1.25, oldLevel: 18, desc: '+25% reel speed.' },
    { id: 'gold', name: 'Gold Reel', emoji: '🥇', level: 12, cost: 2200, speed: 1.4, oldLevel: 28, desc: '+40% reel speed.' },
    { id: 'platinum', name: 'Platinum Reel', emoji: '✨', level: 18, cost: 5000, speed: 1.55, oldLevel: 40, desc: '+55% reel speed.' },
    { id: 'legendary', name: 'Legendary Reel', emoji: '🌟', level: 25, cost: 12000, speed: 1.75, oldLevel: 60, desc: '+75% reel speed.' },
  ];
  const LURES = [
    { id: 'worm', name: 'Nightcrawler', emoji: '🪱', level: 1, cost: 0, biteMul: 1.0, rareMul: 1.0, desc: 'Classic bait.' },
    { id: 'spinner', name: 'Spinner', emoji: '🌀', level: 2, cost: 200, biteMul: 0.75, rareMul: 1.0, desc: 'Bites 25% faster.' },
    { id: 'jig', name: 'Feather Jig', emoji: '🪶', level: 6, cost: 900, biteMul: 0.9, rareMul: 1.4, desc: '+40% rare & legendary odds.' },
    { id: 'firefly', name: 'Firefly Fly', emoji: '✨', level: 12, cost: 3000, biteMul: 0.75, rareMul: 1.7, desc: 'Fast bites, +70% rare odds.' },
  ];
  const BOBBERS = [
    { id: 'classic', name: 'Classic', color: '#ff5a5a', level: 1 },
    { id: 'golden', name: 'Golden', color: '#fbbf24', level: 5 },
    { id: 'emerald', name: 'Emerald', color: '#22c55e', level: 10 },
    { id: 'sapphire', name: 'Sapphire', color: '#3b82f6', level: 15 },
    { id: 'amethyst', name: 'Amethyst', color: '#a855f7', level: 20 },
    { id: 'obsidian', name: 'Obsidian', color: '#334155', level: 30 },
    { id: 'diamond', name: 'Diamond', color: '#e0f2fe', level: 50 },
  ];

  /* ---------------- LEVELS ---------------- */
  // XP needed to go from level L to L+1
  const xpStep = (L) => 40 + 20 * L;
  function xpForLevel(L) { // cumulative XP to reach level L
    let t = 0;
    for (let i = 1; i < L; i++) t += xpStep(i);
    return t;
  }
  function levelFromXp(xp) {
    let L = 1, need = xpStep(1), acc = 0;
    while (xp >= acc + need && L < 999) { acc += need; L++; need = xpStep(L); }
    return { level: L, into: xp - acc, need };
  }

  /* ---------------- SAVE ---------------- */
  const SAVE_KEY = 'reelloop_save_v5';
  const OLD_KEY = 'reelloop_save_v4';

  function defaultSave() {
    return {
      v: 5,
      coins: 0,
      xp: 0,
      catches: 0,
      unlocked: { sunny_lake: true, frozen_tundra: false, bayou_blackwater: false },
      currentVista: 'sunny_lake',
      cast: { perfect: 0, total: 0 },
      dex: {},               // { fishId: { n, best, trophy } }
      vistaBonus: {},        // { vistaId: true } one-time completion bonus claimed
      owned: { rods: ['willow'], reels: ['basic'], lures: ['worm'] },
      gear: { rod: 'willow', reel: 'basic', lure: 'worm', bobber: 'classic' },
      usePrecisionCast: true,
      soundOn: true,
      hapticsOn: true,
      jackpotIn: 6,          // catches until next jackpot
      stats: { sessions: 0, fights: 0, wins: 0, snaps: 0, escapes: 0, nearMiss: 0, spooks: 0, missedTakes: 0, playMs: 0 },
      tutorialDone: false,
    };
  }

  // v4 -> v5 migration. Never lowers a player's level; keeps coins, collection counts, unlocks, selections.
  function migrateV4(old) {
    const s = defaultSave();
    s.coins = Math.max(0, old.coins | 0);
    s.catches = Math.max(0, old.catches | 0);
    const oldLevel = Math.max(1, 1 + Math.floor(s.catches / 5));
    s.xp = xpForLevel(oldLevel) + Math.round((s.catches % 5) / 5 * xpStep(oldLevel));
    s.unlocked = Object.assign({}, s.unlocked, old.unlocked || {});
    s.unlocked.sunny_lake = true;
    if (old.currentVista && s.unlocked[old.currentVista]) s.currentVista = old.currentVista;
    if (old.cast) s.cast = { perfect: old.cast.perfect | 0, total: old.cast.total | 0 };
    const col = old.collection || {};
    for (const id in col) {
      if (FISH.some((f) => f.id === id) && col[id] > 0) s.dex[id] = { n: col[id] | 0, best: 0, trophy: false };
    }
    // Reels the player had already unlocked under the old level gates stay owned.
    s.owned.reels = REELS.filter((r) => oldLevel >= r.oldLevel).map((r) => r.id);
    if (old.reel && s.owned.reels.includes(old.reel)) s.gear.reel = old.reel;
    if (old.bobber && BOBBERS.some((b) => b.id === old.bobber)) s.gear.bobber = old.bobber;
    if (typeof old.usePrecisionCast === 'boolean') s.usePrecisionCast = old.usePrecisionCast;
    if (typeof old.soundOn === 'boolean') s.soundOn = old.soundOn;
    s.tutorialDone = s.catches > 0;
    s.migratedFrom = 4;
    return s;
  }

  function normalizeSave(data) {
    const d = defaultSave();
    const s = Object.assign(d, data || {});
    s.unlocked = Object.assign(defaultSave().unlocked, s.unlocked || {});
    s.owned = Object.assign(defaultSave().owned, s.owned || {});
    s.gear = Object.assign(defaultSave().gear, s.gear || {});
    s.stats = Object.assign(defaultSave().stats, s.stats || {});
    s.cast = Object.assign({ perfect: 0, total: 0 }, s.cast || {});
    s.dex = s.dex || {};
    s.vistaBonus = s.vistaBonus || {};
    if (!s.unlocked[s.currentVista]) s.currentVista = 'sunny_lake';
    return s;
  }

  /* ---------------- FISH SELECTION + ROLLS ---------------- */
  function chooseFish(vistaId, opts, rnd) {
    rnd = rnd || Math.random;
    const pool = FISH.filter((f) => f.vista === vistaId);
    const rareMul = (opts && opts.rareMul) || 1;
    const weights = pool.map((f) => {
      let w = f.spawnWeight;
      if (f.rarity === 'Rare' || f.rarity === 'Legendary') w *= rareMul;
      else if (f.rarity === 'Uncommon') w *= 1 + (rareMul - 1) * 0.5;
      return w;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rnd() * total;
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[0];
  }

  // Weight roll: skewed small; top 10% = trophy.
  function rollSize(fish, rnd) {
    rnd = rnd || Math.random;
    const r = Math.pow(rnd(), 1.8);
    const lb = lerp(fish.lb[0], fish.lb[1], r);
    return { r, lb: Math.round(lb * (lb < 10 ? 100 : 10)) / (lb < 10 ? 100 : 10), trophy: r >= 0.81 };
  }

  function rewardFor(fish, size, jackpot) {
    const coins = Math.round(fish.coins * (0.75 + 0.75 * size.r) * (jackpot ? 2 : 1));
    const xp = Math.round(fish.xp * (0.8 + 0.6 * size.r) * (size.trophy ? 1.25 : 1));
    return { coins, xp };
  }

  /* ---------------- FIGHT MODEL ----------------
   * Hold to reel: progress rises, tension rises (more when the fish pulls/surges).
   * Release: tension falls, but the fish takes line back (progress falls).
   * Keeping tension in the ZONE gives a reel bonus. Tension 100 = snap. Progress 0 = fish escapes.
   */
  const ZONE = [55, 85];
  const TUNE = {
    startProgress: 20,
    reelBase: 15,          // %/s at pull 0 with basic reel
    reelPullDrag: 0.4,     // reel speed lost per unit pull
    zoneBonus: 1.45,
    tenReelBase: 16,       // tension/s when reeling, no pull
    tenReelPull: 34,       // + per unit pull
    tenRelax: 44,          // tension/s drop when released, no pull
    tenRelaxPull: 18,      // relax reduced per unit pull
    idleTensionCap: 92,    // releasing never snaps the line on its own
    lineOutPull: 5,       // progress/s lost per unit pull when released
    staminaReel: 0.09,     // stamina drain/s while reeling
    staminaZone: 0.07,     // extra drain/s while in zone
    staminaIdle: 0.04,
  };

  function newFight(fish, size, gear, opts, rnd) {
    rnd = rnd || Math.random;
    const sizeMul = 0.85 + 0.3 * (size ? size.r : 0.5);
    const easy = opts && opts.tutorial;
    return {
      fish,
      power: (easy ? 0.12 : fish.power) * sizeMul,
      staminaScale: (easy ? 0.5 : fish.stamina) * sizeMul,
      reelMul: (gear && gear.reelSpeed) || 1,
      tensionMul: ((gear && gear.tensionMul) || 1) * (easy ? 0.35 : 1),
      progress: TUNE.startProgress + ((opts && opts.bonusStart) || 0),
      tension: 25,
      stamina: 1,
      t: 0,
      surgeIn: lerp(fish.surge[0], fish.surge[1], rnd()) * (easy ? 2 : 1),
      surgeLeft: 0,
      surging: false,
      phase: 0,
      zoneTime: 0,
      peakProgress: 0,
      // special mechanic state
      snapWarnUntil: 0, snapUsed: false,
      slackUntil: 0, spikeAt: 0, fakeUsed: false, slackTaps: 0,
      lastRunUsed: false,
      events: [],            // drained by game.js each frame for juice
      result: null,          // 'win' | 'snap' | 'escape'
      reason: '',
    };
  }

  function emit(f, type, data) { f.events.push(Object.assign({ type }, data || {})); }

  function fightStep(f, reeling, dt, rnd) {
    if (f.result) return f;
    rnd = rnd || Math.random;
    dt = Math.min(0.05, Math.max(0, dt));
    const fish = f.fish;
    const mech = fish.mechanic;
    f.t += dt;

    // Boss phases at 34% / 67% progress
    if (mech === 'boss') {
      const ph = f.progress >= 67 ? 2 : f.progress >= 34 ? 1 : 0;
      if (ph > f.phase) { f.phase = ph; f.surgeIn = Math.min(f.surgeIn, 0.25); emit(f, 'phase', { phase: ph }); }
    }
    const phaseMul = 1 + 0.15 * f.phase;

    // Surges
    if (f.surging) {
      f.surgeLeft -= dt;
      if (f.surgeLeft <= 0) {
        f.surging = false;
        const gap = lerp(fish.surge[0], fish.surge[1], rnd()) / (1 + 0.3 * f.phase);
        f.surgeIn = gap * (0.6 + 0.4 * f.stamina + 0.2);
      }
    } else {
      f.surgeIn -= dt;
      if (f.surgeIn <= 0) {
        f.surging = true;
        f.surgeLeft = fish.surgeLen * (0.8 + 0.4 * rnd());
        emit(f, 'surge');
      }
    }

    // Arctic pike: one big last run when nearly landed
    if (mech === 'last_run' && !f.lastRunUsed && f.progress >= 78) {
      f.lastRunUsed = true; f.surging = true; f.surgeLeft = 1.6; emit(f, 'lastrun');
    }

    let pull = f.power * (0.3 + 0.7 * f.stamina) * phaseMul;
    if (f.surging) pull *= fish.surgeMul * (f.lastRunUsed && f.surgeLeft > 0 && mech === 'last_run' ? 1.15 : 1);

    // Swamp guppy: jerky tension kicks
    if (mech === 'jerk' && rnd() < 0.9 * dt) { f.tension += 5; emit(f, 'jerk'); }

    // Snapping turtle: SNAP warning — must release within the window
    if (mech === 'snap_tension' && !f.snapUsed && f.progress > 35 && rnd() < 0.3 * dt) {
      f.snapUsed = true; f.snapWarnUntil = f.t + 0.9; f.snapGrace = f.t + 0.35; emit(f, 'snapwarn');
    }
    if (f.snapWarnUntil && f.t < f.snapWarnUntil) {
      if (reeling && f.t > f.snapGrace) { f.result = 'snap'; f.reason = 'It snapped — let go on SNAP!'; emit(f, 'end'); return f; }
    } else if (f.snapWarnUntil && f.t >= f.snapWarnUntil) {
      f.snapWarnUntil = 0; emit(f, 'snapok');
    }

    // Ghost gar: fake-out slack then spike
    if (mech === 'fake_out' && !f.fakeUsed && f.progress > 30 && f.progress < 75 && rnd() < 0.35 * dt) {
      f.fakeUsed = true; f.slackUntil = f.t + 0.5 + 0.3 * rnd(); f.tension = 0; f.slackTaps = 0; emit(f, 'slack');
    }
    if (f.slackUntil) {
      if (f.t < f.slackUntil) {
        if (reeling) f.slackTaps += dt;
        f.tension = Math.max(0, f.tension - 60 * dt);
        updateDerived(f, dt, false);
        return f;
      }
      f.slackUntil = 0;
      f.tension = Math.min(99, 72 + f.slackTaps * 40);
      emit(f, 'spike');
    }

    const dragMul = mech === 'heavy_drag' ? 0.72 : 1;
    if (reeling) {
      const inZone = f.tension >= ZONE[0] && f.tension <= ZONE[1];
      const gain = TUNE.reelBase * f.reelMul * Math.max(0.25, 1.1 - TUNE.reelPullDrag * pull) * (inZone ? TUNE.zoneBonus : 1) * dragMul;
      f.progress += gain * dt;
      f.tension += (TUNE.tenReelBase + TUNE.tenReelPull * pull) * f.tensionMul * dt;
      f.stamina -= (TUNE.staminaReel + (inZone ? TUNE.staminaZone : 0)) * dt / f.staminaScale;
      if (inZone) f.zoneTime += dt;
    } else {
      const rate = TUNE.tenRelax - TUNE.tenRelaxPull * pull;
      if (rate >= 0) f.tension -= rate * dt;
      else if (f.tension < TUNE.idleTensionCap) f.tension = Math.min(TUNE.idleTensionCap, f.tension - rate * dt * 0.5);
      f.progress -= TUNE.lineOutPull * pull * dt;
      f.stamina -= TUNE.staminaIdle * dt / f.staminaScale;
    }
    updateDerived(f, dt, reeling);
    return f;
  }

  function updateDerived(f, dt, reeling) {
    f.stamina = clamp(f.stamina, 0, 1);
    f.tension = clamp(f.tension, 0, 100);
    f.progress = Math.min(100, f.progress);
    f.peakProgress = Math.max(f.peakProgress, f.progress);
    if (f.tension >= 100) { f.result = 'snap'; f.reason = 'Line snapped.'; emit(f, 'end'); }
    else if (f.progress >= 100) { f.result = 'win'; emit(f, 'end'); }
    else if (f.progress <= 0) { f.result = 'escape'; f.reason = 'It got away.'; emit(f, 'end'); }
  }

  const RL = {
    VISTAS, FISH, RARITY, RODS, REELS, LURES, BOBBERS, ZONE, TUNE,
    xpStep, xpForLevel, levelFromXp,
    SAVE_KEY, OLD_KEY, defaultSave, migrateV4, normalizeSave,
    chooseFish, rollSize, rewardFor, newFight, fightStep,
    clamp, lerp,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = RL;
  else root.RL = RL;
})(typeof window !== 'undefined' ? window : globalThis);
