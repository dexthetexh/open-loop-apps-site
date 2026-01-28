import Link from "next/link";
export default function Contact() {
  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto", color: "#e5e7eb" }}>
      <h1 style={{ margin: "8px 0" }}>Contact</h1>
      <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
        Support, feedback, and business inquiries for Open Loop Apps.
      </p>
      <h2 style={{ marginTop: 16 }}>Email</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
        <a href="mailto:contact@openloopapps.com" style={{ color: "#93c5fd", textDecoration: "none" }}>
          openloopapps@proton.me
        </a>
      </p>
      <h2 style={{ marginTop: 16 }}>Include</h2>
      <ul style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
        <li>Which game (EchoKeys, Pixel Diner, etc.)</li>
        <li>Device + browser</li>
        <li>What you expected vs what happened</li>
        <li>Screenshot if possible</li>
      </ul>
      <div style={{ marginTop: 18 }}>
        <Link href="/privacy" style={{ color: "#93c5fd", textDecoration: "none" }}>
          Privacy
        </Link>
        <span style={{ color: "#94a3b8" }}> • </span>
        <Link href="/games" style={{ color: "#93c5fd", textDecoration: "none" }}>
          Games
        </Link>
      </div>
      <div style={{ marginTop: 18, color: "#94a3b8", fontSize: 12 }}>© 2026 Open Loop Apps</div>
    </div>
  );
}