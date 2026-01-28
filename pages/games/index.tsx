import AdSlot from "../../components/ads/AdSlot";

const SHOW_GAMES_ADS = true;

export default function GamesPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem" }}>
      <h1>Games</h1>

      {SHOW_GAMES_ADS && (
        <AdSlot
          slot="1234567890"
          className="ad-slot ad-slot-top"
          style={{ minHeight: 120 }}
        />
      )}

      <section style={{ marginTop: "2rem" }}>
        {/* existing games UI */}
      </section>

      {SHOW_GAMES_ADS && (
        <AdSlot
          slot="2345678901"
          className="ad-slot ad-slot-mid"
          style={{ minHeight: 120 }}
        />
      )}

      {SHOW_GAMES_ADS && (
        <AdSlot
          slot="3456789012"
          className="ad-slot ad-slot-bottom"
          style={{ minHeight: 120 }}
        />
      )}
    </main>
  );
}
