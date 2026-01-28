export default function EchoKeysScaleTrainerPage() {
  return (
    <div style={{ padding: 16, color: "#e5e7eb", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>EchoKeys: ScaleTrainer</h1>

      <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>
        NoteLoop Series • Training mode • Codename: EchoKeys-NoteLoop
      </div>

      {/* Tasteful ad slot (wrapper-only) */}
      <div
        id="ad-top"
        style={{
          margin: "12px 0",
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

      <div
        style={{
          width: "100%",
          height: "80vh",
          border: "1px solid #1e293b",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(15, 23, 42, 0.35)",
        }}
      >
        <iframe
          src="/play/echokeys-scaletrainer/index.html"
          title="EchoKeys ScaleTrainer"
          style={{ width: "100%", height: "100%", border: 0 }}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          allow="fullscreen"
        />
      </div>

      <div style={{ marginTop: 14, color: "#94a3b8", fontSize: 12, lineHeight: 1.4 }}>
        If this wrapper loads but the trainer is blank, open the direct link:
        <span style={{ color: "#94a3b8" }}> </span>
        <a href="/play/echokeys-scaletrainer/index.html" style={{ color: "#93c5fd", textDecoration: "none" }}>
          /play/echokeys-scaletrainer/index.html
        </a>
      </div>
    </div>
  );
}
