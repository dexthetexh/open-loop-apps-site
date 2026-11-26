/*!
 * Open Loop Kit v1.0.0
 * Shared runtime for every Open Loop game: storage, haptics, audio, input,
 * lifecycle and ads. Plain script, no build step, no dependencies.
 *
 *   <script src="../../kit/ol-kit.js"></script>   (before the game's own script)
 *
 * Everything hangs off window.OL:
 *   OL.store      safe localStorage (keys are used as given, so old saves survive)
 *   OL.haptics    vibrate with a shared on/off switch
 *   OL.audio      one AudioContext per page, unlocked on the first gesture
 *   OL.input      press (pointerdown) and key handlers with held-key guard
 *   OL.game       lifecycle signals portals need: loadingDone, gameplayStart/Stop
 *   OL.ads        OL.ads.break(name, {pause, resume}) at natural breaks only
 *
 * Channel config: window.OL_CONFIG (set inline by `npm run package`) or, on
 * openloopapps.com, /ads/config.json resolved next to this script.
 * Add ?adslots to the URL to preview ad breaks as overlays.
 */
(function () {
  "use strict";
  if (window.OL && window.OL.version) return; // loaded twice

  var VERSION = "1.0.0";
  var scriptSrc = (document.currentScript && document.currentScript.src) || "";

  // ------------------------------------------------------------------ store
  function canStore() {
    try {
      var k = "__ol_probe__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }
  var storeOk = canStore();
  var memory = {}; // fallback when storage is blocked (private mode, sandboxed portals)

  var store = {
    available: storeOk,
    get: function (key, fallback) {
      var v = null;
      try { v = storeOk ? localStorage.getItem(key) : (key in memory ? memory[key] : null); } catch (e) {}
      return v === null || v === undefined ? (fallback === undefined ? null : fallback) : v;
    },
    set: function (key, value) {
      var s = String(value);
      try { if (storeOk) localStorage.setItem(key, s); else memory[key] = s; } catch (e) { memory[key] = s; }
    },
    remove: function (key) {
      try { if (storeOk) localStorage.removeItem(key); } catch (e) {}
      delete memory[key];
    },
    getNumber: function (key, fallback) {
      var n = parseFloat(store.get(key, ""));
      return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
    },
    getBool: function (key, fallback) {
      var v = store.get(key, null);
      return v === null ? !!fallback : v === "true";
    },
    getJSON: function (key, fallback) {
      var raw = store.get(key, null);
      if (raw === null) return fallback === undefined ? null : fallback;
      try { return JSON.parse(raw); } catch (e) { return fallback === undefined ? null : fallback; }
    },
    setJSON: function (key, value) {
      try { store.set(key, JSON.stringify(value)); } catch (e) {}
    },
  };

  // ---------------------------------------------------------------- haptics
  var haptics = {
    enabled: true,
    supported: typeof navigator !== "undefined" && typeof navigator.vibrate === "function",
    vibrate: function (pattern) {
      if (!haptics.enabled || !haptics.supported) return false;
      try { return navigator.vibrate(pattern); } catch (e) { return false; }
    },
    tap: function () { return haptics.vibrate(10); },
    success: function () { return haptics.vibrate([40, 30, 60]); },
    error: function () { return haptics.vibrate([120, 60, 120]); },
  };

  // ------------------------------------------------------------------ audio
  var ctx = null;
  var muted = false;
  var muteListeners = [];
  var audio = {
    /** The shared AudioContext, created on first use. Null if unsupported. */
    context: function () {
      if (ctx) return ctx;
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { ctx = null; }
      return ctx;
    },
    /** Resume after a gesture (iOS/Chrome start contexts suspended). */
    resume: function () {
      var c = audio.context();
      if (c && c.state === "suspended" && c.resume) return c.resume().catch(function () {});
      return Promise.resolve();
    },
    get muted() { return muted; },
    setMuted: function (m) {
      muted = !!m;
      muteListeners.forEach(function (fn) { try { fn(muted); } catch (e) {} });
    },
    onMuteChange: function (fn) { muteListeners.push(fn); },
  };
  // Unlock audio on the first real gesture anywhere on the page.
  function unlockOnce() {
    if (ctx) audio.resume();
    window.removeEventListener("pointerdown", unlockOnce, true);
    window.removeEventListener("keydown", unlockOnce, true);
  }
  window.addEventListener("pointerdown", unlockOnce, true);
  window.addEventListener("keydown", unlockOnce, true);

  // ------------------------------------------------------------------ input
  var IGNORED = { Tab: 1, Shift: 1, Control: 1, Alt: 1, Meta: 1, CapsLock: 1, ContextMenu: 1 };
  var input = {
    /** Fires on pointerdown (faster than click, works for touch, mouse, pen). */
    onPress: function (el, handler) {
      if (!el) return;
      el.addEventListener("pointerdown", function (e) {
        if (e.button > 0) return;
        handler(e);
      });
    },
    /**
     * Keyboard handler. Ignores held-key repeats and modifier/F keys by default,
     * so holding a key can never drive a game.
     */
    onKey: function (handler, opts) {
      opts = opts || {};
      window.addEventListener("keydown", function (e) {
        if (!opts.allowRepeat && e.repeat) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (IGNORED[e.key] || /^F\d{1,2}$/.test(e.key)) return;
        handler(e);
      });
    },
  };

  // --------------------------------------------------------------- channel
  function hasPreviewFlag() {
    try {
      if (new URLSearchParams(location.search).has("adslots")) return true;
      if (window.parent !== window) return new URLSearchParams(window.parent.location.search).has("adslots");
    } catch (e) { /* cross-origin parent */ }
    return false;
  }

  var preview = hasPreviewFlag();
  var adapters = {};
  var adapter = null;   // active ad/lifecycle adapter once config resolves
  var pending = [];     // lifecycle calls made before the adapter was ready
  var playing = false;

  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent("ol:" + name, { detail: detail || {} })); } catch (e) {}
  }

  function call(method, args) {
    if (adapter) { if (adapter[method]) adapter[method].apply(adapter, args || []); }
    else pending.push([method, args]);
  }

  // ------------------------------------------------------------- lifecycle
  var game = {
    /** Call once when the first screen is interactive. */
    loadingDone: function () { emit("loading-done"); call("loadingDone"); },
    /** Call when active play begins (run start, unpause). */
    gameplayStart: function () {
      if (playing) return;
      playing = true; emit("gameplay-start"); call("gameplayStart");
    },
    /** Call when active play ends (game over, pause, level summary). */
    gameplayStop: function () {
      if (!playing) return;
      playing = false; emit("gameplay-stop"); call("gameplayStop");
    },
    /** Optional: a big win (portals may celebrate it). */
    happyTime: function () { emit("happy-time"); call("happyTime"); },
    get playing() { return playing; },
  };

  // ------------------------------------------------------------------- ads
  function showPreview(name, done) {
    var el = document.createElement("div");
    el.setAttribute("role", "status");
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;" +
      "justify-content:center;gap:6px;background:rgba(5,11,22,.88);color:#fbbf24;font:600 15px/1.4 system-ui,sans-serif;" +
      "border:3px dashed #f59e0b;text-align:center;padding:20px;cursor:pointer";
    el.innerHTML =
      '<div style="font-family:ui-monospace,Menlo,monospace;font-size:17px">Ad break: ' + String(name).replace(/[<>&]/g, "") + "</div>" +
      '<div style="color:#a3b1c9;font-weight:400">Channel: ' + (adapter ? adapter.name : "pending") +
      (adapter && adapter.live ? " · live" : " · not live") + "</div>" +
      '<div style="color:#a3b1c9;font-weight:400">Tap to continue</div>';
    var closed = false;
    function close() { if (closed) return; closed = true; el.remove(); done(); }
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    setTimeout(close, 2500);
    document.body.appendChild(el);
  }

  var ads = {
    /**
     * Request an interstitial at a natural break (game over, level end).
     * The network applies the frequency cap, so most calls show nothing and
     * resume right away. `resume` always runs exactly once.
     */
    break: function (name, opts) {
      opts = opts || {};
      var resumed = false;
      function resume() {
        if (resumed) return; resumed = true;
        audio.setMuted(false);
        if (opts.resume) opts.resume();
        emit("ad-done", { name: name });
      }
      function pause() { audio.setMuted(true); if (opts.pause) opts.pause(); }
      emit("ad-break", { name: name });
      if (preview) { pause(); return showPreview(name, resume); }
      if (!adapter || !adapter.live || !adapter.interstitial) return resume();
      try { adapter.interstitial(name, pause, resume); } catch (e) { resume(); }
    },
  };

  // --------------------------------------------------------------- adapters
  /** Register a channel adapter: {name, init(cfg) -> Promise<bool live>, interstitial, loadingDone, ...}. */
  function registerAdapter(impl) { adapters[impl.name] = impl; }

  // Default: no ads, lifecycle calls are no-ops.
  registerAdapter({ name: "none", init: function () { return Promise.resolve(false); } });

  // openloopapps.com: AdSense H5 Games Ad Placement API.
  registerAdapter({
    name: "site",
    init: function (cfg) {
      if (!cfg.enabled || !cfg.client || !cfg.games || !cfg.games.enabled) return Promise.resolve(false);
      var s = document.createElement("script");
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(cfg.client);
      s.setAttribute("data-ad-client", cfg.client);
      s.setAttribute("data-ad-frequency-hint", cfg.games.frequencyHint || "60s");
      if (cfg.testMode) s.setAttribute("data-adbreak-test", "on");
      document.head.appendChild(s);
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
      window.adConfig({ preloadAdBreaks: "on", sound: "on" });
      return Promise.resolve(true);
    },
    interstitial: function (name, pause, resume) {
      window.adBreak({ type: "next", name: name, beforeAd: pause, afterAd: resume, adBreakDone: resume });
    },
  });

  function activate(cfg) {
    cfg = cfg || {};
    var impl = adapters[cfg.channel || "site"] || adapters.none;
    return Promise.resolve()
      .then(function () { return impl.init(cfg); })
      .catch(function () { return false; })
      .then(function (live) {
        adapter = { name: impl.name, live: !!live };
        for (var k in impl) if (typeof impl[k] === "function" && k !== "init") adapter[k] = impl[k].bind(impl);
        var q = pending; pending = [];
        q.forEach(function (p) { call(p[0], p[1]); });
        emit("ready", { channel: impl.name, live: !!live });
      });
  }

  function loadConfig() {
    if (window.OL_CONFIG) return Promise.resolve(window.OL_CONFIG);
    var url;
    try { url = new URL("../ads/config.json", scriptSrc || location.href).toString(); } catch (e) { url = "/ads/config.json"; }
    return fetch(url, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) { if (cfg) cfg.channel = cfg.channel || "site"; return cfg || { channel: "none" }; })
      .catch(function () { return { channel: "none" }; });
  }

  window.OL = {
    version: VERSION,
    store: store,
    haptics: haptics,
    audio: audio,
    input: input,
    game: game,
    ads: ads,
    registerAdapter: registerAdapter,
    get channel() { return adapter ? adapter.name : null; },
  };

  // Back-compat for code written against the v0 ad loader.
  window.OLAds = { gameBreak: ads.break };

  // Let the page register extra adapters synchronously after this script,
  // then resolve config on the next tick.
  setTimeout(function () { loadConfig().then(activate); }, 0);
})();
