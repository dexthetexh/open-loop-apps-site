// pages/games/tap-escape-speedrun.js
import Link from "next/link";

export default function TapEscapeSpeedrun() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Tap Escape Speedrun</h1>

      <p style={styles.paragraph}>
        A short-session, replay-focused tap game built around speedrun-style progression: fail fast,
        retry instantly, beat your best.
      </p>

      <div style={styles.section}>
        <h2 style={styles.h2}>MVP Features</h2>
        <ul style={styles.list}>
          <li>10–60 second runs</li>
          <li>Difficulty ramps during each run</li>
          <li>Best time tracked locally</li>
          <li>Offline-friendly by default</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.h2}>Download</h2>
        <p style={styles.paragraphSmall}>
          Replace this placeholder with your Google Play URL when the listing is live.
        </p>
        <a
          href="#"
          style={styles.primaryButton}
          onClick={(e) => e.preventDefault()}
          aria-disabled="true"
        >
          Google Play (coming soon)
        </a>
      </div>

      <div style={styles.footerNav}>
        <Link href="/games" style={styles.link}>
          ← Back to Games
        </Link>
        <Link href="/" style={styles.link}>
          Home
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
    margin: "0 0 18px 0",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  paragraphSmall: {
    margin: "0 0 12px 0",
    color: "#94a3b8",
    lineHeight: 1.6,
    fontSize: "14px",
  },
  section: {
    backgroundColor: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "14px",
  },
  h2: {
    margin: "0 0 10px 0",
    fontSize: "20px",
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  primaryButton: {
    display: "inline-block",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 700,
    opacity: 0.75,
    cursor: "not-allowed",
  },
  footerNav: {
    display: "flex",
    gap: "14px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  link: {
    color: "#cbd5e1",
    textDecoration: "none",
  },
};
