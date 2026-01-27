export default function PixelDinerPage() {
  return (
    <div style={{ padding: 16, color: "#e5e7eb" }}>
      <h1 style={{ marginBottom: 12 }}>Pixel Diner</h1>

      {/* Tasteful ad slot (outside the game iframe) */}
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

      <div style={{ width: "100%", height: "80vh", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
        <iframe
          src="/play/pixel-diner/index.html"
          title="Pixel Diner"
          style={{ width: "100%", height: "100%", border: 0 }}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
