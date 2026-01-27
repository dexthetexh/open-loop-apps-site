import Link from "next/link";

export default function GamesIndex() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Games</h1>
      <p style={styles.paragraph}>
        These games run as static web apps under <code style={styles.code}>/public/games</code>.
        The Next.js layer only links and wraps them.
      </p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.title}>Flappy Bird (Open Loop Apps)</h2>
          <p style={styles.text}>
            Long-lived implementation: served as a standalone web app and embedded here.
          </p>
          <Link href="/games/flappy-bird" style={styles.cardLink}>
            Play →
          </Link>
        </div>

        <div style={styles.card}>
          <h2 style={styles.title}>Pixel Diner</h2>
          <p style={styles.text}>
            Standalone HTML game served from public assets and embedded here.
          </p>
          <Link href="/games/pixel-diner" style={styles.cardLink}>
            Play →
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "960px", margin: "0 auto", padding: "32px 20px", color: "#e5e7eb" },
  heading: { fontSize: "34px", margin: "0 0 10px 0" },
  paragraph: { margin: "0 0 22px 0", color: "#cbd5e1", lineHeight: 1.7 },
  code: { color: "#93c5fd" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" },
  card: { backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" },
  title: { margin: "0 0 8px 0", fontSize: "22px" },
  text: { margin: "0 0 12px 0", color: "#cbd5e1", lineHeight: 1.6 },
  cardLink: { color: "#93c5fd", textDecoration: "none", fontWeight: 800 },
};
