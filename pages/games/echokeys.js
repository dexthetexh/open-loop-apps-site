// File: /pages/games/echokeys.js
import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

export default function EchoKeysPage() {
  const canonical = `${CANONICAL_BASE}/games/echokeys`;
  const iframeSrc = `/play/echokeys/index.html`;

  return (
    <>
      <Head>
        <title>EchoKeys | Open Loop Apps</title>
        <meta
          name="description"
          content="Fast ear-training drills and reaction challenges with EchoKeys."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">EchoKeys</h1>
          <p className="subtitle">
            Fast ear-training drills and reaction challenges.
          </p>
          <p className="smallNote">
            <Link href="/games">← Back to Games</Link>
          </p>
        </header>

        {/* AdSense-safe: no ads on gameplay pages */}
        <div className="gameFrameWrap" role="region" aria-label="EchoKeys game">
          <iframe
            className="gameFrame"
            src={iframeSrc}
            title="EchoKeys"
            loading="eager"
            allow="fullscreen; gamepad; autoplay"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          />
        </div>

        <p className="smallNote" style={{ marginTop: 12 }}>
          If the game does not load, confirm this file exists:{" "}
          <code>/public/play/echokeys/index.html</code>
        </p>
      </main>
    </>
  );
}
