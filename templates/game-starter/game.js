/*
 * {{TITLE}}: built from templates/game-starter.
 * Everything shared (saves, haptics, audio, lifecycle, ads) comes from OL.
 * Replace the gameplay in this file; keep the four OL calls marked below.
 */
(() => {
  "use strict";

  const BEST_KEY = "ola_{{SLUG_ID}}_best_v1";
  const ROUND_SECONDS = 20;

  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), target = $("target"), overlay = $("overlay");
  const scoreEl = $("score"), bestEl = $("best"), timeEl = $("time");

  let score = 0;
  let best = Math.floor(OL.store.getNumber(BEST_KEY, 0));
  let timeLeft = 0;
  let running = false;
  let last = 0;

  bestEl.textContent = String(best);

  function placeTarget() {
    const r = stage.getBoundingClientRect();
    const pad = 48;
    target.style.left = `${pad + Math.random() * Math.max(1, r.width - pad * 2)}px`;
    target.style.top = `${pad + Math.random() * Math.max(1, r.height - pad * 2)}px`;
  }

  function start() {
    score = 0;
    timeLeft = ROUND_SECONDS;
    running = true;
    scoreEl.textContent = "0";
    overlay.classList.add("hidden");
    target.classList.remove("hidden");
    placeTarget();
    OL.game.gameplayStart();                       // (1) active play begins
    last = performance.now();
    requestAnimationFrame(tick);
  }

  function end() {
    running = false;
    target.classList.add("hidden");
    OL.game.gameplayStop();                        // (2) active play ends
    if (score > best) {
      best = score;
      OL.store.set(BEST_KEY, best);
      bestEl.textContent = String(best);
      OL.haptics.success();
    }
    $("overlayTitle").textContent = `Score ${score}`;
    $("overlayText").textContent = `Best ${best}`;
    $("playBtn").textContent = "Play again";
    overlay.classList.remove("hidden");
    OL.ads.break("round_end");                     // (3) natural break: ads only here
  }

  function tick(now) {
    if (!running) return;
    timeLeft = Math.max(0, timeLeft - (now - last) / 1000);
    last = now;
    timeEl.textContent = timeLeft.toFixed(1);
    if (timeLeft <= 0) return end();
    requestAnimationFrame(tick);
  }

  OL.input.onPress(target, () => {
    if (!running) return;
    score += 1;
    scoreEl.textContent = String(score);
    OL.haptics.tap();
    placeTarget();
  });

  OL.input.onPress($("playBtn"), (e) => { e.preventDefault(); start(); });
  OL.input.onKey((e) => {
    if (!running && (e.code === "Space" || e.code === "Enter")) { e.preventDefault(); start(); }
  });

  OL.game.loadingDone();                           // (4) first screen is ready
})();
