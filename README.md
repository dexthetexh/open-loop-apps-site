# Open Loop Apps — openloopapps.com

Static Next.js shell (Pages Router, `output: "export"`) hosting self-contained browser games. Deployed on Cloudflare Pages.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/ (+ sitemap.xml)
npm run preview    # serve out/ locally
```

Node 22+.

## Layout

| Path | What |
| --- | --- |
| `lib/games.json` | **Catalog source of truth.** Add a game here; pages, cards and sitemap follow. |
| `lib/site.js` | Site name, contact email, ad config (from env). |
| `pages/games/[slug].js` | One landing page per catalog entry (embed, controls, JSON-LD). |
| `public/play/<slug>/` | Game runtimes. Each is standalone: `index.html` entrypoint, no framework imports. Served at `/play/<slug>/`. |
| `public/kit/ol-kit.js` | **Open Loop Kit**: shared game runtime (storage, haptics, audio, input, lifecycle, ads). |
| `templates/game-starter/` | Starting point for new games, already wired to the kit. |
| `public/_headers` | Security and cache headers for Cloudflare Pages. |
| `assets-src/` | Source art not shipped to the site (ReelLoop sheets). |
| `docs/games/` | Per-game dev notes moved out of `public/`. |
| `scripts/` | `postbuild.mjs` writes the sitemap and ad config; `pages-output.mjs` mirrors `out/` for Pages; `new-game.mjs` and `package.mjs` (below). |

## Add a game

```bash
npm run new:game -- sky-hop "Sky Hop" "Hop between clouds." --genre=Arcade --accent=#38bdf8
```

This copies `templates/game-starter/` to `public/play/sky-hop/` and adds a **draft** entry to `lib/games.json`.
Drafts are playable at `/play/<slug>/` but hidden from the catalog, game pages and sitemap. Replace the gameplay in
`game.js`, then remove `"draft": true` to publish.

## Open Loop Kit

Every game loads `../../kit/ol-kit.js` before its own script and uses `window.OL`:

| API | Use |
| --- | --- |
| `OL.store.get/set/getNumber/getBool/getJSON/setJSON` | localStorage with try/catch and an in-memory fallback. Keys are used as given, so existing saves keep working. |
| `OL.haptics.vibrate(p)`, `.tap()`, `.success()`, `.error()` | Vibration with one shared switch (`OL.haptics.enabled`). |
| `OL.audio.context()`, `.resume()`, `.setMuted()` | One AudioContext per page, unlocked on the first gesture; muted during ads. |
| `OL.input.onPress(el, fn)`, `OL.input.onKey(fn)` | Pointerdown taps; key handler that ignores held-key repeats and modifier keys. |
| `OL.game.loadingDone()`, `.gameplayStart()`, `.gameplayStop()`, `.happyTime()` | Lifecycle signals. Portals require these; the kit forwards them to the channel adapter. |
| `OL.ads.break(name, {pause, resume})` | Interstitial at a natural break only. `resume` always runs once. |

Every game calls `loadingDone` once, `gameplayStart`/`gameplayStop` around active play, and `OL.ads.break` only at
game over or level end. The kit also fires `ol:*` window events (`ol:gameplay-start`, `ol:ad-break`, …) for debugging.

**Channels.** On openloopapps.com the kit reads `/ads/config.json` and uses the `site` adapter (AdSense H5 Games Ads).
A packaged build pins `window.OL_CONFIG = {channel}` instead. Adapters register with `OL.registerAdapter({name, init,
interstitial, loadingDone, gameplayStart, gameplayStop, happyTime})`.

## Package for portals and app wrappers

```bash
npm run package -- all              # every published game
npm run package -- reelloop         # one game
```

Writes `dist/packages/<channel>/<slug>.zip`: the game, the kit and any shared files it references (icon, fonts and
their licence), with paths rewritten to `./`. The only channel today is `none` (no ads), suitable for itch.io and app
wrappers. Portal adapters (CrazyGames, Poki, GameDistribution) are phase 2 of the growth plan.

## Deploy (Cloudflare Pages)

Current project settings: build command `npm run build:pages`, output `.vercel/output/static`.
`build:pages` builds the static export and copies it to that folder, so no dashboard change is needed.
Optional cleanup: set build command to `npm run build` and output directory to `out`, then delete `scripts/pages-output.mjs`.

## Ads

All ad settings are env vars (see `.env.example`); nothing is hard-coded.

| Placement | Env var | Where |
| --- | --- | --- |
| `site_footer` | `NEXT_PUBLIC_ADSENSE_SLOT_SITE_FOOTER` | Every page, above the footer (not 404) |
| `home_inline` | `NEXT_PUBLIC_ADSENSE_SLOT_HOME_INLINE` | Home, after the game grid |
| `catalog_top` | `NEXT_PUBLIC_ADSENSE_SLOT_CATALOG_TOP` | `/games/`, above the grid |
| `catalog_bottom` | `NEXT_PUBLIC_ADSENSE_SLOT_CATALOG_BOTTOM` | `/games/`, bottom |
| `game_top` | `NEXT_PUBLIC_ADSENSE_SLOT_GAME_TOP` | `/games/<slug>/`, above the title |
| `game_bottom` | `NEXT_PUBLIC_ADSENSE_SLOT_GAME_BOTTOM` | `/games/<slug>/`, after details |
| In-game breaks | `NEXT_PUBLIC_ADS_GAMES_ENABLED`, `NEXT_PUBLIC_ADS_GAMES_FREQUENCY` | All six games, at round end |

A display placement renders only when `NEXT_PUBLIC_ADS_ENABLED=true`, a client id is set, and its slot var holds a real ad unit id.

In-game ads use the [H5 Games Ad Placement API](https://developers.google.com/ad-placement/apis): `public/ads/games.js` loads
`/ads/config.json` (written at build time) and games call `OLAds.gameBreak(name)` at game over / level end. AdSense applies
the frequency cap. No banners sit inside game screens, which keeps tap-heavy games clear of accidental-click policy issues.

**Preview every placement:** add `?adslots` to any URL (for example `/games/reelloop/?adslots`). Display slots show as
labelled outlines with their configuration status, and in-game breaks show an overlay naming the break, with no real ads.
