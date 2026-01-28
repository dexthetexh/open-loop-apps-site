// File: /pages/games/index.js
import Head from "next/head";
import Link from "next/link";
import AdSlot from "../../components/ads/AdSlot";

const CANONICAL_BASE = "https://openloopapps.com";

/**
 * "type":
 * - "web" => playable in browser (expects /public/play/<slug>/index.html)
 * - "android" => placeholder page (coming soon / Play Store link later)
 */
const GAMES = [
  {
    slug: "echokeys",
    title: "EchoKeys",
    desc: "Fast ear-training drills and reaction challenges.",
    type: "web",
  },
  {
    slug: "pixel-diner",
    title: "Pixel Diner",
    desc: "Serve, upgrade, and survive the rush.",
    type: "web",
  },
  {
    slug: "echokeys-scaletrainer",
    title: "EchoKeys ScaleTrainer",
    desc: "Practice scales by pattern, tempo, and accuracy.",
    type: "web",
  },
  {
    slug: "flappy-bird",
    title: "Flappy Bird",
    desc: "A lightweight arcade tap classic.",
    type: "web",
  },
  {
    slug: "idle-cyber-defense",
    title: "Idle Cyber Defense",
    desc: "Android app (placeholder).",
    type: "android",
  },
  {
    slug: "tap-escape-speedrun",
    title: "Tap Escape Speedrun",
    desc: "Android app (placeholder).",
    type: "android",
  },
];

export default function GamesIndex() {
  const canonical = `${CANONICAL_BASE}/games`;

  return (
    <>
      <Head>
        <title>Games | Open Loop Apps</title>
        <meta
          name="description"
          content="Browse lightweight web games from Open Loop Apps."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Games</h1>
          <p className="subtitle">
            Web games run in your browser. Android titles are listed as placeholders until the store pages go live.
          </p>
        </header>

        {/* Ads on catalog pages only (AdSense-safe) */}
        <AdSlot slot="1234567890" className="ad-slot" />

        <section className="grid">
          {GAMES.map((g) => (
            <Link key={g.slug} href={`/games/${g.slug}`} className="card">
              <h2 className="h2">{g.title}</h2>
              <p className="cardText">{g.desc}</p>
              <span className="cardCta">
                {g.type === "web" ? "Play →" : "Details →"}
              </span>
            </Link>
          ))}
        </section>

        <AdSlot slot="2345678901" className="ad-slot" />

        <footer className="footerNote">
          Tip: If a web game feels off on mobile, rotate your device or try a different browser.
        </footer>

        <AdSlot slot="3456789012" className="ad-slot" />
      </main>
    </>
  );
}
