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

Environment variables: see `.env.example`. Ads render only when `NEXT_PUBLIC_ADS_ENABLED=true` **and** a real
slot id is set in `NEXT_PUBLIC_ADSENSE_SLOT_CATALOG` / `NEXT_PUBLIC_ADSENSE_SLOT_GAME`. Gameplay (`/play/*`) never shows ads.
