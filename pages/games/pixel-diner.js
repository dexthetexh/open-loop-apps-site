// File: /pages/games/pixel-diner.js
import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

export default function PixelDinerPage() {
  const canonical = `${CANONICAL_BASE}/games/pixel-diner`;

  return (
    <>
      <Head>
        <title>Pixel Diner | Open Loop Apps</title>
        <meta
          name="description"
          content="Serve, upgrade, and survive the rush in Pixel Diner."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Pixel Diner</h1>
          <p className="subtitle">Serve, upgrade, and survive the rush.</p>
          <p className="smallNote">
            <Link href="/games">← Back to Games</Link>
          </p>
        </header>

        {/* AdSense-safe posture: NO ads on gameplay pages during review */}
        <div className="gameFrameWrap" role="region" aria-label="Pixel Diner game">
          <iframe
            className="gameFrame"
            src="/play/pixel-diner/index.html"
            title="Pixel Diner"
            loading="eager"
            allow="fullscreen; gamepad; autoplay"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          />
        </div>

        <p className="smallNote" style={{ marginTop: 12 }}>
          If the game does not load, confirm this file exists:{" "}
          <code>/public/play/pixel-diner/index.html</code>
        </p>
      </main>
    </>
  );
}
