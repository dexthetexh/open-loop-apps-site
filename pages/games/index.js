import Seo from "../../components/Seo";
import GameCard from "../../components/GameCard";
import AdSlot from "../../components/ads/AdSlot";
import { ALL_GAMES } from "../../lib/games";
import { absoluteUrl } from "../../lib/site";

export default function GamesIndex() {
  const web = ALL_GAMES.filter((g) => g.platforms.web);
  const soon = ALL_GAMES.filter((g) => !g.platforms.web);
  return (
    <>
      <Seo
        title="Games"
        path="/games"
        description="Browse free browser games from Open Loop Apps: fishing, music training, arcade speedruns and more."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: ALL_GAMES.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/games/${g.slug}`),
            name: g.title,
          })),
        }}
      />
      <header className="pageHead">
        <h1 className="h1">Games</h1>
        <p className="lead">Everything here runs in your browser. Tap a card to play.</p>
      </header>

      <div className="grid">
        {web.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>

      <AdSlot slot="catalog" />

      {soon.length ? (
        <section aria-labelledby="coming-soon">
          <h2 id="coming-soon" className="h2">Coming to Android</h2>
          <div className="grid">
            {soon.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
