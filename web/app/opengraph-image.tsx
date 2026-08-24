import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f2efe7",
          border: "18px solid #151515",
          color: "#151515",
          padding: 56,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, fontWeight: 700 }}>
          <span>808bytes</span>
          <span style={{ color: "#b34b44", letterSpacing: 4, textTransform: "uppercase" }}>Interactive Sound Shop</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 118, lineHeight: 0.9, fontWeight: 900 }}>808bytes</div>
          <div style={{ fontSize: 96, lineHeight: 1, fontWeight: 900, color: "#3b3b38" }}>workstation</div>
          <div style={{ marginTop: 32, maxWidth: 760, fontSize: 34, lineHeight: 1.25, color: "#5f605c" }}>
            Sauce packs, digital downloads, and a playable browser beat sketchpad.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["Plugins", "Packs", "One-shots", "Free downloads"].map((item) => (
            <span key={item} style={{ border: "2px solid #151515", padding: "10px 16px", fontSize: 24, fontWeight: 700 }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
