import Head from "next/head";
import Link from "next/link";
import AdSlot from "../../components/ads/AdSlot";
import { WEB_GAMES } from "../../lib/games";

const CANONICAL_BASE = "https://openloopapps.com";

const ANDROID_PLACEHOLDERS = [
  {
    slug: "idle-cyber-defense",
    title: "Idle Cyber Defense",
    desc: "Android app (placeholder).",
  },
  {
    slug: "tap-escape-speedrun",
    title: "Tap Escape Speedrun",
    desc: "Android app (placeholder).",
  },
];

export default function GamesIndex() {
  const canonical = `${CANONICAL_BASE}/games`;

  // Hub list: all playable web games (from lib) + android placeholders (local)
  const items = [
    ...WEB_GAMES.map((g) => ({
      ...g,
      kind: "web",
      href: `/games/${g.slug}`, // wrapper-first for consistency + monetization stance
      cta: "Play →",
    })),
    ...ANDROID_PLACEHOLDERS.map((g) => ({
      ...g,
      kind: "android",
      href: `/games/${g.slug}`,
      cta: "Details →",
    })),
  ];

  return (
    <>
      <Head>
        <title>{`Games | Open Loop Apps`}</title>
        <meta
          name="description"
          content="Browse lightweight games from Open Loop Apps."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Games</h1>
          <p className="subtitle">
            Web games run in your browser. Android titles are listed as placeholders
            until store pages go live.
          </p>
        </header>

        {/* Ads on catalog pages only */}
        <AdSlot slot="1234567890" className="ad-slot" />

        <section className="grid" aria-label="Game catalog">
          {items.map((g) => (
            <Link key={g.slug} href={g.href} className="card">
              <h2 className="h2">{g.title}</h2>
              <p className="cardText">{g.desc}</p>
              <span className="cardCta">{g.cta}</span>
            </Link>
          ))}
        </section>

        <AdSlot slot="2345678901" className="ad-slot" />

        <footer className="footerNote">
          Tip: If a game feels off on mobile, rotate your device or try a different browser.
        </footer>

        <AdSlot slot="3456789012" className="ad-slot" />
      </main>
    </>
  );
}
