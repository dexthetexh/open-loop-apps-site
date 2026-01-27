// pages/games/index.js
import Link from "next/link";

export default function GamesIndex() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Games</h1>
      <p style={styles.paragraph}>
        Current releases and prototypes from Open Loop Apps.
      </p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.title}>Idle Cyber Defense</h2>
          <p style={styles.text}>
            Earn Threat Points over time by deploying Sensors and Firewalls. Upgrade your network and
            collect offline earnings.
          </p>
          <Link href="/games/idle-cyber-defense" style={styles.cardLink}>
            View details →
          </Link>
        </div>

        <div style={styles.card}>
          <h2 style={styles.title}>Tap Escape Speedrun</h2>
          <p style={styles.text}>
            Short, replay-focused sessions built around tapping precision and speedrun retries.
          </p>
          <Link href="/games/tap-escape-speedrun" style={styles.cardLink}>
            View details →
          </Link>
        </div>
      </div>

      <div style={styles.footerNav}>
        <Link href="/" style={styles.backLink}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "32px 20px",
    color: "#e5e7eb",
  },
  heading: {
    fontSize: "34px",
    margin: "0 0 10px 0",
  },
  paragraph: {
    margin: "0 0 22px 0",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px",
  },
  card: {
    backgroundColor: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "18px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "22px",
  },
  text: {
    margin: "0 0 12px 0",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  cardLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontWeight: 700,
  },
  footerNav: {
    marginTop: "18px",
  },
  backLink: {
    color: "#cbd5e1",
    textDecoration: "none",
  },
};
