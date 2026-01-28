// File: /pages/games/echokeys-scaletrainer.js
import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

export default function EchoKeysScaleTrainerPage() {
  const canonical = `${CANONICAL_BASE}/games/echokeys-scaletrainer`;
  const iframeSrc = `/play/echokeys-scaletrainer/index.html`;

  return (
    <>
      <Head>
        <title>EchoKeys ScaleTrainer | Open Loop Apps</title>
        <meta
          name="description"
          content="Practice scales by pattern, tempo, and accuracy."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">EchoKeys ScaleTrainer</h1>
          <p className="subtitle">Practice scales by pattern, tempo, and accuracy.</p>
          <p className="smallNote">
            <Link href="/games">← Back to Games</Link>
          </p>
        </header>

        <div className="gameFrameWrap" role="region" aria-label="EchoKeys ScaleTrainer game">
          <iframe
            className="gameFrame"
            src={iframeSrc}
            title="EchoKeys ScaleTrainer"
            loading="eager"
            allow="fullscreen; gamepad; autoplay"
          />
        </div>

        <p className="smallNote" style={{ marginTop: 12 }}>
          If the game doesn’t load, confirm this file exists: <code>/public/play/echokeys-scaletrainer/index.html</code>
        </p>
      </main>
    </>
  );
}
