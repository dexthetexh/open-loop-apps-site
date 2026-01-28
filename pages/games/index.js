import Head from "next/head";
import AdSlot from "../../components/ads/AdSlot";

const CANONICAL_BASE = "https://openloopapps.com";

export default function GamesPage() {
  const canonical = `${CANONICAL_BASE}/games`;

  return (
    <>
      <Head>
        <title>Games | Open Loop Apps</title>
        <meta
          name="description"
          content="Play lightweight web games from Open Loop Apps."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1>Games</h1>
          <p className="page-subtitle">
            Simple, fast web games. No accounts.
          </p>
        </header>

        <AdSlot slot="1234567890" className="ad-slot ad-slot-top" />

        <section className="games-grid">
          <a className="game-card" href="/play/echokeys">
            <h2>EchoKeys</h2>
            <p>Fast ear-training drills and reaction challenges.</p>
          </a>

          <a className="game-card" href="/play/pixel-diner">
            <h2>Pixel Diner</h2>
            <p>Serve, upgrade, and survive the rush.</p>
          </a>

          <a className="game-card" href="/play/echokeys-scaletrainer">
            <h2>EchoKeys ScaleTrainer</h2>
            <p>Practice scales by pattern, tempo, and accuracy.</p>
          </a>
        </section>

        <AdSlot slot="2345678901" className="ad-slot ad-slot-mid" />

        <footer className="page-footer">
          <p>
            Tip: Rotate your device on mobile for best gameplay experience.
          </p>
        </footer>

        <AdSlot slot="3456789012" className="ad-slot ad-slot-bottom" />
      </main>
    </>
  );
}
