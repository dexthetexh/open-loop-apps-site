export default function PixelDinerPage() {
  return (
    <div style={{ padding: 16, color: "#e5e7eb" }}>
      <h1 style={{ marginBottom: 12 }}>Pixel Diner</h1>

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
          src="/_play/pixel-diner/index.html"
          title="Pixel Diner"
          style={{ width: "100%", height: "100%", border: 0 }}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
        />
      </div>
    </div>
  );
}
