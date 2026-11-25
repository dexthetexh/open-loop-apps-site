import Link from "next/link";
import Seo from "../../components/Seo";
import GameEmbed from "../../components/GameEmbed";
import AdSlot from "../../components/ads/AdSlot";
import { ALL_GAMES, getGameBySlug, getPrevNext, playPath } from "../../lib/games";
import { SITE, absoluteUrl } from "../../lib/site";

export function getStaticPaths() {
  return { paths: ALL_GAMES.map((g) => ({ params: { slug: g.slug } })), fallback: false };
}

export function getStaticProps({ params }) {
  const game = getGameBySlug(params.slug);
  const { prev, next } = getPrevNext(game.slug);
  return { props: { game, prev: prev && pick(prev), next: next && pick(next) } };
}

const pick = (g) => ({ slug: g.slug, title: g.title });

export default function GamePage({ game, prev, next }) {
  const web = Boolean(game.platforms.web);
  const android = game.platforms.android;
  const path = `/games/${game.slug}`;

  return (
    <>
      <Seo
        title={web ? `${game.title}: play free in your browser` : game.title}
        description={`${game.tagline} ${game.description}`}
        path={path}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: game.title,
          description: game.description,
          url: absoluteUrl(path),
          genre: game.genre,
          gamePlatform: [web && "Web browser", android && "Android"].filter(Boolean),
          applicationCategory: "Game",
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          ...(web ? { playMode: "SinglePlayer", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}),
        }}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/games">Games</Link> <span aria-hidden="true">/</span> <span>{game.title}</span>
      </nav>

      <header className="pageHead" style={{ "--accent": game.accent }}>
        <h1 className="h1">{game.title}</h1>
        <p className="lead">{game.tagline}</p>
      </header>

      {web ? (
        <GameEmbed game={game} />
      ) : (
        <section className="panel">
          <h2 className="h2">Coming soon</h2>
          <p>{game.description}</p>
          <p className="muted">The Play Store link will appear here at launch.</p>
        </section>
      )}

      <section className="about">
        <div>
          <h2 className="h2">About</h2>
          <p>{game.description}</p>
          {android === "coming-soon" && web ? (
            <p className="muted">An Android version is in the works.</p>
          ) : null}
        </div>
        {game.controls.length ? (
          <div>
            <h2 className="h2">Controls</h2>
            <ul className="list">
              {game.controls.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <AdSlot slot="game" />

      <nav className="pager" aria-label="More games">
        {prev ? <Link href={`/games/${prev.slug}`}>← {prev.title}</Link> : <span />}
        {next ? <Link href={`/games/${next.slug}`}>{next.title} →</Link> : <span />}
      </nav>
    </>
  );
}
