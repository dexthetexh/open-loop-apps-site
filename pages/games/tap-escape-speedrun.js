// File: /pages/games/tap-escape-speedrun.js
import Head from "next/head";
import Link from "next/link";
import { getGameBySlug, getPrevNextSlug } from "../../lib/games";

const CANONICAL_BASE = "https://openloopapps.com";

export async function getStaticProps() {
  const game = getGameBySlug("tap-escape-speedrun");
  if (!game) return { notFound: true };

  const { prev, next } = getPrevNextSlug(game.slug);
  return { props: { game, prev, next } };
}

export default function TapEscapeSpeedrunGamePage({ game, prev, next }) {
  const canonical = `${CANONICAL_BASE}/games/${game.slug}`;
  const iframeSrc = `/play/${game.slug}/index.html`;

  return (
    <>
      <Head>
        <title>{`${game.title} | Open Loop Apps`}</title>
        <meta name="description" content={game.desc} />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">{game.title}</h1>
          <p className="subtitle">{game.desc}</p>

          <div className="navRow" aria-label="Catalog navigation">
            <Link className="navGhost" href="/games">← Games</Link>
            <span className="navSep">·</span>
            <Link href={`/play/${game.slug}`}>Play</Link>
            <span className="navSep">·</span>
            {prev && <Link href={`/games/${prev}`}>← Prev</Link>}
            <span className="navSep">·</span>
            {next && <Link href={`/games/${next}`}>Next →</Link>}
          </div>
        </header>

        {/* Ads allowed here (wrapper page). Keep your existing ad component/slot if you have one. */}
        {/* <AdSlot /> */}

        <section className="panel" aria-label="Play">
          <h2 className="h2">Play</h2>
          <div className="gameFrameWrap" role="region" aria-label={`${game.title} game`}>
            <iframe
              className="gameFrame"
              src={iframeSrc}
              title={game.title}
              loading="eager"
              allow="fullscreen; gamepad; autoplay; vibration; accelerometer; gyroscope"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
            />
          </div>

          <p className="smallNote" style={{ marginTop: 12 }}>
            Loaded from: <code>{iframeSrc}</code>
          </p>

          <div className="navRow" aria-label="Actions">
            <Link className="navGhost" href={`/play/${game.slug}`}>Open ad-free Play page →</Link>
          </div>
        </section>
      </main>
    </>
  );
}
