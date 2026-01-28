import Link from "next/link";

const GAMES = [
  { slug: "pixel-diner", name: "Pixel Diner", series: "Open Loop Apps", codename: null, note: "Match orders. Beat the clock." },
  { slug: "flappy-bird", name: "Flappy Bird", series: "Open Loop Apps", codename: null, note: "Quick reflex loop." },
  { slug: "idle-cyber-defense", name: "Idle Cyber Defense", series: "Open Loop Apps", codename: null, note: "Idle progression loop." },
  { slug: "tap-escape-speedrun", name: "Tap Escape Speedrun", series: "Open Loop Apps", codename: null, note: "Fast taps. Faster runs." },

  // NoteLoop Series
  { slug: "echokeys", name: "EchoKeys", series: "NoteLoop Series", codename: "EchoKeys-NoteLoop", note: "Musical memory loop." },
  {
    slug: "echokeys-scaletrainer",
    name: "EchoKeys: ScaleTrainer",
    series: "NoteLoop Series",
    codename: "EchoKeys-NoteLoop",
    note: "Training mode: scales + ear training loop.",
  },
];

function Card({ g }) {
  return (
    <div
      style={{
        border: "1px solid #1e293b",
        borderRadius: 16,
        padding: 14,
        background: "rgba(15, 23, 42, 0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{g.name}</h2>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{g.series}</span>
      </div>

      {g.codename ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
          Codename: <span style={{ color: "#e5e7eb" }}>{g.codename}</span>
        </div>
      ) : null}

      <p style={{ margin: "10px 0 12px 0", color: "#cbd5e1", lineHeight: 1.4, fontSize: 13 }}>{g.note}</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link
          href={`/games/${g.slug}`}
          style={{
            display: "inline-block",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #1e293b",
            color: "#e5e7eb",
            textDecoration: "none",
          }}
        >
          Play
        </Link>

        <a
          href={`/play/${g.slug}/index.html`}
          style={{
            display: "inline-block",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #1e293b",
            color: "#94a3b8",
            textDecoration: "none",
          }}
        >
          Direct
        </a>
      </div>
    </div>
  );
}

export default function GamesHub() {
  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto", color: "#e5e7eb" }}>
      <h1 style={{ margin: "8px 0 6px 0" }}>Open Loop Apps</h1>
      <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.5 }}>Short-session web games. No accounts. Fast loops.</p>

      {/* Tasteful hub-only ad slot placeholder */}
      <div
        id="ad-top"
        style={{
          margin: "14px 0",
          minHeight: 90,
          border: "1px solid #1e293b",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: 12,
          background: "rgba(15, 23, 42, 0.35)",
        }}
        aria-label="Advertisement"
      >
        Ad slot
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {GAMES.map((g) => (
          <Card key={g.slug} g={g} />
        ))}
      </div>

      <div style={{ marginTop: 18, color: "#94a3b8", fontSize: 12 }}>
        If a wrapper page loads but a game is blank, use the “Direct” link to isolate iframe vs asset issues.
      </div>
    </div>
  );
}
