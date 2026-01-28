export default function EchoKeysPage() {
  return (
    <div style={{ padding: 16, color: "#e5e7eb" }}>
      <h1 style={{ marginBottom: 6 }}>EchoKeys</h1>
      <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>
        NoteLoop Series • Codename: EchoKeys-NoteLoop
      </div>

      {/* Tasteful ad slot (outside iframe) */}
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
        }}
      >
        <iframe
          src="/play/echokeys/index.html"
          title="EchoKeys"
          style={{ width: "100%", height: "100%", border: 0 }}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
