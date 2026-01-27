import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Open Loop Apps</h1>
      <p style={styles.paragraph}>
        Open Loop Apps builds lightweight games with clear loops and long-term maintainability.
        This site is the stable shell; games run as self-contained web apps.
      </p>

      <div style={styles.card}>
        <h2 style={styles.h2}>Play</h2>
        <p style={styles.paragraph}>
          Browse the catalog and launch games instantly in your browser.
        </p>
        <Link href="/games" style={styles.primaryButton}>
          View Games
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
  heading: { fontSize: "40px", margin: "0 0 12px 0" },
  h2: { margin: "0 0 10px 0" },
  paragraph: { color: "#cbd5e1", lineHeight: 1.7, margin: "0 0 14px 0" },
  card: {
    backgroundColor: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "18px",
  },
  primaryButton: {
    display: "inline-block",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 700,
  },
};
