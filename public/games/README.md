# /public/games

Each game lives in its own folder and must be runnable as a standalone web app.

Rule:
- Every game folder must include an `index.html` entrypoint.
- No Next.js imports inside game runtime code.
- The Next.js site embeds games via iframe pages under `/pages/games/*`.

This structure makes games portable (WebView, TWA, itch.io) and resilient to framework upgrades.
