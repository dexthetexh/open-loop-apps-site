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
| `public/_headers` | Security and cache headers for Cloudflare Pages. |
| `assets-src/` | Source art not shipped to the site (ReelLoop sheets). |
| `docs/games/` | Per-game dev notes moved out of `public/`. |
| `scripts/` | `postbuild.mjs` writes the sitemap; `pages-output.mjs` mirrors `out/` for Pages. |

## Add a game

1. Drop the runtime in `public/play/<slug>/index.html` (relative asset paths).
2. Add an entry to `lib/games.json` (`frame`: `portrait` or `landscape`).
3. `npm run build` and check `/games/<slug>/`.

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
