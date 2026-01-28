// File: /pages/play/[slug].js
import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

// Maintain this list to control what gets statically generated.
const GAMES = [
  { slug: "echokeys", title: "EchoKeys", desc: "Fast ear-training drills and reaction challenges." },
  { slug: "pixel-diner", title: "Pixel Diner", desc: "Serve, upgrade, and survive the rush." },
  { slug: "echokeys-scaletrainer", title: "EchoKeys ScaleTrainer", desc: "Practice scales by pattern, tempo, and accuracy." },
  { slug: "flappy-bird", title: "Flappy Bird", desc: "A lightweight arcade tap classic." },
  // These two are placeholders; keep them out of /play
  // { slug: "idle-cyber-defense", ... }
  // { slug: "tap-escape-speedrun", ... }
];

export async function getStaticPaths() {
  return {
    paths: GAMES.map((g) => ({ params: { slug: g.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const game = GAMES.find((g) => g.slug === params.slug);
  return { props: { game } };
}

export default function PlaySlugPage({ game }) {
  const canonical = `${CANONICAL_BASE}/play/${game.slug}`;
  const iframeSrc = `/play/${game.slug}/index.html`;

  return (
    <>
      <Head>
        <title>{game.title} | Open Loop Apps</title>
        <meta name="description" content={game.desc} />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">{game.title}</h1>
          <p className="subtitle">{game.desc}</p>
          <p className="smallNote">
            <Link href={`/games/${game.slug}`}>← Back to game page</Link>{" "}
            · <Link href="/games">Games</Link>
          </p>
        </header>

        {/* AdSense-safe: no ads on gameplay pages */}
        <div className="gameFrameWrap" role="region" aria-label={`${game.title} game`}>
          <iframe
            className="gameFrame"
            src={iframeSrc}
            title={game.title}
            loading="eager"
            allow="fullscreen; gamepad; autoplay"
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
