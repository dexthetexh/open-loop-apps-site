// Writes out/sitemap.xml from the catalog after `next build`.
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://openloopapps.com";
const games = JSON.parse(readFileSync(new URL("../lib/games.json", import.meta.url), "utf8"));
const today = new Date().toISOString().slice(0, 10);

const urls = [
  ["/", "1.0"],
  ["/games/", "0.9"],
  ...games.map((g) => [`/games/${g.slug}/`, "0.8"]),
  ...games.filter((g) => g.platforms.web).map((g) => [`/play/${g.slug}/`, "0.6"]),
  ["/privacy/", "0.3"],
  ["/contact/", "0.3"],
];

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([p, pr]) => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join("\n") +
  `\n</urlset>\n`;

writeFileSync("out/sitemap.xml", xml);
console.log(`sitemap.xml: ${urls.length} urls`);
