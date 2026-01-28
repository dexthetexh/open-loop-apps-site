// File: /pages/games/flappy-bird.js
import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

export default function FlappyBirdPage() {
  const canonical = `${CANONICAL_BASE}/games/flappy-bird`;
  const iframeSrc = `/play/flappy-bird/index.html`;

  return (
    <>
      <Head>
        <title>Flappy Bird | Open Loop Apps</title>
        <meta name="description" content="A lightweight arcade tap classic." />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Flappy Bird</h1>
          <p className="subtitle">A lightweight arcade tap classic.</p>
          <p className="smallNote">
            <Link href="/games">← Back to Games</Link>
          </p>
        </header>

        <div className="gameFrameWrap" role="region" aria-label="Flappy Bird game">
          <iframe
            className="gameFrame"
            src={iframeSrc}
            title="Flappy Bird"
            loading="eager"
            allow="fullscreen; gamepad; autoplay"
          />
        </div>

        <p className="smallNote" style={{ marginTop: 12 }}>
          If the game doesn’t load, confirm this file exists: <code>/public/play/flappy-bird/index.html</code>
        </p>
      </main>
    </>
  );
}
