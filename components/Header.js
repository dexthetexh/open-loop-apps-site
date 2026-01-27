import Link from "next/link";

export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link href="/" style={styles.brand}>
          Open Loop Apps
        </Link>

        <nav style={styles.nav}>
          <Link href="/" style={styles.link}>
            Home
          </Link>
          <Link href="/games" style={styles.link}>
            Games
          </Link>
          <Link href="/privacy" style={styles.link}>
            Privacy
          </Link>
          <Link href="/contact" style={styles.link}>
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    borderBottom: "1px solid #1e293b",
    backgroundColor: "#020617",
    padding: "16px 0",
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  brand: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#e5e7eb",
    textDecoration: "none",
  },
  nav: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },
  link: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "14px",
  },
};
