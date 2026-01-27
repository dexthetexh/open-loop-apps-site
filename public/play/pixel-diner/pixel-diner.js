(() => {
  // ---------------- PWA Install Support (same behavior) ----------------
  let deferredPrompt;
  const installPrompt = document.getElementById("installPrompt");
  const installBtn = document.getElementById("installBtn");
  const installClose = document.getElementById("installClose");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => installPrompt?.classList.add("visible"), 3000);
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installPrompt?.classList.remove("visible");
  });

  installClose?.addEventListener("click", () => installPrompt?.classList.remove("visible"));

  function vibrate(pattern = 10) {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  }

  // ---------------- Daily key helpers ----------------
  const STORAGE_KEY = "pixelDinerStateV2";
  const dailyKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // ---------------- Game State ----------------
  const gameState = {
    score: 0,
    combo: 0,
    bestCombo: 0,
    ordersServed: 0,
    currentOrder: [],
    isPlaying: false,

    highScore: 0,

    dailyBest: 0,
    dailyStamp: dailyKey(),

    difficulty: 1,

    // per-order timer (0..1)
    orderTimeTotalMs: 2200,
    orderTimeLeftMs: 2200,
    lastTickMs: 0,
    raf: 0
  };

  // Ingredients database (same icons/emoji)
  const ingredients = [
    { emoji: "🍔", name: "BURGER", id: "burger" },
    { emoji: "🍕", name: "PIZZA", id: "pizza" },
    { emoji: "🍟", name: "FRIES", id: "fries" },
    { emoji: "🌭", name: "HOT DOG", id: "hotdog" },
    { emoji: "🌮", name: "TACO", id: "taco" },
    { emoji: "🍗", name: "CHICKEN", id: "chicken" },
    { emoji: "🥤", name: "SODA", id: "soda" },
    { emoji: "🍦", name: "ICE CREAM", id: "icecream" },
    { emoji: "🥗", name: "SALAD", id: "salad" }
  ];

  // ---------------- DOM Elements ----------------
  const loading = document.getElementById("loading");
  const startScreen = document.getElementById("startScreen");
  const startBtn = document.getElementById("startBtn");

  const scoreEl = document.getElementById("score");
  const dailyBestEl = document.getElementById("dailyBest");
  const comboEl = document.getElementById("combo");

  const currentOrderEl = document.getElementById("currentOrder");
  const timerFill = document.getElementById("timerFill");
  const cookingStation = document.getElementById("cookingStation");

  const gameOverScreen = document.getElementById("gameOver");
  const finalScoreEl = document.getElementById("finalScore");
  const highScoreEl = document.getElementById("highScore");
  const dailyOverEl = document.getElementById("dailyOver");
  const ordersServedEl = document.getElementById("ordersServed");
  const bestComboEl = document.getElementById("bestCombo");
  const restartBtn = document.getElementById("restartBtn");

  // ---------------- Persistence ----------------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      gameState.highScore = Number(data.highScore || 0);

      const today = dailyKey();
      const storedStamp = String(data.dailyStamp || today);

      if (storedStamp !== today) {
        // new day
        gameState.dailyStamp = today;
        gameState.dailyBest = 0;
      } else {
        gameState.dailyStamp = storedStamp;
        gameState.dailyBest = Number(data.dailyBest || 0);
      }
    } catch {
      // ignore
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          highScore: gameState.highScore,
          dailyBest: gameState.dailyBest,
          dailyStamp: gameState.dailyStamp
        })
      );
    } catch {
      // ignore
    }
  }

  // ---------------- UI ----------------
  function createParticle(element, emoji) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.textContent = emoji;

    const rect = element.getBoundingClientRect();
    particle.style.left = rect.left + rect.width / 2 + "px";
    particle.style.top = rect.top + rect.height / 2 + "px";

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }

  function updateScore() {
    scoreEl.textContent = String(gameState.score);
    dailyBestEl.textContent = `DAILY: ${gameState.dailyBest}`;
  }

  function updateCombo() {
    if (gameState.combo > 1) {
      comboEl.textContent = `COMBO x${gameState.combo}`;
      comboEl.classList.add("active");
    } else {
      comboEl.classList.remove("active");
    }
  }

  function setTimerRatio(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    timerFill.style.width = `${Math.floor(clamped * 100)}%`;
  }

  // ---------------- Game Mechanics ----------------
  function orderSizeForDifficulty() {
    return Math.min(2 + Math.floor(gameState.difficulty / 3), 4);
  }

  function orderTimeForDifficultyMs() {
    // Start forgiving; ramp difficulty. Clamp so it never becomes impossible.
    const base = Math.round(2400 * 1.35);              // 3240ms
    const decay = gameState.difficulty * 110; // ms
    return Math.max(Math.round(850 * 1.35), base - decay);
  }

  function resetOrderTimer() {
    gameState.orderTimeTotalMs = orderTimeForDifficultyMs();
    gameState.orderTimeLeftMs = gameState.orderTimeTotalMs;
    gameState.lastTickMs = performance.now();
    setTimerRatio(1);
  }

  function generateOrder() {
    const size = orderSizeForDifficulty();
    const order = [];
    for (let i = 0; i < size; i++) {
      const ing = ingredients[Math.floor(Math.random() * ingredients.length)];
      order.push(ing);
    }
    gameState.currentOrder = order;
    displayOrder();
    resetOrderTimer();
  }

  function displayOrder() {
    currentOrderEl.innerHTML = "";
    gameState.currentOrder.forEach((item) => {
      const orderDiv = document.createElement("div");
      orderDiv.className = "order-item";
      orderDiv.innerHTML = `
        <div class="order-emoji">${item.emoji}</div>
        <div class="order-text">${item.name}</div>
      `;
      currentOrderEl.appendChild(orderDiv);
    });
  }

  function endGame() {
    vibrate([100, 50, 100]);
    gameState.isPlaying = false;

    cancelAnimationFrame(gameState.raf);

    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }
    if (gameState.score > gameState.dailyBest) {
      gameState.dailyBest = gameState.score;
    }
    saveState();

    finalScoreEl.textContent = String(gameState.score);
    highScoreEl.textContent = `HIGH: ${gameState.highScore}`;
    dailyOverEl.textContent = `DAILY: ${gameState.dailyBest}`;
    ordersServedEl.textContent = String(gameState.ordersServed);
    bestComboEl.textContent = String(gameState.bestCombo);
    gameOverScreen.classList.add("active");
  }

  function tick() {
    if (!gameState.isPlaying) return;

    const now = performance.now();
    const dt = now - gameState.lastTickMs;
    gameState.lastTickMs = now;

    gameState.orderTimeLeftMs -= dt;

    const ratio = gameState.orderTimeLeftMs / gameState.orderTimeTotalMs;
    setTimerRatio(ratio);

    if (gameState.orderTimeLeftMs <= 0) {
      endGame();
      return;
    }

    gameState.raf = requestAnimationFrame(tick);
  }

  function handleIngredientClick(ingredient) {
    if (!gameState.isPlaying) return;

    const expected = gameState.currentOrder[0];
    const ingredientBtn = document.querySelector(`[data-id="${ingredient.id}"]`);

    if (!expected) return;

    if (ingredient.id === expected.id) {
      // Correct
      vibrate(10);
      ingredientBtn?.classList.add("correct");
      setTimeout(() => ingredientBtn?.classList.remove("correct"), 300);

      createParticle(ingredientBtn, "✨");

      gameState.currentOrder.shift();
      gameState.combo += 1;
      if (gameState.combo > gameState.bestCombo) gameState.bestCombo = gameState.combo;

      if (gameState.currentOrder.length === 0) {
        // Completed order
        vibrate([10, 50, 10]);

        const points = 10 * gameState.combo;
        gameState.score += points;

        gameState.difficulty += 0.5;
        gameState.ordersServed += 1;

        updateScore();
        updateCombo();

        generateOrder(); // new timed order
      } else {
        displayOrder();
        updateCombo();
      }
    } else {
      // Wrong
      vibrate([50, 30, 50]);
      ingredientBtn?.classList.add("wrong");
      setTimeout(() => ingredientBtn?.classList.remove("wrong"), 300);

      createParticle(ingredientBtn, "💥");

      gameState.combo = 0;
      updateCombo();

      // Small penalty to the current order timer (keeps tension, no “random” failures)
      gameState.orderTimeLeftMs = Math.max(0, gameState.orderTimeLeftMs - 250);
    }
  }

  // ---------------- Init Cooking Station ----------------
  function initCookingStation() {
    cookingStation.innerHTML = "";
    ingredients.forEach((ingredient) => {
      const btn = document.createElement("div");
      btn.className = "ingredient";
      btn.dataset.id = ingredient.id;
      btn.innerHTML = `
        <div class="ingredient-emoji">${ingredient.emoji}</div>
        <div class="ingredient-name">${ingredient.name}</div>
      `;

      btn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          handleIngredientClick(ingredient);
        },
        { passive: false }
      );

      btn.addEventListener("click", () => handleIngredientClick(ingredient));
      cookingStation.appendChild(btn);
    });
  }

  // ---------------- Start/Restart ----------------
  function startGame() {
    vibrate(20);

    // daily stamp check in case tab stayed open over midnight
    const today = dailyKey();
    if (gameState.dailyStamp !== today) {
      gameState.dailyStamp = today;
      gameState.dailyBest = 0;
      saveState();
    }

    gameState.score = 0;
    gameState.combo = 0;
    gameState.bestCombo = 0;
    gameState.ordersServed = 0;
    gameState.difficulty = 1;

    gameState.isPlaying = true;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.remove("active");

    updateScore();
    updateCombo();
    generateOrder();

    cancelAnimationFrame(gameState.raf);
    gameState.lastTickMs = performance.now();
    gameState.raf = requestAnimationFrame(tick);
  }

  startBtn?.addEventListener("click", startGame);
  restartBtn?.addEventListener("click", startGame);

  // Prevent pull-to-refresh / multi-touch scroll weirdness
  document.body.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );

  // Loading splash
  window.addEventListener("load", () => {
    setTimeout(() => loading?.classList.add("hidden"), 500);
  });

  // Boot
  loadState();
  initCookingStation();
  updateScore();
  updateCombo();

  // Optional: service worker omitted here on purpose (Cloudflare Pages + data-URI SW is not worth the confusion).
  // If you want offline caching, do it as a real file later.
})();
