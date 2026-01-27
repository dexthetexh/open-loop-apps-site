(() => {
  "use strict";

  // ====== DOM ======
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const statusEl = document.getElementById("status");
  const btnStart = document.getElementById("btnStart");
  const btnRestart = document.getElementById("btnRestart");
  const yearEl = document.getElementById("year");
  yearEl.textContent = String(new Date().getFullYear());

  // ====== Persistence ======
  const BEST_KEY = "ola_flappy_best_v1";
  const getBest = () => {
    try {
      const v = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
      return Number.isFinite(v) ? v : 0;
    } catch {
      return 0;
    }
  };
  const setBest = (v) => {
    try {
      localStorage.setItem(BEST_KEY, String(v));
    } catch {
      // ignore (private mode, storage disabled)
    }
  };

  let best = getBest();
  bestEl.textContent = String(best);

  // ====== Game constants (deterministic) ======
  const W = canvas.width;
  const H = canvas.height;

  // Bird
  const BIRD_X = Math.floor(W * 0.28);
  const BIRD_R = 14;

  // World tuning
  const GRAVITY = 1800;          // px/s^2
  const FLAP_VELOCITY = -520;    // px/s
  const PIPE_SPEED = 210;        // px/s
  const PIPE_WIDTH = 64;         // px
  const GAP_SIZE = 170;          // px
  const PIPE_SPAWN_EVERY = 1.35; // seconds
  const FLOOR_H = 90;            // px

  // Difficulty ramps (survivable + predictable)
  const GAP_MIN = 135;           // px
  const GAP_RAMP_PER_10 = 6;     // shrink gap by N every 10 points
  const SPEED_RAMP_PER_10 = 10;  // speed increase per 10 points

  // Randomness control
  const RNG_SEED_KEY = "ola_flappy_rngseed_v1";
  // fixed seed per session: stable within run, new each reload
  const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  try { sessionStorage.setItem(RNG_SEED_KEY, String(seed)); } catch {}
  let rngState = seed;

  function rng() {
    // xorshift32
    rngState ^= (rngState << 13) >>> 0;
    rngState ^= (rngState >>> 17) >>> 0;
    rngState ^= (rngState << 5) >>> 0;
    return (rngState >>> 0) / 0xffffffff;
  }

  // ====== State ======
  const GameMode = Object.freeze({
    Ready: "Ready",
    Running: "Running",
    Paused: "Paused",
    Over: "Game Over",
  });

  let mode = GameMode.Ready;

  let birdY = Math.floor(H * 0.45);
  let birdV = 0;

  let pipes = []; // {x, gapY, passed}
  let spawnTimer = 0;

  let score = 0;

  // Deterministic loop: fixed timestep accumulator
  const FIXED_DT = 1 / 120; // 120Hz simulation
  let lastT = performance.now();
  let acc = 0;

  // ====== Helpers ======
  function setMode(m) {
    mode = m;
    statusEl.textContent = m;
  }

  function reset() {
    birdY = Math.floor(H * 0.45);
    birdV = 0;
    pipes = [];
    spawnTimer = 0;
    score = 0;
    scoreEl.textContent = "0";
    setMode(GameMode.Ready);
  }

  function start() {
    if (mode === GameMode.Running) return;
    if (mode === GameMode.Over) reset();
    setMode(GameMode.Running);
  }

  function gameOver() {
    setMode(GameMode.Over);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      setBest(best);
    }
  }

  function flap() {
    if (mode === GameMode.Ready) start();
    if (mode !== GameMode.Running) return;
    birdV = FLAP_VELOCITY;
  }

  function togglePause() {
    if (mode === GameMode.Running) setMode(GameMode.Paused);
    else if (mode === GameMode.Paused) setMode(GameMode.Running);
  }

  function currentGap() {
    // shrink gap slightly every 10 points, but never below GAP_MIN
    const steps = Math.floor(score / 10);
    return Math.max(GAP_MIN, GAP_SIZE - steps * GAP_RAMP_PER_10);
  }

  function currentSpeed() {
    // speed up slightly every 10 points
    const steps = Math.floor(score / 10);
    return PIPE_SPEED + steps * SPEED_RAMP_PER_10;
  }

  function spawnPipe() {
    const gap = currentGap();
    // gap center must stay inside safe bounds (top margin + bottom margin)
    const topMargin = 70;
    const bottomLimit = H - FLOOR_H - 70;
    const minCenter = topMargin + gap / 2;
    const maxCenter = bottomLimit - gap / 2;

    const center = minCenter + (maxCenter - minCenter) * rng();
    pipes.push({
      x: W + 10,
      gapY: center,
      passed: false,
    });
  }

  function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
    // clamp point to rect
    const px = Math.max(rx, Math.min(cx, rx + rw));
    const py = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - px;
    const dy = cy - py;
    return dx * dx + dy * dy <= cr * cr;
  }

  // ====== Simulation ======
  function step(dt) {
    if (mode !== GameMode.Running) return;

    // Spawn logic
    spawnTimer += dt;
    while (spawnTimer >= PIPE_SPAWN_EVERY) {
      spawnTimer -= PIPE_SPAWN_EVERY;
      spawnPipe();
    }

    // Bird physics
    birdV += GRAVITY * dt;
    birdY += birdV * dt;

    // Floor/ceiling
    if (birdY - BIRD_R <= 0) {
      birdY = BIRD_R;
      birdV = 0;
    }
    if (birdY + BIRD_R >= H - FLOOR_H) {
      birdY = H - FLOOR_H - BIRD_R;
      gameOver();
      return;
    }

    // Pipes move + scoring + collisions
    const speed = currentSpeed();
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      p.x -= speed * dt;

      const gap = currentGap();
      const topH = p.gapY - gap / 2;
      const botY = p.gapY + gap / 2;

      // score when pipe passes bird x
      if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
        p.passed = true;
        score += 1;
        scoreEl.textContent = String(score);
      }

      // collision with top pipe rect
      const hitTop = circleRectCollide(
        BIRD_X, birdY, BIRD_R,
        p.x, 0,
        PIPE_WIDTH, topH
      );

      // collision with bottom pipe rect
      const hitBot = circleRectCollide(
        BIRD_X, birdY, BIRD_R,
        p.x, botY,
        PIPE_WIDTH, (H - FLOOR_H) - botY
      );

      if (hitTop || hitBot) {
        gameOver();
        return;
      }
    }

    // remove offscreen pipes
    while (pipes.length && pipes[0].x + PIPE_WIDTH < -20) {
      pipes.shift();
    }
  }

  // ====== Render ======
  function draw() {
    // background sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1f3a8a");
    g.addColorStop(0.55, "#0b1220");
    g.addColorStop(1, "#020617");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // subtle stars
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let i = 0; i < 30; i++) {
      const x = (i * 97) % W;
      const y = (i * 53) % (H - FLOOR_H);
      ctx.fillRect(x, y, 2, 2);
    }

    // pipes
    const gap = currentGap();
    for (const p of pipes) {
      const topH = p.gapY - gap / 2;
      const botY = p.gapY + gap / 2;

      // pipe body
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(p.x, 0, PIPE_WIDTH, topH);
      ctx.fillRect(p.x, botY, PIPE_WIDTH, (H - FLOOR_H) - botY);

      // pipe outline
      ctx.strokeStyle = "#14532d";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 1, 0 + 1, PIPE_WIDTH - 2, topH - 2);
      ctx.strokeRect(p.x + 1, botY + 1, PIPE_WIDTH - 2, (H - FLOOR_H) - botY - 2);

      // caps
      ctx.fillStyle = "#15803d";
      const capH = 16;
      ctx.fillRect(p.x - 4, Math.max(0, topH - capH), PIPE_WIDTH + 8, capH);
      ctx.fillRect(p.x - 4, botY, PIPE_WIDTH + 8, capH);
      ctx.strokeStyle = "#14532d";
      ctx.strokeRect(p.x - 4, Math.max(0, topH - capH), PIPE_WIDTH + 8, capH);
      ctx.strokeRect(p.x - 4, botY, PIPE_WIDTH + 8, capH);
    }

    // floor
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, H - FLOOR_H, W, FLOOR_H);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, H - FLOOR_H, W, 10);

    // bird
    const tilt = Math.max(-0.7, Math.min(0.7, birdV / 650));
    ctx.save();
    ctx.translate(BIRD_X, birdY);
    ctx.rotate(tilt);

    // body
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 2;
    ctx.stroke();

    // eye
    ctx.fillStyle = "#0b1220";
    ctx.beginPath();
    ctx.arc(5, -4, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.arc(6, -5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // beak
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.moveTo(BIRD_R - 2, -2);
    ctx.lineTo(BIRD_R + 10, 2);
    ctx.lineTo(BIRD_R - 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#9a3412";
    ctx.stroke();

    ctx.restore();

    // overlays
    if (mode === GameMode.Ready) {
      overlay("Tap / Space to start", "Keep the bird flying.");
    } else if (mode === GameMode.Paused) {
      overlay("Paused", "Press P to resume.");
    } else if (mode === GameMode.Over) {
      overlay("Game Over", `Score ${score} • Best ${best} • Tap to restart`);
    }
  }

  function overlay(title, subtitle) {
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#e5e7eb";
    ctx.textAlign = "center";

    ctx.font = "800 30px system-ui";
    ctx.fillText(title, W / 2, H / 2 - 16);

    ctx.fillStyle = "rgba(229,231,235,0.85)";
    ctx.font = "600 14px system-ui";
    ctx.fillText(subtitle, W / 2, H / 2 + 16);

    ctx.textAlign = "start";
  }

  // ====== Main loop ======
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    if (mode === GameMode.Running) {
      acc += dt;
      while (acc >= FIXED_DT) {
        step(FIXED_DT);
        acc -= FIXED_DT;
      }
    } else {
      // keep visuals responsive; do not accumulate time while paused/over
      acc = 0;
    }

    draw();
    requestAnimationFrame(loop);
  }

  // ====== Input ======
  function handlePrimaryAction() {
    if (mode === GameMode.Over) {
      reset();
      start();
      flap();
      return;
    }
    flap();
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handlePrimaryAction();
  });

  btnStart.addEventListener("click", () => {
    start();
    // slight assist: first click can act like flap
    handlePrimaryAction();
  });

  btnRestart.addEventListener("click", () => {
    reset();
    start();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      handlePrimaryAction();
    } else if (e.code === "KeyP") {
      e.preventDefault();
      togglePause();
    } else if (e.code === "KeyR") {
      e.preventDefault();
      reset();
    }
  });

  // ====== Initialize ======
  reset();
  requestAnimationFrame((t) => {
    lastT = t;
    requestAnimationFrame(loop);
  });
})();
