/* ReelLoop v5 — runtime (DOM + canvas). Requires core.js (window.RL). */
(function () {
  'use strict';
  const RL = window.RL;
  const { VISTAS, FISH, RARITY, RODS, REELS, LURES, BOBBERS, ZONE, clamp, lerp } = RL;
  const VERSION = '5.0.0';
  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const fmtLb = (lb) => (lb < 10 ? lb.toFixed(2) : lb.toFixed(1)) + ' lb';

  const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const IS_STANDALONE = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
  const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ============ VIEWPORT / FULLSCREEN (kept from v4) ============ */
  function setViewportUnits() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty('--vh', h * 0.01 + 'px');
  }
  setViewportUnits();
  window.addEventListener('resize', setViewportUnits, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(setViewportUnits, 150), { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', setViewportUnits, { passive: true });

  async function toggleFullscreen() {
    if (IS_IOS && !IS_STANDALONE) { toast('iOS: Add to Home Screen for true fullscreen', 1600); return; }
    const d = document, root = $('app');
    const fsEl = d.fullscreenElement || d.webkitFullscreenElement;
    if (fsEl) { try { if (d.exitFullscreen) await d.exitFullscreen(); else if (d.webkitExitFullscreen) d.webkitExitFullscreen(); } catch (e) {} document.body.classList.remove('pseudo-fs'); return; }
    let ok = false;
    try { if (root.requestFullscreen) { await root.requestFullscreen({ navigationUI: 'hide' }); ok = true; } else if (root.webkitRequestFullscreen) { root.webkitRequestFullscreen(); ok = true; } } catch (e) { ok = false; }
    if (!ok) document.body.classList.add('pseudo-fs');
    setViewportUnits();
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('pseudo-fs'); setViewportUnits(); });

  /* ============ SAVE ============ */
  function loadSave() {
    try {
      const cur = OL.store.getJSON(RL.SAVE_KEY);
      if (cur) return RL.normalizeSave(cur);
      const old = OL.store.getJSON(RL.OLD_KEY);
      if (old) return RL.normalizeSave(RL.migrateV4(old));
    } catch (e) {}
    return RL.defaultSave();
  }
  let S = loadSave();
  let saveQueued = false;
  function save() {
    OL.store.setJSON(RL.SAVE_KEY, S); // falls back to memory in private mode
  }
  function saveSoon() { if (!saveQueued) { saveQueued = true; setTimeout(() => { saveQueued = false; save(); }, 400); } }

  /* ============ ANALYTICS ============
   * Zero-coupling: posts to the parent frame (wrapper can forward to GA/Plausible later)
   * and dispatches a DOM event. Keeps the last 200 events locally for debugging.
   */
  const SID = Math.random().toString(36).slice(2, 10);
  function track(e, props) {
    const ev = Object.assign({ e, v: VERSION, sid: SID, ts: Date.now(), lvl: levelInfo().level, vista: S.currentVista }, props || {});
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ source: 'reelloop', type: 'analytics', event: ev }, '*'); } catch (err) {}
    try { window.dispatchEvent(new CustomEvent('reelloop:track', { detail: ev })); } catch (err) {}
    try {
      const k = 'reelloop_events';
      const arr = OL.store.getJSON(k, []);
      arr.push(ev); while (arr.length > 200) arr.shift();
      OL.store.setJSON(k, arr);
    } catch (err) {}
  }

  /* ============ AUDIO / HAPTICS ============ */
  let audioCtx = null, noiseBuf = null;
  function ensureAudio() {
    if (!S.soundOn) return null;
    try {
      if (!audioCtx) audioCtx = OL.audio.context();
      if (!audioCtx) return null;
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  function tone(freq, type, dur, gain, delay) {
    const ac = ensureAudio(); if (!ac) return;
    try {
      const t0 = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(Math.max(40, freq * pitchMul), t0);
      g.gain.setValueAtTime(gain || 0.05, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.08));
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + (dur || 0.08) + 0.02);
    } catch (e) {}
  }
  function noise(dur, gain, hp) {
    const ac = ensureAudio(); if (!ac) return;
    try {
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t0 = ac.currentTime;
      s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = hp || 900; f.Q.value = 0.8;
      g.gain.setValueAtTime(gain || 0.08, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.25));
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t0); s.stop(t0 + (dur || 0.25));
    } catch (e) {}
  }
  let pitchMul = 1;
  function vibrate(p) { if (!S.hapticsOn) return; OL.haptics.vibrate(p); }
  const sfx = {
    splash: (big) => { noise(big ? 0.45 : 0.25, big ? 0.12 : 0.07, big ? 600 : 1100); },
    click: () => tone(1800, 'square', 0.015, 0.012),
    perfect: () => { tone(800, 'square', 0.07, 0.05); tone(1000, 'square', 0.07, 0.05, 0.09); tone(1320, 'square', 0.09, 0.05, 0.18); },
    thud: () => tone(150, 'sawtooth', 0.12, 0.05),
    nibble: () => tone(520, 'sine', 0.05, 0.03),
    take: () => { tone(330, 'triangle', 0.12, 0.07); noise(0.2, 0.08, 700); },
    hook: () => { tone(440, 'square', 0.06, 0.06); tone(660, 'square', 0.08, 0.06, 0.07); },
    surge: () => tone(180, 'sawtooth', 0.15, 0.05),
    warn: () => tone(1250, 'square', 0.06, 0.04),
    win: () => { [660, 880, 990, 1320].forEach((f, i) => tone(f, 'square', 0.09, 0.05, i * 0.08)); },
    lose: () => { tone(260, 'sawtooth', 0.14, 0.05); tone(170, 'sawtooth', 0.22, 0.05, 0.12); },
    coin: () => { tone(1320, 'square', 0.05, 0.035); tone(1760, 'square', 0.06, 0.035, 0.05); },
    ui: () => tone(520, 'sine', 0.05, 0.035),
    buy: () => { tone(660, 'triangle', 0.08, 0.05); tone(990, 'triangle', 0.1, 0.05, 0.08); },
    levelUp: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.14, 0.06, i * 0.1)); },
  };

  /* ============ DERIVED STATE ============ */
  const byId = (arr, id) => arr.find((x) => x.id === id) || arr[0];
  const levelInfo = () => RL.levelFromXp(S.xp);
  const vista = () => byId(VISTAS, S.currentVista);
  const gear = () => ({ rod: byId(RODS, S.gear.rod), reel: byId(REELS, S.gear.reel), lure: byId(LURES, S.gear.lure), bobber: byId(BOBBERS, S.gear.bobber) });

  /* ============ CANVAS SCENE ============ */
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  let W = 300, H = 400, DPR = 1;
  function resizeCanvas() {
    const r = $('stage').getBoundingClientRect();
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bakeBackground();
  }
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe($('stage'));
  window.addEventListener('resize', resizeCanvas);

  const horizon = () => H * 0.34;
  const rodButt = () => ({ x: W * 0.94, y: H + 8 });
  const holePos = () => ({ x: W * 0.5, y: H * 0.64 });

  // Static background baked to an offscreen canvas per vista/size (cheap per-frame).
  let bg = null;
  function bakeBackground() {
    bg = document.createElement('canvas');
    bg.width = canvas.width; bg.height = canvas.height;
    const b = bg.getContext('2d');
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    const v = vista().id, hz = horizon();
    let rs = 1234; const rr = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
    if (v === 'sunny_lake') {
      let g = b.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#5fb3ea'); g.addColorStop(1, '#d4ecf8');
      b.fillStyle = g; b.fillRect(0, 0, W, hz + 2);
      const sg = b.createRadialGradient(W * 0.78, hz * 0.35, 0, W * 0.78, hz * 0.35, hz * 0.6); sg.addColorStop(0, 'rgba(255,248,214,1)'); sg.addColorStop(0.18, 'rgba(255,236,170,.95)'); sg.addColorStop(1, 'rgba(255,236,170,0)');
      b.fillStyle = sg; b.fillRect(0, 0, W, hz);
      ridge(b, hz, hz * 0.45, '#8fb3c9', 0.8, rr); ridge(b, hz, hz * 0.22, '#4f7d5f', 2.2, rr); trees(b, hz, '#2c5a3a', 26, rr);
      g = b.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#5cb7de'); g.addColorStop(0.35, '#2a8fc4'); g.addColorStop(1, '#0d4a73');
      b.fillStyle = g; b.fillRect(0, hz, W, H - hz);
      // dock
      b.fillStyle = '#6b4a2c'; b.beginPath(); b.moveTo(0, H); b.lineTo(0, H * 0.86); b.lineTo(W * 0.34, H * 0.9); b.lineTo(W * 0.42, H); b.fill();
      b.strokeStyle = 'rgba(0,0,0,.25)'; b.lineWidth = 2;
      for (let i = 1; i < 5; i++) { b.beginPath(); b.moveTo(0, H * 0.86 + i * H * 0.03); b.lineTo(W * 0.34 + i * W * 0.02, H * 0.9 + i * H * 0.025); b.stroke(); }
    } else if (v === 'frozen_tundra') {
      let g = b.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#7e9dc4'); g.addColorStop(1, '#e8eff7');
      b.fillStyle = g; b.fillRect(0, 0, W, hz + 2);
      ridge(b, hz, hz * 0.6, '#c9d9ea', 1.2, rr, true); ridge(b, hz, hz * 0.3, '#9db7cf', 2.0, rr, true); trees(b, hz, '#2b4256', 14, rr);
      g = b.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#dbe9f4'); g.addColorStop(1, '#a9c6dc');
      b.fillStyle = g; b.fillRect(0, hz, W, H - hz);
      b.strokeStyle = 'rgba(255,255,255,.55)'; b.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const y = lerp(hz, H, rr()); b.beginPath(); b.moveTo(rr() * W, y); b.lineTo(rr() * W, y + rand(-8, 8)); b.stroke(); }
      // hole
      const hp = holePos();
      b.fillStyle = 'rgba(255,255,255,.7)'; b.beginPath(); b.ellipse(hp.x, hp.y + 3, 46, 16, 0, 0, Math.PI * 2); b.fill();
    } else {
      let g = b.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#2c3a2c'); g.addColorStop(1, '#8a9a6e');
      b.fillStyle = g; b.fillRect(0, 0, W, hz + 2);
      const mg = b.createRadialGradient(W * 0.25, hz * 0.4, 0, W * 0.25, hz * 0.4, hz * 0.5); mg.addColorStop(0, 'rgba(255,240,200,.7)'); mg.addColorStop(0.12, 'rgba(255,240,200,.35)'); mg.addColorStop(1, 'rgba(255,240,200,0)');
      b.fillStyle = mg; b.fillRect(0, 0, W, hz);
      ridge(b, hz, hz * 0.2, '#2a3826', 2.5, rr); cypress(b, hz, rr);
      g = b.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#4b5a3c'); g.addColorStop(0.3, '#2e3b2b'); g.addColorStop(1, '#121a12');
      b.fillStyle = g; b.fillRect(0, hz, W, H - hz);
      for (let i = 0; i < 7; i++) { const x = rr() * W, y = lerp(hz + 20, H - 20, rr()), s = lerp(6, 16, (y - hz) / (H - hz)); b.fillStyle = '#3f6b2a'; b.beginPath(); b.ellipse(x, y, s * 1.6, s * 0.6, 0, 0.3, Math.PI * 2); b.fill(); }
    }
  }
  function ridge(b, hz, amp, col, freq, rr, snow) {
    b.fillStyle = col; b.beginPath(); b.moveTo(0, hz + 1);
    const ph = rr() * 10;
    for (let x = 0; x <= W; x += 6) b.lineTo(x, hz - amp * (0.45 + 0.35 * Math.sin(x / W * Math.PI * freq + ph) + 0.2 * Math.sin(x / W * Math.PI * freq * 3.1 + ph * 2)));
    b.lineTo(W, hz + 1); b.closePath(); b.fill();
    if (snow) { b.save(); b.clip(); b.fillStyle = 'rgba(255,255,255,.55)'; b.fillRect(0, 0, W, hz - amp * 0.62); b.restore(); }
  }
  function trees(b, hz, col, n, rr) {
    b.fillStyle = col;
    for (let i = 0; i < n; i++) { const x = rr() * W, h = rand(10, 26); b.beginPath(); b.moveTo(x, hz - h); b.lineTo(x - h * 0.3, hz + 1); b.lineTo(x + h * 0.3, hz + 1); b.fill(); }
  }
  function cypress(b, hz, rr) {
    for (let i = 0; i < 6; i++) {
      const x = rr() * W, h = rand(hz * 0.5, hz * 0.95), w = rand(14, 26);
      b.fillStyle = '#1b261b'; b.fillRect(x - 3, hz - h * 0.6, 6, h * 0.6 + 2);
      b.beginPath(); b.moveTo(x - w * 0.6, hz + 2); b.lineTo(x - 5, hz - h * 0.3); b.lineTo(x + 5, hz - h * 0.3); b.lineTo(x + w * 0.6, hz + 2); b.fill();
      b.beginPath(); b.ellipse(x, hz - h * 0.7, w, h * 0.32, 0, 0, Math.PI * 2); b.fill();
      b.strokeStyle = 'rgba(140,150,110,.5)'; b.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const mx = x + rand(-w, w); b.beginPath(); b.moveTo(mx, hz - h * 0.6); b.lineTo(mx + rand(-2, 2), hz - h * 0.6 + rand(10, 30)); b.stroke(); }
    }
  }

  /* ---------- procedural fish ---------- */
  function drawFish(c, art, x, y, L, dir, t, o) {
    o = o || {};
    const sil = o.silhouette ? (o.silColor || 'rgba(0,0,0,0.5)') : null;
    const col = (k) => sil || art[k];
    c.save(); c.translate(x, y); c.scale(dir, 1);
    if (o.alpha != null) c.globalAlpha = o.alpha;
    const wig = Math.sin(t * (o.fast ? 16 : 7)) * 0.12 * (o.wiggle == null ? 1 : o.wiggle);
    if (art.glow && !sil) { c.shadowColor = art.glow; c.shadowBlur = 16; }
    if (art.ghost && !sil) { c.globalAlpha *= 0.82; c.shadowColor = 'rgba(220,235,255,.8)'; c.shadowBlur = 12; }

    if (art.shape === 'serpent') {
      const segs = 22, h = L * art.h;
      for (let i = segs; i >= 0; i--) {
        const u = i / segs, px = lerp(-L / 2, L * 0.42, u), py = Math.sin(u * 7 - t * 4) * h * 0.55 * (1 - u * 0.6);
        const r = h * 0.5 * (0.25 + 0.75 * Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.5 + 0.2));
        const g = c.createLinearGradient(px, py - r, px, py + r); g.addColorStop(0, sil || art.top); g.addColorStop(1, sil || art.belly);
        c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
        if (!sil && i % 3 === 0) { c.fillStyle = art.fin; c.beginPath(); c.moveTo(px - r * 0.4, py - r * 0.8); c.lineTo(px, py - r * 1.7); c.lineTo(px + r * 0.4, py - r * 0.8); c.fill(); }
      }
      const hx = L * 0.42, hy = Math.sin(7 - t * 4) * h * 0.55 * 0.4;
      c.fillStyle = col('top'); c.beginPath(); c.moveTo(hx - h * 0.3, hy - h * 0.45); c.lineTo(hx + h * 0.9, hy); c.lineTo(hx - h * 0.3, hy + h * 0.45); c.fill();
      if (!sil) { c.shadowBlur = 0; c.fillStyle = '#e6fdff'; c.beginPath(); c.arc(hx + h * 0.1, hy - h * 0.12, h * 0.1, 0, Math.PI * 2); c.fill(); }
      c.restore(); return;
    }
    if (art.shape === 'turtle') {
      const rx = L * 0.33, ry = L * 0.24;
      c.fillStyle = col('fin');
      for (const [fx, fy, a] of [[0.22, -0.8, -0.6], [0.22, 0.8, 0.6], [-0.25, -0.75, -2.4], [-0.25, 0.75, 2.4]]) {
        c.save(); c.translate(fx * L, fy * ry); c.rotate(a + wig * 2); c.beginPath(); c.ellipse(L * 0.08, 0, L * 0.11, L * 0.045, 0, 0, Math.PI * 2); c.fill(); c.restore();
      }
      c.beginPath(); c.moveTo(-rx, 0); c.lineTo(-rx - L * 0.12, wig * 30); c.lineTo(-rx, ry * 0.2); c.fill();
      c.beginPath(); c.ellipse(rx + L * 0.08, wig * 10, L * 0.09, L * 0.07, 0, 0, Math.PI * 2); c.fill();
      const g = c.createRadialGradient(-rx * 0.2, -ry * 0.3, 2, 0, 0, rx); g.addColorStop(0, sil || '#5d6e4d'); g.addColorStop(1, sil || art.top);
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.fill();
      if (!sil) {
        c.strokeStyle = 'rgba(20,25,15,.6)'; c.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * rx * 0.48, 0, rx * 0.24, ry * 0.42, 0, 0, Math.PI * 2); c.stroke(); }
        c.fillStyle = '#111'; c.beginPath(); c.arc(rx + L * 0.12, -L * 0.02 + wig * 10, L * 0.015, 0, Math.PI * 2); c.fill();
      }
      c.restore(); return;
    }
    if (art.shape === 'croc') {
      const h = L * 0.13;
      c.fillStyle = col('fin');
      for (const [fx, fy] of [[0.15, -1], [0.15, 1], [-0.12, -1], [-0.12, 1]]) { c.beginPath(); c.ellipse(fx * L, fy * h * 0.9, L * 0.05, h * 0.35, fy * 0.7 + wig, 0, Math.PI * 2); c.fill(); }
      const g = c.createLinearGradient(0, -h, 0, h); g.addColorStop(0, sil || art.top); g.addColorStop(1, sil || art.belly);
      c.fillStyle = g; c.beginPath();
      c.moveTo(-L * 0.5, wig * 40);
      c.quadraticCurveTo(-L * 0.25, -h * 0.9, 0, -h); c.lineTo(L * 0.22, -h * 0.85); c.lineTo(L * 0.5, -h * 0.25); c.lineTo(L * 0.5, h * 0.2); c.lineTo(L * 0.22, h * 0.8);
      c.lineTo(0, h); c.quadraticCurveTo(-L * 0.25, h * 0.9, -L * 0.5, wig * 40 + 2); c.fill();
      if (!sil) {
        c.fillStyle = 'rgba(15,30,20,.75)';
        for (let i = 0; i < 12; i++) { const px = lerp(-L * 0.42, L * 0.15, i / 11); c.beginPath(); c.moveTo(px - 4, -h * 0.85 + Math.abs(px) * 0.02); c.lineTo(px, -h * 1.15); c.lineTo(px + 4, -h * 0.85); c.fill(); }
        c.strokeStyle = 'rgba(240,240,220,.8)'; c.lineWidth = 1;
        for (let i = 0; i < 6; i++) { const px = L * 0.3 + i * L * 0.03; c.beginPath(); c.moveTo(px, -h * 0.05); c.lineTo(px + 2, h * 0.08); c.stroke(); }
        c.fillStyle = '#e7d55a'; c.beginPath(); c.arc(L * 0.2, -h * 0.7, h * 0.14, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#111'; c.fillRect(L * 0.2 - 1, -h * 0.82, 2, h * 0.24);
      }
      c.restore(); return;
    }
    // generic fish
    const h = L * (art.h || 0.3), sn = art.snout || 1, tk = art.tail || 1;
    const hx = L * 0.5;
    // tail
    c.save(); c.translate(-L * 0.38, 0); c.rotate(wig);
    c.fillStyle = col('fin'); c.beginPath(); c.moveTo(0, 0); c.lineTo(-L * 0.14 * tk, -h * 0.55 * tk); c.lineTo(-L * 0.08 * tk, 0); c.lineTo(-L * 0.14 * tk, h * 0.55 * tk); c.closePath(); c.fill();
    c.restore();
    // dorsal + anal fins
    c.fillStyle = col('fin');
    c.beginPath(); c.moveTo(-L * 0.18, -h * 0.4); c.quadraticCurveTo(-L * 0.02, -h * 0.95, L * 0.12, -h * 0.46); c.fill();
    c.beginPath(); c.moveTo(-L * 0.22, h * 0.36); c.quadraticCurveTo(-L * 0.12, h * 0.7, -L * 0.02, h * 0.42); c.fill();
    // body
    const bodyPath = () => {
      c.beginPath(); c.moveTo(-L * 0.4, -h * 0.1);
      c.bezierCurveTo(-L * 0.24, -h * 0.58, L * 0.18, -h * 0.62, hx * (sn > 1 ? 0.82 : 1), -h * 0.06);
      if (sn > 1) c.lineTo(hx + (sn - 1) * L * 0.22, h * 0.0);
      c.lineTo(hx * (sn > 1 ? 0.82 : 1), h * 0.1);
      c.bezierCurveTo(L * 0.18, h * 0.62, -L * 0.24, h * 0.56, -L * 0.4, h * 0.1); c.closePath();
    };
    bodyPath();
    if (sil) c.fillStyle = sil;
    else { const g = c.createLinearGradient(0, -h * 0.5, 0, h * 0.5); g.addColorStop(0, art.top); g.addColorStop(0.55, art.belly); g.addColorStop(1, art.belly); c.fillStyle = g; }
    c.fill();
    if (!sil) {
      c.save(); bodyPath(); c.clip();
      const p = art.pattern;
      if (p === 'bars') { c.fillStyle = art.pc; for (let i = 0; i < 6; i++) { const px = lerp(-L * 0.3, L * 0.25, i / 5); c.beginPath(); c.ellipse(px, -h * 0.15, L * 0.03, h * 0.42, 0, 0, Math.PI * 2); c.fill(); } }
      else if (p === 'stripe') { c.fillStyle = art.pc; c.globalAlpha *= 0.7; c.fillRect(-L * 0.45, -h * 0.08, L, h * 0.16); c.globalAlpha /= 0.7; }
      else if (p === 'blotch') { c.fillStyle = art.pc; for (let i = 0; i < 9; i++) { const px = lerp(-L * 0.36, L * 0.3, i / 8); c.beginPath(); c.ellipse(px, Math.sin(i * 1.7) * h * 0.06, L * 0.045, h * 0.1, 0, 0, Math.PI * 2); c.fill(); } }
      if (p === 'spots' || art.spots) {
        c.fillStyle = art.spots || art.pc; let s = 7;
        for (let i = 0; i < 26; i++) { s = (s * 9301 + 49297) % 233280; const u = s / 233280; s = (s * 9301 + 49297) % 233280; const v2 = s / 233280; c.beginPath(); c.arc(lerp(-L * 0.36, L * 0.32, u), lerp(-h * 0.42, h * 0.2, v2), Math.max(1, L * 0.012), 0, Math.PI * 2); c.fill(); }
      }
      // sheen
      const sh = c.createLinearGradient(0, -h * 0.5, 0, 0); sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sh; c.fillRect(-L * 0.5, -h * 0.5, L * 1.2, h * 0.5);
      c.restore();
      // gill + eye
      c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = Math.max(1, L * 0.008);
      c.beginPath(); c.arc(L * 0.3, 0, h * 0.34, -1.1, 1.1); c.stroke();
      const ex = L * 0.38, ey = -h * 0.13, er = Math.max(1.6, h * 0.085);
      c.fillStyle = '#f8fafc'; c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0b0f14'; c.beginPath(); c.arc(ex + er * 0.2, ey, er * 0.58, 0, Math.PI * 2); c.fill();
      if (art.mouth) { c.strokeStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.moveTo(hx * 0.98, h * 0.04); c.lineTo(L * 0.34, h * 0.1); c.stroke(); }
      if (art.whiskers) { c.strokeStyle = 'rgba(30,25,20,.85)'; c.lineWidth = Math.max(1, L * 0.01); for (const k of [-1, 1, 0.4]) { c.beginPath(); c.moveTo(hx * 0.96, h * 0.05); c.quadraticCurveTo(hx + L * 0.08, h * 0.1 * k, hx + L * 0.12, h * 0.35 * k + wig * 20); c.stroke(); } }
    }
    // pectoral fin
    c.fillStyle = col('fin'); c.globalAlpha *= sil ? 1 : 0.6; c.beginPath(); c.ellipse(L * 0.2, h * 0.2, L * 0.075, Math.max(1.5, h * 0.07), 0.5 + wig, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // Silhouettes are drawn solid offscreen, then composited once, so overlapping parts don't double up.
  const silCanvas = document.createElement('canvas'), silCtx = silCanvas.getContext('2d');
  function drawSilhouette(c, art, x, y, L, dir, t, alpha, o) {
    const d = Math.min(2, window.devicePixelRatio || 1), w = Math.ceil(L * 1.7), h = Math.ceil(L * 1.1);
    if (silCanvas.width < w * d || silCanvas.height < h * d) { silCanvas.width = Math.max(silCanvas.width, w * d); silCanvas.height = Math.max(silCanvas.height, h * d); }
    silCtx.setTransform(d, 0, 0, d, 0, 0); silCtx.clearRect(0, 0, w + 2, h + 2);
    drawFish(silCtx, art, w / 2, h / 2, L, dir, t, Object.assign({}, o, { silhouette: true, silColor: (o && o.color) || '#000' }));
    c.save(); c.globalAlpha = alpha; c.drawImage(silCanvas, 0, 0, w * d, h * d, x - w / 2, y - h / 2, w, h); c.restore();
  }

  const iconCache = {};
  function fishIcon(f, silhouette) {
    const k = f.id + (silhouette ? ':s' : '');
    if (iconCache[k]) return iconCache[k];
    const c = document.createElement('canvas'); c.width = 240; c.height = 110;
    const x = c.getContext('2d');
    const L = f.art.shape === 'turtle' ? 150 : f.art.shape === 'croc' ? 225 : 200;
    if (silhouette) drawSilhouette(x, f.art, 120, 55, L, 1, 0.6, 0.22, { wiggle: 0, color: '#a0b4c8' }); else drawFish(x, f.art, 120, 55, L, 1, 0.6, { wiggle: 0 });
    return (iconCache[k] = c.toDataURL());
  }

  /* ---------- scene entities ---------- */
  const sc = {
    t: 0,
    bob: { x: 0, y: 0, vis: false, sub: 0, dip: 0 },
    fly: null,                 // cast flight animation
    ripples: [], parts: [], snow: [], flies: [],
    fish: { x: 0, y: 0, dir: 1, vis: false, jump: null },
    shake: 0,
  };
  function ripple(x, y, big) { sc.ripples.push({ x, y, r: 2, max: big ? 46 : 22, a: big ? 0.9 : 0.6 }); }
  function splash(x, y, n, col) {
    n = n || 14;
    for (let i = 0; i < n; i++) sc.parts.push({ x, y, vx: rand(-70, 70), vy: rand(-170, -60), g: 420, life: rand(0.4, 0.8), age: 0, r: rand(1.2, 2.6), col: col || 'rgba(220,240,255,.9)' });
  }
  function sparkle(x, y, n, col) {
    for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), sp = rand(60, 220); sc.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 60, life: rand(0.5, 1.0), age: 0, r: rand(1.5, 3), col: col || '#fde68a', glow: true }); }
  }

  function rodTip() {
    const bend = mode === 'fight' && fight ? fight.tension / 100 : 0;
    const f = sc.fish;
    const tx = W * 0.66, ty = H * 0.58;
    if (mode === 'fight' && fight) return { x: tx + (f.x - tx) * 0.12 * bend, y: ty + 26 * bend };
    return { x: tx, y: ty };
  }

  function render(dt) {
    sc.t += dt;
    const t = sc.t, v = vista().id, hz = horizon();
    ctx.save();
    if (sc.shake > 0 && !REDUCED_MOTION) { ctx.translate(rand(-1, 1) * sc.shake, rand(-1, 1) * sc.shake); sc.shake = Math.max(0, sc.shake - dt * 30); }
    if (bg) ctx.drawImage(bg, 0, 0, W, H);

    // water shimmer
    if (v !== 'frozen_tundra') {
      ctx.strokeStyle = v === 'bayou_blackwater' ? 'rgba(180,200,150,.12)' : 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 26; i++) {
        const yy = hz + ((i * 37) % 100) / 100 * (H - hz), p = (yy - hz) / (H - hz);
        const xx = ((i * 97 + t * (10 + p * 18)) % (W + 80)) - 40, len = 8 + p * 36;
        ctx.beginPath(); ctx.moveTo(xx, yy + Math.sin(t * 2 + i) * 1.5); ctx.lineTo(xx + len, yy + Math.sin(t * 2 + i) * 1.5); ctx.stroke();
      }
    } else {
      const hp = holePos();
      const hg = ctx.createRadialGradient(hp.x, hp.y, 4, hp.x, hp.y, 40); hg.addColorStop(0, '#0a2a40'); hg.addColorStop(1, '#14507a');
      ctx.fillStyle = holeOpen ? hg : `rgba(170,205,230,${0.3 + 0.7 * (1 - drillProg)})`;
      ctx.beginPath(); ctx.ellipse(hp.x, hp.y, 38 * (holeOpen ? 1 : 0.3 + 0.7 * drillProg), 13 * (holeOpen ? 1 : 0.3 + 0.7 * drillProg), 0, 0, Math.PI * 2); ctx.fill();
      if (!holeOpen && drillProg === 0) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(hp.x, hp.y, 38, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    }

    // fish under water (fight)
    const f = sc.fish;
    if (f.vis && fight && !f.jump) {
      const fishL = fishLen(fight.fish, fightSize) * lerp(0.55, 1.05, fight.progress / 100);
      const under = v === 'frozen_tundra' ? 0.18 : 0.42;
      drawSilhouette(ctx, fight.fish.art, f.x, f.y, fishL, f.dir, t, under, { color: '#05101a', fast: fight.surging, wiggle: fight.surging ? 1.6 : 0.8 });
    }

    // ripples
    for (let i = sc.ripples.length - 1; i >= 0; i--) {
      const r = sc.ripples[i]; r.r += dt * 40; r.a -= dt * 0.9;
      if (r.a <= 0 || r.r > r.max) { sc.ripples.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(255,255,255,${r.a})`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // line + bobber
    const tip = rodTip();
    let end = null;
    if (sc.fly) {
      const k = clamp((t - sc.fly.t0) / sc.fly.dur, 0, 1), e = 1 - Math.pow(1 - k, 2);
      end = { x: lerp(sc.fly.from.x, sc.fly.to.x, e), y: lerp(sc.fly.from.y, sc.fly.to.y, e) - Math.sin(k * Math.PI) * H * 0.22 };
      drawBobber(end.x, end.y, 0);
      if (k >= 1) { const cb = sc.fly.done; sc.fly = null; cb && cb(); }
    } else if (mode === 'fight' && fight) {
      end = { x: f.jump ? f.jump.x : f.x, y: f.jump ? f.jump.y : (v === 'frozen_tundra' ? holePos().y : clamp(f.y - 18, hz + 6, H)) };
      if (!f.jump && Math.random() < 0.3) ripple(end.x + rand(-4, 4), end.y, false);
    } else if (sc.bob.vis) {
      const b = sc.bob, bobY = b.y + Math.sin(t * 2.4) * 1.6 + b.dip * 7 + b.sub * 9;
      end = { x: b.x, y: bobY };
      drawBobber(b.x, bobY, b.sub);
    }
    if (end) {
      const tension = mode === 'fight' && fight ? fight.tension / 100 : 0.15;
      const mx = (tip.x + end.x) / 2, my = (tip.y + end.y) / 2 + (1 - tension) * 34;
      ctx.strokeStyle = tension > 0.85 ? 'rgba(255,170,170,.9)' : 'rgba(255,255,255,.75)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y);
      const jitter = mode === 'fight' && fight && fight.surging ? rand(-2, 2) : 0;
      ctx.quadraticCurveTo(mx + jitter, my + jitter, end.x, end.y); ctx.stroke();
    }

    // jumping fish
    if (f.jump) {
      const j = f.jump, k = clamp((t - j.t0) / j.dur, 0, 1);
      j.x = lerp(j.x0, j.x1, k); j.y = j.y0 - Math.sin(k * Math.PI) * j.h;
      const L = fishLen(fight ? fight.fish : null, fightSize) * 0.9;
      ctx.save(); ctx.translate(j.x, j.y); ctx.rotate((k - 0.5) * 1.6 * j.dir); drawFish(ctx, j.art, 0, 0, L, j.dir, t, { fast: true, wiggle: 1.5 }); ctx.restore();
      if (k >= 1) { splash(j.x, j.y0, 22); ripple(j.x, j.y0, true); sfx.splash(true); f.jump = null; }
    }

    // rod
    const butt = rodButt();
    ctx.strokeStyle = '#3a2716'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(butt.x, butt.y); ctx.quadraticCurveTo(lerp(butt.x, tip.x, 0.6), lerp(butt.y, tip.y, 0.5) + 6, tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 2; ctx.stroke();
    const rp = { x: lerp(butt.x, tip.x, 0.18), y: lerp(butt.y, tip.y, 0.18) - 8 };
    const reelCol = { basic: '#94a3b8', bronze: '#c08457', silver: '#e2e8f0', gold: '#fbbf24', platinum: '#e9d5ff', legendary: '#fde68a' }[S.gear.reel] || '#94a3b8';
    ctx.fillStyle = reelCol; ctx.beginPath(); ctx.arc(rp.x, rp.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.beginPath();
    const ra = reeling ? t * 18 : 0.6; ctx.moveTo(rp.x, rp.y); ctx.lineTo(rp.x + Math.cos(ra) * 9, rp.y + Math.sin(ra) * 9); ctx.stroke();

    // particles
    for (let i = sc.parts.length - 1; i >= 0; i--) {
      const p = sc.parts[i]; p.age += dt; if (p.age >= p.life) { sc.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.col;
      if (p.glow) { ctx.shadowColor = p.col; ctx.shadowBlur = 8; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // ambient: snow / fireflies / fog
    if (v === 'frozen_tundra' && !REDUCED_MOTION) {
      while (sc.snow.length < 50) sc.snow.push({ x: rand(0, W), y: rand(-H, H), s: rand(12, 30), r: rand(0.8, 2) });
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (const s of sc.snow) { s.y += s.s * dt; s.x += Math.sin(t + s.s) * 8 * dt; if (s.y > H) { s.y = -5; s.x = rand(0, W); } ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
    } else if (v === 'bayou_blackwater') {
      const fg = ctx.createLinearGradient(0, hz - 20, 0, hz + 60); fg.addColorStop(0, 'rgba(190,200,170,0)'); fg.addColorStop(0.5, `rgba(190,200,170,${0.22 + 0.05 * Math.sin(t * 0.5)})`); fg.addColorStop(1, 'rgba(190,200,170,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, hz - 20, W, 80);
      if (!REDUCED_MOTION) {
        while (sc.flies.length < 12) sc.flies.push({ x: rand(0, W), y: rand(hz * 0.5, H * 0.7), p: rand(0, 6) });
        for (const fl of sc.flies) { fl.x += Math.sin(t * 0.7 + fl.p) * 10 * dt; fl.y += Math.cos(t * 0.9 + fl.p) * 8 * dt; const a = 0.5 + 0.5 * Math.sin(t * 3 + fl.p); ctx.fillStyle = `rgba(230,255,120,${a})`; ctx.shadowColor = '#e6ff78'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(fl.x, fl.y, 1.6, 0, Math.PI * 2); ctx.fill(); }
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  function drawBobber(x, y, sub) {
    const col = gear().bobber.color, r = 7;
    if (sub >= 0.95) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 2, 0, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 20, y - 40, 40, 40 + r * (1 - sub)); ctx.clip();
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y - r - 7); ctx.stroke();
    if (gear().bobber.id === 'diamond' || gear().bobber.id === 'golden') { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x - 2.5, y - 3, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function fishLen(fish, size) {
    if (!fish) return 80;
    const base = { Common: 60, Uncommon: 82, Rare: 100, Legendary: 140 }[fish.rarity] || 70;
    return Math.min(W * 0.55, base * (0.8 + 0.4 * (size ? size.r : 0.5)));
  }

  /* ============ GAME STATE ============ */
  // modes: ready | casting | waiting | fight | result
  let mode = 'ready';
  let castNeedle = 0, castDir = 1, castGold = [0.6, 0.72], lastCastPerfect = false;
  let holeOpen = false, holeUses = 0, drillProg = 0, drillHeld = false;
  const MAX_HOLE_USES = 5;
  let bite = null;           // { phase, at, nibbles, takeStart, takeEnd, perfectCast }
  let fight = null, fightSize = null, fightOpts = null, reeling = false, fightStartTs = 0, hookPerfect = false;
  let reelClickT = 0, warnT = 0;

  function setMode(m) { mode = m; refreshControls(); }

  function enterReady() {
    reeling = false; drillHeld = false; fight = null; sc.fish.vis = false; sc.fish.jump = null;
    $('fightHud').classList.add('hidden'); $('danger').classList.remove('on');
    pitchMul = 1;
    if (vista().mechanic === 'drill') {
      sc.bob.vis = false;
      setMode('ready');
    } else if (S.usePrecisionCast) {
      sc.bob.vis = false;
      startCastMeter();
    } else {
      sc.bob.vis = false;
      setMode('ready');
    }
  }

  /* ---------- precision cast ---------- */
  function startCastMeter() {
    OL.game.gameplayStart();
    const w = REDUCED_MOTION ? 0.17 : 0.12;
    const c = rand(0.45 + w / 2, 0.95 - w / 2);
    castGold = [c - w / 2, c + w / 2];
    castNeedle = 0; castDir = 1;
    $('castGold').style.left = castGold[0] * 100 + '%'; $('castGold').style.width = (castGold[1] - castGold[0]) * 100 + '%';
    setMode('casting');
  }
  function resolveCast() {
    const perfect = castNeedle >= castGold[0] && castNeedle <= castGold[1];
    S.cast.total++; if (perfect) S.cast.perfect++;
    lastCastPerfect = perfect;
    updateHud(false); saveSoon();
    track('cast', { perfect, mode: 'precision', power: +castNeedle.toFixed(2) });
    if (perfect) { callout('PERFECT CAST', 'gold small', 800); sfx.perfect(); vibrate([40, 40, 40]); }
    else { sfx.thud(); vibrate([30]); }
    doCast(castNeedle, perfect);
  }
  function doCast(power, perfect) {
    const hz = horizon();
    const to = { x: lerp(W * 0.52, W * 0.3, power) + rand(-W * 0.06, W * 0.06), y: lerp(H * 0.8, hz + H * 0.08, power) };
    const tip = rodTip();
    sc.fly = { t0: sc.t, dur: 0.55, from: tip, to, done: () => {
      sc.bob = { x: to.x, y: to.y, vis: true, sub: 0, dip: 0 };
      splash(to.x, to.y, 8); ripple(to.x, to.y, true); sfx.splash(false);
      if (perfect) sparkle(to.x, to.y, 18);
      startWaiting(perfect);
    } };
    tone(300, 'sine', 0.25, 0.03); noise(0.3, 0.03, 2500);
    setMode('flying');
  }
  function classicCast() {
    S.cast.total++; lastCastPerfect = false;
    track('cast', { perfect: false, mode: 'classic' });
    doCast(rand(0.45, 0.85), false);
  }
  function dropLine() {
    const hp = holePos();
    sc.bob = { x: hp.x, y: hp.y, vis: true, sub: 0, dip: 0 };
    ripple(hp.x, hp.y, false); tone(400, 'sine', 0.1, 0.03);
    track('cast', { perfect: false, mode: 'drill' });
    startWaiting(false);
  }

  /* ---------- waiting / bites ---------- */
  function startWaiting(perfect) {
    const tut = !S.tutorialDone;
    const lure = gear().lure;
    let wait = rand(3.5, 7.0) * lure.biteMul;
    if (perfect) wait *= 0.5;
    if (tut) wait = 1.6;
    bite = { phase: 'wait', at: sc.t + wait, nibbles: tut ? 1 : Math.floor(rand(0, perfect ? 2 : 4)), perfectCast: perfect };
    setMode('waiting');
  }
  function rescheduleBite(min, max) {
    bite = { phase: 'wait', at: sc.t + rand(min, max), nibbles: Math.floor(rand(0, 3)), perfectCast: false };
  }
  function updateBite() {
    if (!bite || mode !== 'waiting') return;
    const b = sc.bob;
    b.dip = Math.max(0, b.dip - 0.08);
    if (bite.phase === 'wait' && sc.t >= bite.at) {
      if (bite.nibbles > 0) { bite.phase = 'nibble'; bite.at = sc.t; } else startTake();
    }
    if (bite.phase === 'nibble' && sc.t >= bite.at) {
      if (bite.nibbles <= 0) { startTake(); return; }
      bite.nibbles--; b.dip = 1; bite.nibbleEnd = sc.t + 0.3;
      ripple(b.x, b.y, false); sfx.nibble(); vibrate([12]);
      bite.at = sc.t + rand(0.55, 1.1);
    }
    if (bite.phase === 'take') {
      b.sub = Math.min(1, b.sub + 0.25);
      if (Math.random() < 0.3) ripple(b.x + rand(-5, 5), b.y, false);
      if (sc.t > bite.takeEnd) {
        b.sub = 0; S.stats.missedTakes++;
        callout('MISSED IT', 'red small', 700); sfx.thud(); vibrate([60]);
        track('hook', { result: 'missed' });
        rescheduleBite(2, 4);
        setHint('It’ll come back. Tap when the bobber goes <b>under</b>.');
      }
    }
  }
  function startTake() {
    const tut = !S.tutorialDone;
    bite.phase = 'take'; bite.takeStart = sc.t; bite.takeEnd = sc.t + (tut ? 3.0 : 1.0);
    splash(sc.bob.x, sc.bob.y, 10); ripple(sc.bob.x, sc.bob.y, true);
    sfx.take(); vibrate([45, 30, 45]);
    flashAction();
  }
  function tryHook() {
    if (!bite) return;
    if (bite.phase === 'take') {
      const dtk = sc.t - bite.takeStart;
      hookPerfect = dtk <= 0.35;
      track('hook', { result: 'hooked', ms: Math.round(dtk * 1000), perfect: hookPerfect });
      sfx.hook(); vibrate([30, 20, 60]);
      if (hookPerfect) callout('PERFECT HOOKSET', 'gold small', 800);
      startFight();
      return;
    }
    const nibbling = bite.phase === 'nibble' || (bite.nibbleEnd && sc.t < bite.nibbleEnd + 0.25);
    if (nibbling && Math.random() < 0.55) {
      S.stats.spooks++;
      callout('TOO EARLY!', 'red small', 700); sfx.thud(); vibrate([70]); shakeBobber();
      track('hook', { result: 'spooked' });
      rescheduleBite(2, 4);
      setHint('Nibbles are teasers. Wait for the bobber to go <b>under</b>.');
    } else {
      // twitch the lure: tiny feedback, no penalty
      sc.bob.dip = 0.4; ripple(sc.bob.x, sc.bob.y, false); tone(700, 'sine', 0.03, 0.02);
    }
  }
  function shakeBobber() { sc.bob.dip = 1; ripple(sc.bob.x, sc.bob.y, true); }

  /* ---------- fight ---------- */
  function startFight() {
    const v = vista(), g = gear(), tut = !S.tutorialDone;
    const rareMul = g.lure.rareMul * (bite && bite.perfectCast ? 1.25 : 1);
    const fish = tut ? FISH.find((f) => f.vista === v.id && f.rarity === 'Common') : RL.chooseFish(v.id, { rareMul });
    fightSize = RL.rollSize(fish);
    fightOpts = { tutorial: tut, bonusStart: hookPerfect ? 10 : 0 };
    fight = RL.newFight(fish, fightSize, { reelSpeed: g.reel.speed, tensionMul: g.rod.tensionMul }, fightOpts);
    bite = null; reeling = false; fightStartTs = performance.now();
    if (v.mechanic === 'drill') { holeUses++; if (holeUses >= MAX_HOLE_USES) { /* hole freezes after this fight */ } }
    pitchMul = fish.rarity === 'Legendary' ? 0.85 : 1;
    sc.bob.vis = false;
    const startX = sc.bob.x || W * 0.45;
    sc.fish = { x: startX, y: sc.bob.y + 20, dir: Math.random() < 0.5 ? -1 : 1, vis: true, jump: null, baseX: startX, vx: 0 };
    S.stats.fights++;
    // HUD
    const rc = RARITY[fish.rarity].color;
    const known = S.dex[fish.id] && S.dex[fish.id].n > 0;
    $('fName').textContent = known ? fish.name : '???';
    $('fRarity').textContent = fish.rarity; $('fRarity').style.color = rc;
    $('zone').style.left = ZONE[0] + '%'; $('zone').style.width = (ZONE[1] - ZONE[0]) + '%';
    $('fightHud').classList.remove('hidden');
    if (fish.rarity === 'Legendary') { callout('LEGENDARY!', 'gold', 1200); sc.shake = 6; vibrate([120, 60, 120]); }
    else if (fish.rarity === 'Rare') callout('BIG ONE!', 'blue small', 800);
    track('fight_start', { fish: fish.id, rarity: fish.rarity, tutorial: tut });
    setMode('fight');
  }

  function updateFight(dt) {
    if (mode !== 'fight' || !fight) return;
    RL.fightStep(fight, reeling, dt);
    const f = sc.fish, hz = horizon(), v = vista().id;
    // fish movement
    const sway = Math.sin(sc.t * (fight.surging ? 2.6 : 1.2)) * W * (fight.surging ? 0.22 : 0.14);
    const tx = clamp(W * 0.42 + sway, W * 0.08, W * 0.9);
    const prevX = f.x;
    f.x = lerp(f.x, tx, Math.min(1, dt * (fight.surging ? 4 : 2)));
    if (Math.abs(f.x - prevX) > 0.05) f.dir = f.x > prevX ? 1 : -1;
    const near = fight.progress / 100;
    f.y = v === 'frozen_tundra' ? lerp(holePos().y + 60, holePos().y + 10, near) : lerp(hz + H * 0.12, H * 0.82, near);
    if (v === 'frozen_tundra') f.x = lerp(f.x, holePos().x, 0.85);

    // events
    for (const e of fight.events) {
      if (e.type === 'surge') {
        sfx.surge(); vibrate([60]); sc.shake = Math.max(sc.shake, 3);
        if (v !== 'frozen_tundra') { splash(f.x, f.y - 12, 8); maybeJump(); }
        if (!S.tutorialDone) setHint('Surge! <b>Let go</b> until the tension drops.');
      } else if (e.type === 'phase') { callout('PHASE ' + (e.phase + 1), 'red', 1000); sc.shake = 8; vibrate([200, 100, 200]); sfx.lose(); }
      else if (e.type === 'snapwarn') { callout('SNAP! LET GO', 'red', 900); danger(true, 900); sfx.warn(); vibrate([40, 30, 40, 30, 40]); }
      else if (e.type === 'snapok') { callout('NICE!', 'green small', 600); }
      else if (e.type === 'slack') { callout('SLACK…', 'blue small', 700); tone(300, 'sine', 0.2, 0.04); }
      else if (e.type === 'spike') { callout('SPIKE!', 'red', 700); danger(true, 600); vibrate([150, 50, 150]); sc.shake = 6; }
      else if (e.type === 'jerk') { sc.shake = Math.max(sc.shake, 2); tone(260, 'square', 0.04, 0.03); vibrate([20]); }
      else if (e.type === 'lastrun') { callout('LAST RUN!', 'red', 900); sfx.surge(); vibrate([100, 50, 100]); }
    }
    fight.events.length = 0;

    // reel click + tension warning
    if (reeling) { reelClickT -= dt; if (reelClickT <= 0) { sfx.click(); reelClickT = 0.09; } }
    if (fight.tension > 88) { warnT -= dt; if (warnT <= 0) { sfx.warn(); vibrate([15]); warnT = 0.22; } $('danger').classList.add('on'); }
    else if (!dangerHold) $('danger').classList.remove('on');

    // HUD bars
    $('distFill').style.width = clamp(fight.progress, 0, 100) + '%';
    $('tenFill').style.width = fight.tension + '%';
    const tt = $('tenTrack');
    tt.classList.toggle('hot', fight.tension > 85);
    tt.classList.toggle('inzone', fight.tension >= ZONE[0] && fight.tension <= ZONE[1]);
    $('fSta').textContent = fight.surging ? 'SURGING' : fight.stamina < 0.3 ? 'TIRED' : '';

    if (fight.result) finishFight();
  }
  function maybeJump() {
    const fish = fight.fish;
    if (fish.art.shape === 'turtle' || sc.fish.jump || Math.random() > 0.35 || fish.rarity === 'Common') return;
    const f = sc.fish, y0 = clamp(f.y - 10, horizon() + 10, H * 0.9);
    f.jump = { t0: sc.t, dur: 0.75, x0: f.x, x1: f.x + f.dir * W * 0.12, y0, h: H * 0.16, x: f.x, y: y0, dir: f.dir, art: fish.art };
    splash(f.x, y0, 16); sfx.splash(true);
  }

  let dangerHold = false;
  function danger(on, ms) { $('danger').classList.toggle('on', on); dangerHold = on; if (on) setTimeout(() => { dangerHold = false; $('danger').classList.remove('on'); }, ms || 500); }

  function finishFight() {
    const fr = fight, fish = fr.fish, win = fr.result === 'win', durMs = Math.round(performance.now() - fightStartTs);
    reeling = false; $('fightHud').classList.add('hidden'); $('danger').classList.remove('on');
    if (vista().mechanic === 'drill' && holeUses >= MAX_HOLE_USES) { holeOpen = false; holeUses = 0; drillProg = 0; }
    const nearMiss = !win && fr.peakProgress >= 80;
    track('fight_end', { fish: fish.id, rarity: fish.rarity, result: fr.result, ms: durMs, peak: Math.round(fr.peakProgress), zonePct: Math.round(fr.zoneTime / Math.max(0.01, fr.t) * 100), nearMiss });
    if (win) {
      S.stats.wins++;
      const prevLvl = levelInfo().level;
      S.jackpotIn = (S.jackpotIn | 0) - 1;
      const jackpot = S.jackpotIn <= 0;
      if (jackpot) S.jackpotIn = 5 + Math.floor(Math.random() * 4);
      const rw = RL.rewardFor(fish, fightSize, jackpot);
      const d = S.dex[fish.id] || { n: 0, best: 0, trophy: false };
      const firstEver = d.n === 0, pb = !firstEver && fightSize.lb > d.best;
      d.n++; d.best = Math.max(d.best, fightSize.lb); d.trophy = d.trophy || fightSize.trophy;
      S.dex[fish.id] = d;
      S.coins += rw.coins; S.xp += rw.xp; S.catches++;
      const tutorialWin = !S.tutorialDone; S.tutorialDone = true;
      // vista completion bonus
      let setBonus = 0;
      const vId = fish.vista;
      if (!S.vistaBonus[vId] && FISH.filter((x) => x.vista === vId).every((x) => S.dex[x.id] && S.dex[x.id].n > 0)) {
        setBonus = 250 * (VISTAS.findIndex((x) => x.id === vId) + 1);
        S.vistaBonus[vId] = true; S.coins += setBonus;
        track('vista_complete', { vista: vId, bonus: setBonus });
      }
      save();
      // juice
      const sp = jackpot ? 2 : 1;
      sparkle(sc.fish.x, Math.min(sc.fish.y, H * 0.8), 24 * sp, jackpot ? '#fde68a' : '#bae6fd');
      splash(sc.fish.x, Math.min(sc.fish.y, H * 0.8), 18);
      if (jackpot) pitchMul = 1.1;
      sfx.win(); vibrate([40, 60, 40]);
      setTimeout(() => { pitchMul = 1; }, 600);
      const newLvl = levelInfo().level;
      showCatchCard({ fish, size: fightSize, rw, jackpot, firstEver, pb, setBonus, tutorialWin });
      updateHud(true);
      if (newLvl > prevLvl) setTimeout(() => onLevelUp(prevLvl, newLvl), 650);
    } else {
      if (fr.result === 'snap') S.stats.snaps++; else S.stats.escapes++;
      if (nearMiss) S.stats.nearMiss++;
      save();
      sfx.lose(); vibrate([90]); sc.shake = 5;
      showLossCard(fish, fr, nearMiss);
    }
    sc.fish.vis = false;
    setMode('result');
  }

  function onLevelUp(from, to) {
    sfx.levelUp(); vibrate([30, 40, 30, 40, 80]);
    callout('LEVEL ' + to + '!', 'gold', 1400);
    const unlocks = [];
    VISTAS.forEach((v) => { if (!S.unlocked[v.id] && to >= v.unlockLevel && from < v.unlockLevel) unlocks.push(v.emoji + ' ' + v.name); });
    [RODS, REELS, LURES].forEach((arr) => arr.forEach((g) => { if (g.level > from && g.level <= to && g.cost > 0) unlocks.push(g.emoji + ' ' + g.name); }));
    BOBBERS.forEach((b) => { if (b.level > from && b.level <= to) unlocks.push('Bobber: ' + b.name); });
    if (unlocks.length) setTimeout(() => toast('Unlocked: ' + unlocks.join(', '), 2600), 900);
    track('level_up', { level: to });
    refreshShopDot();
  }

  /* ============ CARDS ============ */
  function drawCardFish(fish, silhouette) {
    const c = $('cardFish'), r = { width: c.offsetWidth || 300, height: c.offsetHeight || 120 }, d = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.max(10, r.width * d); c.height = Math.max(10, r.height * d);
    const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, r.width, r.height);
    const L = Math.min(r.width * (fish.art.shape === 'turtle' ? 0.62 : 0.86), r.height * (fish.art.shape === 'fish' ? 1 / (fish.art.h || 0.3) * 0.8 : 2.4));
    if (silhouette) drawSilhouette(x, fish.art, r.width / 2, r.height / 2, L, 1, 0.5, 0.3, { wiggle: 0, color: '#96aac3' }); else drawFish(x, fish.art, r.width / 2, r.height / 2, L, 1, 0.5, { wiggle: 0 });
  }
  let cardAction = null;
  function openCard(cls) { const card = $('card'); card.className = 'card ' + (cls || ''); $('cardWrap').classList.add('open'); }
  function closeCard() { $('cardWrap').classList.remove('open'); }
  function showCatchCard(o) {
    OL.game.gameplayStop();
    const { fish, size, rw, jackpot, firstEver, pb, setBonus, tutorialWin } = o;
    $('cardTitle').textContent = jackpot ? 'JACKPOT CATCH!' : fish.rarity === 'Legendary' ? 'LEGENDARY!' : 'Caught!';
    $('cardTitle').style.color = jackpot || fish.rarity === 'Legendary' ? 'var(--gold)' : '#a7f3d0';
    $('cardSub').innerHTML = `<span style="color:${RARITY[fish.rarity].color}">${fish.rarity}</span> · ${fish.name}`;
    $('cardWeight').textContent = fmtLb(size.lb);
    const badges = [];
    if (firstEver) badges.push('<span class="badge green">NEW SPECIES</span>');
    if (pb) badges.push('<span class="badge blue">NEW PERSONAL BEST</span>');
    if (size.trophy) badges.push('<span class="badge gold">🏆 TROPHY SIZE</span>');
    if (jackpot) badges.push('<span class="badge gold">2× COINS</span>');
    if (setBonus) badges.push(`<span class="badge gold">VISTA COMPLETE +${fmt(setBonus)}🪙</span>`);
    $('cardBadges').innerHTML = badges.join('');
    $('cardRewards').innerHTML = `<span>+${fmt(rw.coins)} 🪙</span><span style="color:#7dd3fc">+${fmt(rw.xp)} XP</span>`;
    $('cardBtn').textContent = tutorialWin ? 'NICE! CAST AGAIN' : 'CONTINUE';
    $('cardBtn').className = 'bigBtn' + (jackpot || fish.rarity === 'Legendary' ? ' gold' : '');
    openCard(fish.rarity === 'Legendary' || jackpot ? 'legend' : '');
    requestAnimationFrame(() => drawCardFish(fish, false));
    if (jackpot) setTimeout(() => { sfx.coin(); }, 300);
    cardAction = () => { closeCard(); afterResult(); };
  }
  function showLossCard(fish, fr, nearMiss) {
    OL.game.gameplayStop();
    $('cardTitle').textContent = nearMiss ? 'SO CLOSE!' : fr.result === 'snap' ? 'Line snapped' : 'It got away';
    $('cardTitle').style.color = 'var(--danger)';
    const known = S.dex[fish.id] && S.dex[fish.id].n > 0;
    $('cardSub').innerHTML = `<span style="color:${RARITY[fish.rarity].color}">${fish.rarity}</span> · ${known || fish.rarity !== 'Common' ? fish.name : 'Unknown fish'}`;
    $('cardWeight').textContent = nearMiss ? Math.round(fr.peakProgress) + '% landed' : '';
    const tip = fr.reason && fr.result === 'snap' && fr.fish.mechanic === 'snap_tension' ? fr.reason
      : fr.result === 'snap' ? 'Tip: let go when the fish surges — keep tension in the gold zone.'
      : 'Tip: reel more steadily — releasing too long lets the fish take line.';
    $('cardBadges').innerHTML = `<span class="badge">${tip}</span>`;
    $('cardRewards').innerHTML = '';
    $('cardBtn').textContent = 'CAST AGAIN';
    $('cardBtn').className = 'bigBtn';
    openCard(nearMiss ? 'wobble' : '');
    requestAnimationFrame(() => drawCardFish(fish, true));
    cardAction = () => { closeCard(); afterResult(); };
  }
  function afterResult() {
    sfx.ui(); enterReady();
    // Natural break after the catch/loss card is dismissed
    OL.ads.break("cast_result");
  }

  /* ============ HUD / CONTROLS ============ */
  let shownCoins = S.coins, coinAnim = null;
  function updateHud(animateCoins) {
    const li = levelInfo();
    $('lvl').textContent = li.level;
    $('xpFill').style.width = Math.round(li.into / li.need * 100) + '%';
    $('xpLabel').textContent = `${fmt(li.into)} / ${fmt(li.need)} XP`;
    const v = vista();
    $('vistaPillText').textContent = `${v.emoji} ${v.name}`;
    $('castStat').textContent = `PERFECT ${S.cast.perfect}/${S.cast.total}`;
    if (animateCoins && S.coins !== shownCoins) {
      const from = shownCoins, to = S.coins, t0 = performance.now();
      cancelAnimationFrame(coinAnim);
      const step = (now) => { const k = Math.min(1, (now - t0) / 700); shownCoins = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); $('coins').textContent = fmt(shownCoins); if (k < 1) coinAnim = requestAnimationFrame(step); };
      coinAnim = requestAnimationFrame(step);
      $('coinPill').classList.remove('bump'); void $('coinPill').offsetWidth; $('coinPill').classList.add('bump');
      sfx.coin();
    } else { shownCoins = S.coins; $('coins').textContent = fmt(S.coins); }
    refreshShopDot();
  }
  function refreshShopDot() {
    const L = levelInfo().level;
    const affordable = [['rods', RODS], ['reels', REELS], ['lures', LURES]].some(([k, arr]) => arr.some((g) => !S.owned[k].includes(g.id) && L >= g.level && S.coins >= g.cost))
      || VISTAS.some((v) => !S.unlocked[v.id] && (L >= v.unlockLevel || S.coins >= v.unlockCost));
    $('shopDot').classList.toggle('hidden', !affordable);
  }
  function setHint(html) { $('hint').innerHTML = html; }
  function refreshControls() {
    const a = $('actionBtn'), s2 = $('secondaryBtn'), v = vista(), tut = !S.tutorialDone;
    a.className = 'bigBtn'; a.disabled = false; s2.classList.add('hidden');
    $('castMeter').classList.toggle('hidden', mode !== 'casting');
    $('drillMeter').classList.toggle('hidden', !(v.mechanic === 'drill' && mode === 'ready' && !holeOpen));
    $('holeMeta').textContent = `HOLE USES ${holeUses}/${MAX_HOLE_USES}`;
    switch (mode) {
      case 'casting':
        a.textContent = 'CAST!'; a.classList.add('gold');
        setHint(tut ? 'Tap <b>CAST!</b> when the needle is in the <b>gold zone</b>.' : 'Perfect casts bite faster and attract rarer fish.');
        break;
      case 'ready':
        if (v.mechanic === 'drill') {
          if (!holeOpen) { a.textContent = 'HOLD TO DRILL'; a.classList.add('ice'); setHint('Hold to drill through the ice. Holes last 5 fish.'); }
          else { a.textContent = 'DROP LINE'; a.classList.add('ice'); setHint(`Hole ready · ${MAX_HOLE_USES - holeUses} fish left before it freezes.`); }
        } else { a.textContent = 'CAST'; setHint('Classic mode: tap to cast.'); }
        break;
      case 'flying': a.textContent = '…'; a.disabled = true; setHint('&nbsp;'); break;
      case 'waiting':
        a.textContent = 'HOOK!'; s2.classList.remove('hidden');
        setHint(tut ? 'Wait for the bobber to go <b>under</b>, then tap <b>HOOK!</b>' : 'Ignore the nibbles. Hook when it goes <b>under</b>.');
        break;
      case 'fight':
        a.textContent = 'HOLD TO REEL'; a.classList.add('gold');
        setHint(tut ? 'Hold to reel. Keep <b>TENSION</b> in the gold zone — let go if it turns red.' : 'Hold to reel · let go on surges.');
        break;
      case 'result': a.textContent = '…'; a.disabled = true; setHint('&nbsp;'); break;
    }
  }
  function flashAction() { const a = $('actionBtn'); a.classList.add('red'); setTimeout(() => a.classList.remove('red'), 900); }

  let calloutTimer = null;
  function callout(text, cls, ms) {
    const el = $('callout'); el.className = 'callout'; void el.offsetWidth;
    el.textContent = text; el.style.setProperty('--ms', (ms || 900) + 'ms'); el.className = 'callout on ' + (cls || '');
    clearTimeout(calloutTimer); calloutTimer = setTimeout(() => { el.className = 'callout'; }, ms || 900);
  }
  let toastTimer = null;
  function toast(msg, ms) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), ms || 1200); }

  /* ============ INPUT ============ */
  function press() {
    ensureAudio();
    if (sheetOpen() || $('cardWrap').classList.contains('open')) return;
    const v = vista();
    switch (mode) {
      case 'casting': resolveCast(); break;
      case 'ready':
        if (v.mechanic === 'drill') { if (holeOpen) dropLine(); else { drillHeld = true; $('actionBtn').classList.add('pressed'); } }
        else classicCast();
        break;
      case 'waiting': tryHook(); break;
      case 'fight': reeling = true; $('actionBtn').classList.add('pressed'); break;
    }
  }
  function release() { reeling = false; drillHeld = false; $('actionBtn').classList.remove('pressed'); }

  function attachInput() {
    // iOS: stop callouts, double-tap zoom, pinch
    document.addEventListener('contextmenu', (e) => e.preventDefault(), { capture: true });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('touchstart', (e) => {
      const t = e.target;
      if (t.closest('button, a, input, .sheetBody, .sw, .tab')) return;
      e.preventDefault();
    }, { passive: false, capture: true });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => { const n = Date.now(); if (n - lastTouchEnd <= 300 && !e.target.closest('.sheetBody')) e.preventDefault(); lastTouchEnd = n; }, false);

    const a = $('actionBtn');
    a.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); try { a.setPointerCapture(e.pointerId); } catch (err) {} press(); });
    a.addEventListener('pointerup', release); a.addEventListener('pointercancel', release); a.addEventListener('lostpointercapture', release);
    $('stage').addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; e.preventDefault(); press(); });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('blur', release);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') { closeSheet(); return; }
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        e.preventDefault();
        if ($('cardWrap').classList.contains('open')) { cardAction && cardAction(); return; }
        press();
      }
    });
    window.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.code === 'Enter') release(); });

    $('secondaryBtn').addEventListener('click', () => { sfx.ui(); bite = null; sc.bob.vis = false; track('reel_in'); enterReady(); });
    $('cardBtn').addEventListener('click', () => cardAction && cardAction());
    $('shopBtn').addEventListener('click', () => openShop());
    $('coinPill').addEventListener('click', () => openShop());
    $('dexBtn').addEventListener('click', () => openDex());
    $('setBtn').addEventListener('click', () => openSettings());
    $('lvlBox').addEventListener('click', () => openSettings('stats'));
    $('vistaPill').addEventListener('click', (e) => { e.stopPropagation(); openVistas(); });
    $('sheetClose').addEventListener('click', closeSheet);
    $('sheetWrap').addEventListener('pointerdown', (e) => { if (e.target.id === 'sheetWrap') closeSheet(); });
    $('iosNudgeDismiss').addEventListener('click', () => { $('iosNudge').classList.remove('show'); OL.store.set('reelloop_ios_nudge_dismissed', '1'); });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { release(); save(); } else { setViewportUnits(); lastNow = 0; }
    });
    window.addEventListener('pagehide', save);
  }

  /* ============ SHEETS ============ */
  let sheetRender = null, sheetTab = null;
  const sheetOpen = () => $('sheetWrap').classList.contains('open');
  function openSheet(title, tabs, tab, renderFn) {
    if (mode === 'fight') { toast('Land the fish first!'); return; }
    sheetRender = renderFn; sheetTab = tab;
    $('sheetTitle').textContent = title;
    const tb = $('sheetTabs'); tb.innerHTML = '';
    tb.classList.toggle('hidden', !tabs || !tabs.length);
    (tabs || []).forEach(([id, label]) => {
      const b = document.createElement('button'); b.className = 'tab' + (id === tab ? ' on' : ''); b.textContent = label;
      b.addEventListener('click', () => { sheetTab = id; [...tb.children].forEach((c) => c.classList.toggle('on', c === b)); sfx.ui(); renderSheet(); });
      tb.appendChild(b);
    });
    renderSheet();
    $('sheetWrap').classList.add('open'); sfx.ui();
    release();
  }
  function renderSheet() { const body = $('sheetBody'); const st = body.scrollTop; body.innerHTML = ''; sheetRender && sheetRender(body, sheetTab); body.scrollTop = st; }
  function closeSheet() { if (!sheetOpen()) return; $('sheetWrap').classList.remove('open'); tone(320, 'sine', 0.05, 0.03); }

  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function openShop(tab) {
    openSheet('🛒 Tackle Shop', [['rods', 'Rods'], ['reels', 'Reels'], ['lures', 'Lures'], ['bobbers', 'Bobbers']], tab || 'rods', (body, t) => {
      const L = levelInfo().level;
      const list = el('<div class="list"></div>');
      if (t === 'bobbers') {
        BOBBERS.forEach((b) => {
          const unlocked = L >= b.level, sel = S.gear.bobber === b.id;
          const row = el(`<div class="row ${sel ? 'sel' : ''} ${unlocked ? '' : 'locked'}"><div class="em"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,${b.color})"></span></div><div class="tx"><div class="nm">${b.name}</div><div class="ds">${unlocked ? 'Cosmetic' : 'Reach level ' + b.level}</div></div></div>`);
          const chip = el(`<button class="chip ${sel ? 'on' : unlocked ? 'eq' : 'off'}">${sel ? 'Equipped' : unlocked ? 'Equip' : '🔒 Lv ' + b.level}</button>`);
          if (unlocked && !sel) chip.addEventListener('click', () => { S.gear.bobber = b.id; save(); sfx.ui(); track('equip', { slot: 'bobber', id: b.id }); renderSheet(); });
          row.appendChild(chip); list.appendChild(row);
        });
      } else {
        const arr = t === 'rods' ? RODS : t === 'reels' ? REELS : LURES;
        const slot = t === 'rods' ? 'rod' : t === 'reels' ? 'reel' : 'lure';
        arr.forEach((g) => {
          const owned = S.owned[t].includes(g.id), sel = S.gear[slot] === g.id, lvOk = L >= g.level, canBuy = lvOk && S.coins >= g.cost;
          const row = el(`<div class="row ${sel ? 'sel' : ''} ${!owned && !lvOk ? 'locked' : ''}"><div class="em">${g.emoji}</div><div class="tx"><div class="nm">${g.name}</div><div class="ds">${g.desc}</div></div></div>`);
          let chip;
          if (sel) chip = el('<button class="chip on">Equipped</button>');
          else if (owned) { chip = el('<button class="chip eq">Equip</button>'); chip.addEventListener('click', () => { S.gear[slot] = g.id; save(); sfx.ui(); track('equip', { slot, id: g.id }); renderSheet(); }); }
          else if (!lvOk) chip = el(`<button class="chip off">🔒 Lv ${g.level}</button>`);
          else {
            chip = el(`<button class="chip buy ${canBuy ? '' : 'off'}">${fmt(g.cost)} 🪙</button>`);
            chip.addEventListener('click', () => {
              if (S.coins < g.cost) { toast(`Need ${fmt(g.cost - S.coins)} more coins`); sfx.thud(); return; }
              S.coins -= g.cost; S.owned[t].push(g.id); S.gear[slot] = g.id; save();
              sfx.buy(); vibrate([20, 30, 20]); track('purchase', { slot, id: g.id, cost: g.cost });
              updateHud(false); renderSheet(); toast(`${g.name} equipped`);
            });
          }
          row.appendChild(chip); list.appendChild(row);
        });
      }
      body.appendChild(list);
      body.appendChild(el(`<div class="note">You have ${fmt(S.coins)} 🪙 · Better rods = less tension, better reels = faster landing.</div>`));
    });
  }

  function openDex() {
    openSheet('🏆 Fishdex', null, null, (body) => {
      const total = FISH.length, caught = FISH.filter((f) => S.dex[f.id] && S.dex[f.id].n > 0).length;
      body.appendChild(el(`<div class="dexHead">Collection<span>${caught}/${total} species · ${S.catches} catches</span></div>`));
      VISTAS.forEach((v) => {
        const pool = FISH.filter((f) => f.vista === v.id);
        const got = pool.filter((f) => S.dex[f.id] && S.dex[f.id].n > 0).length;
        const bonus = 250 * (VISTAS.indexOf(v) + 1);
        body.appendChild(el(`<div class="dexHead">${v.emoji} ${v.name}<span>${got}/${pool.length}${S.vistaBonus[v.id] ? ' · ✓ bonus claimed' : ' · complete for +' + fmt(bonus) + '🪙'}</span></div>`));
        const grid = el('<div class="dexGrid"></div>');
        pool.forEach((f) => {
          const d = S.dex[f.id], has = d && d.n > 0;
          grid.appendChild(el(`<div class="dexCard ${has ? '' : 'unk'}">${has && d.trophy ? '<span class="tro">🏆</span>' : ''}<img alt="" src="${fishIcon(f, !has)}"><div class="nm" style="${has ? 'color:' + RARITY[f.rarity].color : ''}">${has ? f.name : '???'}</div><div class="ds">${has ? `×${d.n}${d.best ? ' · ' + fmtLb(d.best) : ''}` : f.rarity}</div></div>`));
        });
        body.appendChild(grid);
      });
    });
    track('open', { panel: 'dex' });
  }

  function openVistas() {
    openSheet('🗺️ Vistas', null, null, (body) => {
      const L = levelInfo().level, list = el('<div class="list"></div>');
      VISTAS.forEach((v) => {
        const un = !!S.unlocked[v.id], cur = S.currentVista === v.id;
        const byLevel = L >= v.unlockLevel, byCoins = S.coins >= v.unlockCost;
        const sub = un ? (v.mechanic === 'drill' ? 'Ice drilling · 5 species' : 'Precision casting · 5 species') : `Reach level ${v.unlockLevel} or pay ${fmt(v.unlockCost)} 🪙`;
        const row = el(`<div class="row ${cur ? 'sel' : ''}"><div class="em">${v.emoji}</div><div class="tx"><div class="nm">${v.name}</div><div class="ds">${sub}</div></div></div>`);
        let chip;
        if (cur) chip = el('<button class="chip on">Fishing</button>');
        else if (un) { chip = el('<button class="chip eq">Go</button>'); chip.addEventListener('click', () => { switchVista(v.id); closeSheet(); }); }
        else if (byLevel) { chip = el('<button class="chip buy">Unlock free</button>'); chip.addEventListener('click', () => unlockVista(v, 'level')); }
        else { chip = el(`<button class="chip buy ${byCoins ? '' : 'off'}">${fmt(v.unlockCost)} 🪙</button>`); chip.addEventListener('click', () => byCoins ? unlockVista(v, 'coins') : (toast(`Need level ${v.unlockLevel} or ${fmt(v.unlockCost)} coins`), sfx.thud())); }
        row.appendChild(chip); list.appendChild(row);
      });
      body.appendChild(list);
    });
  }
  function unlockVista(v, how) {
    if (how === 'coins') S.coins -= v.unlockCost;
    S.unlocked[v.id] = true; save(); sfx.buy(); vibrate([30, 40, 30]);
    track('vista_unlock', { vista: v.id, how });
    updateHud(false); switchVista(v.id); closeSheet();
    callout(v.name.toUpperCase(), 'blue', 1200);
  }
  function switchVista(id) {
    if (mode === 'fight') return;
    S.currentVista = id; save();
    document.body.className = byId(VISTAS, id).bodyClass + (document.body.classList.contains('pseudo-fs') ? ' pseudo-fs' : '');
    holeOpen = false; holeUses = 0; drillProg = 0; bite = null; sc.bob.vis = false; sc.fly = null; sc.snow = []; sc.flies = [];
    bakeBackground(); updateHud(false); enterReady();
    track('vista_switch', { vista: id });
  }

  function openSettings(tab) {
    openSheet('⚙️ Settings', [['settings', 'Settings'], ['stats', 'Stats']], tab || 'settings', (body, t) => {
      if (t === 'stats') {
        const st = S.stats, rate = S.cast.total ? Math.round(S.cast.perfect / S.cast.total * 100) : 0, wr = st.fights ? Math.round(st.wins / st.fights * 100) : 0;
        const g = el('<div class="statGrid"></div>');
        [['LEVEL', levelInfo().level], ['TOTAL XP', fmt(S.xp)], ['CATCHES', fmt(S.catches)], ['LANDING RATE', wr + '%'], ['PERFECT CASTS', `${S.cast.perfect}/${S.cast.total} (${rate}%)`], ['LINES SNAPPED', st.snaps], ['GOT AWAY', st.escapes], ['SO-CLOSE LOSSES', st.nearMiss], ['TOO-EARLY HOOKS', st.spooks], ['MISSED BITES', st.missedTakes], ['PLAY TIME', Math.round(st.playMs / 60000) + ' min'], ['SESSIONS', st.sessions]]
          .forEach(([k, v]) => g.appendChild(el(`<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`)));
        body.appendChild(g); return;
      }
      const list = el('<div class="list"></div>');
      const sw = (label, desc, on, fn) => { const r = el(`<div class="row toggleRow"><div class="tx"><div class="nm">${label}</div><div class="ds">${desc}</div></div><div class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${on}"></div></div>`); r.querySelector('.sw').addEventListener('click', () => { fn(); save(); sfx.ui(); renderSheet(); }); return r; };
      list.appendChild(sw('Sound', 'Effects and cues', S.soundOn, () => { S.soundOn = !S.soundOn; }));
      list.appendChild(sw('Haptics', 'Vibration on supported devices', S.hapticsOn, () => { S.hapticsOn = !S.hapticsOn; vibrate([30]); }));
      list.appendChild(sw('Precision casting', 'Timing meter for open-water vistas (off = classic tap cast)', S.usePrecisionCast, () => {
        S.usePrecisionCast = !S.usePrecisionCast; track('cast_mode', { precision: S.usePrecisionCast });
        if (mode === 'casting' || mode === 'ready') enterReady();
      }));
      const fs = el('<div class="row"><div class="em">⛶</div><div class="tx"><div class="nm">Fullscreen</div><div class="ds">Best on phones · iOS: Add to Home Screen</div></div><button class="chip eq">Toggle</button></div>');
      fs.querySelector('button').addEventListener('click', () => { closeSheet(); toggleFullscreen(); });
      list.appendChild(fs);
      body.appendChild(list);
      body.appendChild(el(`<div class="note">ReelLoop v${VERSION} · Open Loop Apps</div>`));
    });
  }

  /* ============ MAIN LOOP ============ */
  let lastNow = 0, playAcc = 0;
  function loop(now) {
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    // cast needle (ping-pong, ease at ends)
    if (mode === 'casting') {
      const sp = REDUCED_MOTION ? 0.55 : 0.95;
      castNeedle += castDir * sp * dt;
      if (castNeedle >= 1) { castNeedle = 1; castDir = -1; } else if (castNeedle <= 0) { castNeedle = 0; castDir = 1; }
      $('castNeedle').style.left = castNeedle * 100 + '%';
    }
    // drilling
    if (mode === 'ready' && vista().mechanic === 'drill' && !holeOpen && drillHeld) {
      drillProg = Math.min(1, drillProg + dt / (2.6 / gear().reel.speed));
      $('drillFill').style.width = drillProg * 100 + '%';
      reelClickT -= dt; if (reelClickT <= 0) { tone(110 + drillProg * 80, 'sawtooth', 0.05, 0.025); vibrate([18]); reelClickT = 0.12; }
      if (Math.random() < 0.5) { const hp = holePos(); sc.parts.push({ x: hp.x + rand(-20, 20), y: hp.y, vx: rand(-60, 60), vy: rand(-120, -40), g: 300, life: 0.5, age: 0, r: rand(1, 2.2), col: 'rgba(255,255,255,.95)' }); }
      if (drillProg >= 1) {
        holeOpen = true; holeUses = 0; drillHeld = false; release();
        splash(holePos().x, holePos().y, 16); sfx.splash(true); vibrate([30, 60, 30]);
        callout('HOLE READY', 'blue small', 800); track('drill_done');
        refreshControls();
      }
    }
    updateBite();
    updateFight(dt);
    render(dt);
    playAcc += dt;
    if (playAcc >= 10) { S.stats.playMs += Math.round(playAcc * 1000); playAcc = 0; saveSoon(); }
    requestAnimationFrame(loop);
  }

  /* ============ INIT ============ */
  function init() {
    S.stats.sessions++;
    if (!S.unlocked[S.currentVista]) S.currentVista = 'sunny_lake';
    document.body.className = vista().bodyClass;
    attachInput();
    resizeCanvas();
    updateHud(false);
    OL.game.loadingDone();
    enterReady();
    save();
    track('session_start', { migrated: !!S.migratedFrom, standalone: !!IS_STANDALONE, ios: IS_IOS, embedded: window.parent !== window });
    if (S.migratedFrom) { delete S.migratedFrom; save(); setTimeout(() => toast('ReelLoop 5.0 · your progress carried over'), 800); }
    if (!S.tutorialDone) setTimeout(() => callout('LET’S FISH!', 'blue', 1200), 300);
    if (IS_IOS && !IS_STANDALONE && window.parent === window) {
      const dismissed = !!OL.store.get('reelloop_ios_nudge_dismissed');
      if (!dismissed) setTimeout(() => $('iosNudge').classList.add('show'), 4000);
    }
    requestAnimationFrame(loop);
  }

  // Test hook (read-only usage by QA scripts)
  window.__reelloop = { get S() { return S; }, get mode() { return mode; }, get fight() { return fight; }, get bite() { return bite; }, press, release, VERSION };

  init();
})();
