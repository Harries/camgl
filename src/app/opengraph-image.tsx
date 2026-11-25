import { ImageResponse } from "next/og";

export const alt = "LiveCam Global — Verified Live Webcams Around the World";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0284c7 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            ●
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              LiveCam Global
            </div>
            <div style={{ fontSize: "18px", color: "#bae6fd" }}>
              Verified 24/7 Scenic Live Webcams
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "960px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#fecaca",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "9999px",
                background: "#ef4444",
              }}
            />
            LIVE STREAMS · REAL-TIME WEATHER · WORLD EXPLORER
          </div>
          <div style={{ fontSize: "56px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
            Explore the World in Real Time
          </div>
          <div style={{ fontSize: "24px", color: "#cbd5e1", lineHeight: 1.4 }}>
            Watch official scenic webcams across cities, beaches, mountains, and wildlife reserves with live local time &amp; weather.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", color: "#94a3b8" }}>
          <div>100% Official Embeds · Free &amp; No Login Required</div>
          <div>livecam.global</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
