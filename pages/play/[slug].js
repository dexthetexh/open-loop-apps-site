// File: /pages/play/[slug].js
import Head from "next/head";
import Link from "next/link";
import { WEB_GAMES, getPrevNextSlug, getGameBySlug } from "../../lib/games";

const CANONICAL_BASE = "https://openloopapps.com";

export async function getStaticPaths() {
  return {
    paths: WEB_GAMES.map((g) => ({ params: { slug: g.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const game = getGameBySlug(params.slug);
  if (!game) return { notFound: true };

  const { prev, next } = getPrevNextSlug(game.slug);

  return { props: { game, prev, next } };
}

export default function PlaySlugPage({ game, prev, next }) {
  const canonical = `${CANONICAL_BASE}/play/${game.slug}`;
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

          <div className="navRow" aria-label="Game navigation">
            <Link className="navGhost" href="/games">← Games</Link>
            <span className="navSep">·</span>
            <Link href={`/games/${game.slug}`}>Game page</Link>
            <span className="navSep">·</span>
            {prev && <Link href={`/play/${prev}`}>← Prev</Link>}
            <span className="navSep">·</span>
            {next && <Link href={`/play/${next}`}>Next →</Link>}
          </div>
        </header>

        {/* AdSense-safe: no ads on gameplay pages */}
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
      </main>
    </>
  );
}
