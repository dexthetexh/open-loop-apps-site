import Link from "next/link";
import Seo from "../components/Seo";
import GameCard from "../components/GameCard";
import AdSlot from "../components/ads/AdSlot";
import { WEB_GAMES, playPath } from "../lib/games";
import { SITE } from "../lib/site";

export default function Home() {
  const featured = WEB_GAMES[0];
  return (
    <>
      <Seo
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: SITE.url,
          description: SITE.description,
        }}
      />

      <section className="hero">
        <h1 className="h1">Small games with tight loops.</h1>
        <p className="lead">
          Free to play in your browser. No accounts, no installs. Progress is saved on your device.
        </p>
        <div className="heroActions">
          <Link className="btn btnPrimary" href={playPath(featured.slug)}>
            Play {featured.title}
          </Link>
          <Link className="btn btnGhost" href="/games">
            All games
          </Link>
        </div>
      </section>

      <section aria-labelledby="play-now">
        <h2 id="play-now" className="h2">Play now</h2>
        <div className="grid">
          {WEB_GAMES.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <AdSlot placement="home_inline" />

      <section className="facts" aria-label="How it works">
        <div><strong>Instant</strong><span>Opens in a tab. Works on phone and desktop.</span></div>
        <div><strong>Private</strong><span>No sign-up. Saves stay in your browser.</span></div>
        <div><strong>Offline-friendly</strong><span>Games are self-contained and lightweight.</span></div>
      </section>
    </>
  );
}
