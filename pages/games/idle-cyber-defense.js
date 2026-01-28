// File: /pages/games/idle-cyber-defense.js
import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

export default function IdleCyberDefensePage() {
  const canonical = `${CANONICAL_BASE}/games/idle-cyber-defense`;

  return (
    <>
      <Head>
        <title>Idle Cyber Defense | Open Loop Apps</title>
        <meta
          name="description"
          content="Idle Cyber Defense is an Android title. Store listing coming soon."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Idle Cyber Defense</h1>
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
