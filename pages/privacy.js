import Link from "next/link";

export default function Privacy() {
  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto", color: "#e5e7eb" }}>
      <h1 style={{ margin: "8px 0" }}>Privacy</h1>

      <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
        Open Loop Apps hosts small web games. We do not require accounts. Game progress (like best scores)
        may be stored locally in your browser using localStorage.
      </p>

      <h2 style={{ marginTop: 16 }}>What we collect</h2>
      <ul style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
        <li><b>Local game data:</b> Scores/settings stored on your device (localStorage).</li>
        <li><b>Server logs:</b> Standard request logs from hosting/CDN may be generated for security and performance.</li>
      </ul>

      <h2 style={{ marginTop: 16 }}>Advertising</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
        If ads are enabled on wrapper pages (e.g., /games/*), ad providers may use cookies or similar technologies
        to serve and measure ads. This page will be updated with provider details once enabled.
      </p>

      <h2 style={{ marginTop: 16 }}>Contact</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
        Questions? Use the contact page.
      </p>

      <div style={{ marginTop: 18 }}>
        <Link href="/contact" style={{ color: "#93c5fd", textDecoration: "none" }}>
          Go to Contact
        </Link>
        <span style={{ color: "#94a3b8" }}> • </span>
        <Link href="/games" style={{ color: "#93c5fd", textDecoration: "none" }}>
          View Games
        </Link>
      </div>

      <div style={{ marginTop: 18, color: "#94a3b8", fontSize: 12 }}>© 2026 Open Loop Apps</div>
    </div>
  );
}
