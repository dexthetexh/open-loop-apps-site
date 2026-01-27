import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Open Loop Apps</h1>

      <p style={styles.paragraph}>
        Open Loop Apps builds small, focused Android games with clear progression
        loops, offline-friendly mechanics, and fast iteration.
      </p>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Current Projects</h2>

        <ul style={styles.list}>
          <li>
            <strong>Idle Cyber Defense</strong> — idle progression with Sensors,
            Firewalls, and offline earnings.
          </li>
          <li>
            <strong>Tap Escape Speedrun</strong> — short, skill-based tap sessions
            designed for replay.
          </li>
        </ul>

        <div style={styles.actions}>
          <Link href="/games" style={styles.primaryButton}>
            View Games
          </Link>
        </div>
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
    fontSize: "40px",
    marginBottom: "12px",
  },
  paragraph: {
    color: "#cbd5e1",
    lineHeight: 1.6,
    marginBottom: "20px",
  },
  card: {
    backgroundColor: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "22px",
    marginBottom: "12px",
  },
  list: {
    paddingLeft: "20px",
    color: "#cbd5e1",
  },
  actions: {
    marginTop: "16px",
  },
  primaryButton: {
    display: "inline-block",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 600,
  },
};
