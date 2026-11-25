// Single source of truth for the catalog. Data lives in games.json so build
// scripts (sitemap) can read it without a bundler.
import GAMES from "./games.json";

export const ALL_GAMES = GAMES;
export const WEB_GAMES = GAMES.filter((g) => g.platforms.web);

export function getGameBySlug(slug) {
  return GAMES.find((g) => g.slug === slug) || null;
}

export function playPath(slug) {
  return `/play/${slug}/`;
}

/** Neighbours within the same list, wrapping around. */
export function getPrevNext(slug, list = ALL_GAMES) {
  const idx = list.findIndex((g) => g.slug === slug);
  if (idx < 0 || list.length < 2) return { prev: null, next: null };
  const len = list.length;
  return { prev: list[(idx - 1 + len) % len], next: list[(idx + 1) % len] };
}
