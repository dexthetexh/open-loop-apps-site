import Link from "next/link";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <span style={styles.text}>
          © {new Date().getFullYear()} Open Loop Apps
        </span>

        <div style={styles.links}>
          <Link href="/" style={styles.link}>
            Home
          </Link>
          <Link href="/games" style={styles.link}>
            Games
          </Link>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    borderTop: "1px solid #1e293b",
    padding: "16px 0",
    backgroundColor: "#020617",
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  text: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  links: {
    display: "flex",
    gap: "14px",
  },
  link: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "14px",
  },
};
