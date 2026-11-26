// npm run new:game -- <slug> "<Title>" ["<tagline>"] [--genre=Arcade] [--accent=#38bdf8]
// Copies templates/game-starter to public/play/<slug>/ and adds a draft
// catalog entry. Drafts are playable at /play/<slug>/ but hidden from the
// site until "draft" is removed from lib/games.json.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const [slug, title, tagline = "A new Open Loop game."] = args.filter((a) => !a.startsWith("--"));

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !title) {
  console.error('Usage: npm run new:game -- <slug> "<Title>" ["<tagline>"] [--genre=Arcade] [--accent=#38bdf8]');
  process.exit(1);
}

const dest = join("public/play", slug);
if (existsSync(dest)) { console.error(`public/play/${slug} already exists`); process.exit(1); }

const catalogPath = "lib/games.json";
const games = JSON.parse(readFileSync(catalogPath, "utf8"));
if (games.some((g) => g.slug === slug)) { console.error(`${slug} is already in the catalog`); process.exit(1); }

const accent = flags.accent || "#38bdf8";
const vars = { TITLE: title, TAGLINE: tagline, SLUG: slug, SLUG_ID: slug.replace(/-/g, "_"), ACCENT: accent };
const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

mkdirSync(dest, { recursive: true });
for (const f of readdirSync("templates/game-starter")) {
  writeFileSync(join(dest, f), fill(readFileSync(join("templates/game-starter", f), "utf8")));
}

games.push({
  slug,
  title,
  tagline,
  description: tagline,
  genre: flags.genre || "Arcade",
  controls: ["Tap to play"],
  frame: "portrait",
  accent,
  platforms: { web: true },
  draft: true,
});
writeFileSync(catalogPath, JSON.stringify(games, null, 2) + "\n");

console.log(`Created public/play/${slug}/ (draft).
  Play it:   npm run dev, then open /play/${slug}/
  Publish:   remove "draft": true from its entry in lib/games.json
  Package:   npm run package -- ${slug}`);
