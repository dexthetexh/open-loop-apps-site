// File: /pages/games/tap-escape-speedrun.js
import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

export default function TapEscapeSpeedrunPage() {
  const canonical = `${CANONICAL_BASE}/games/tap-escape-speedrun`;

  return (
    <>
      <Head>
        <title>Tap Escape Speedrun | Open Loop Apps</title>
        <meta
          name="description"
          content="Tap Escape Speedrun is an Android title. Store listing coming soon."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Tap Escape Speedrun</h1>
          <p className="subtitle">
            Android app (placeholder). The Play Store listing will be linked here when live.
          </p>
          <p className="smallNote">
            <Link href="/games">← Back to Games</Link>
          </p>
        </header>

        <div className="card" style={{ maxWidth: 720 }}>
          <h2 className="h2">Status</h2>
          <p className="cardText">
            Coming soon. This page is intentionally reachable for indexing and catalog completeness.
          </p>
          <p className="cardText">
            Future: add Play Store link + screenshots + feature list.
          </p>
        </div>
      </main>
    </>
  );
}
