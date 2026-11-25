/*
 * Open Loop Apps: in-game ads via the AdSense H5 Games Ad Placement API.
 * https://developers.google.com/ad-placement/apis
 *
 * Games call   window.OLAds && OLAds.gameBreak("name", { pause, resume })
 * only at natural transitions (game over, level complete). AdSense applies
 * the frequency cap, so most calls show nothing and resume immediately.
 *
 * Config comes from /ads/config.json, written at build time from env vars.
 * Add ?adslots to the page URL (or the page embedding the game) to preview
 * every break as an outlined overlay instead of a real ad.
 */
(function () {
  "use strict";

  function hasPreviewFlag() {
    try {
      if (new URLSearchParams(location.search).has("adslots")) return true;
      if (window.parent !== window) return new URLSearchParams(window.parent.location.search).has("adslots");
    } catch (e) { /* cross-origin parent */ }
    return false;
  }

  var preview = hasPreviewFlag();
  var live = false;
  var queue = [];

  function showPreview(name, done) {
    var el = document.createElement("div");
    el.setAttribute("role", "status");
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;" +
      "justify-content:center;gap:6px;background:rgba(5,11,22,.88);color:#fbbf24;font:600 15px/1.4 system-ui,sans-serif;" +
      "border:3px dashed #f59e0b;text-align:center;padding:20px;cursor:pointer";
    el.innerHTML =
      '<div style="font-family:ui-monospace,Menlo,monospace;font-size:17px">Ad break: ' + name + "</div>" +
      '<div style="color:#a3b1c9;font-weight:400">Interstitial (adBreak type "next") · ' +
      (live ? "live" : "not live: ads off or no client") + "</div>" +
      '<div style="color:#a3b1c9;font-weight:400">Tap to continue</div>';
    var closed = false;
    function close() { if (closed) return; closed = true; el.remove(); done(); }
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    setTimeout(close, 2500);
    document.body.appendChild(el);
  }

  var OLAds = {
    gameBreak: function (name, opts) {
      opts = opts || {};
      var resumed = false;
      function resume() { if (!resumed) { resumed = true; if (opts.resume) opts.resume(); } }
      if (preview) {
        if (opts.pause) opts.pause();
        return showPreview(name, resume);
      }
      if (!live) return resume();
      window.adBreak({
        type: "next",
        name: name,
        beforeAd: function () { if (opts.pause) opts.pause(); },
        afterAd: resume,
        adBreakDone: resume,
      });
    },
  };
  window.OLAds = OLAds;

  fetch("/ads/config.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) {
      if (!cfg || !cfg.enabled || !cfg.client || !cfg.games || !cfg.games.enabled) return;
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
      live = true;
    })
    .catch(function () { /* offline or no config: game runs ad-free */ });
})();
