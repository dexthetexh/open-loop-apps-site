// File: /lib/games.js

export const WEB_GAMES = [
  { slug: "echokeys", title: "EchoKeys", desc: "Fast ear-training drills and reaction challenges." },
  { slug: "pixel-diner", title: "Pixel Diner", desc: "Serve, upgrade, and survive the rush." },
  { slug: "echokeys-scaletrainer", title: "EchoKeys ScaleTrainer", desc: "Practice scales by pattern, tempo, and accuracy." },
  { slug: "flappy-bird", title: "Flappy Bird", desc: "A lightweight arcade tap classic." },
  { slug: "reelloop", title: "ReelLoop", desc: "Cozy trophy fishing with crisp haptics." },
];

export const WEB_GAME_SLUGS = WEB_GAMES.map((g) => g.slug);

export function getPrevNextSlug(slug, slugs = WEB_GAME_SLUGS) {
  const idx = slugs.indexOf(slug);
  if (idx < 0 || slugs.length === 0) return { prev: null, next: null };
  const len = slugs.length;
  return {
    prev: slugs[(idx - 1 + len) % len],
    next: slugs[(idx + 1) % len],
  };
}

export function getGameBySlug(slug) {
  return WEB_GAMES.find((g) => g.slug === slug) || null;
}
