import { ImageResponse } from "next/og";

export const alt = "LiveCam Global — Verified Live Webcams Around the World";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PREVIEW_CARDS = [
  { city: "Tokyo", label: "Shibuya Crossing", tag: "CITY", temp: "14°C" },
  { city: "Namib Desert", label: "Savanna Waterhole", tag: "WILDLIFE", temp: "24°C" },
  { city: "Zermatt", label: "Matterhorn Peak", tag: "ALPINE", temp: "-4°C" },
  { city: "New York", label: "Times Square", tag: "LIVE 24/7", temp: "11°C" },
];

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
          padding: "56px 64px",
          background: "linear-gradient(135deg, #090d16 0%, #0f172a 45%, #172554 80%, #0369a1 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top Row: Brand Logo + Live Pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="og-bg" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="55%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#4338CA" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#og-bg)" />
              <circle cx="32" cy="32" r="16" stroke="#FFFFFF" strokeWidth="2.6" />
              <ellipse cx="32" cy="32" rx="7.5" ry="16" stroke="#FFFFFF" strokeOpacity="0.72" strokeWidth="2" />
              <path d="M16.5 32H47.5" stroke="#FFFFFF" strokeOpacity="0.72" strokeWidth="2" />
              <circle cx="32" cy="32" r="4.2" fill="#FFFFFF" />
              <circle cx="48" cy="16" r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2.2" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                LiveCam Global
              </div>
              <div style={{ fontSize: "16px", color: "#93c5fd" }}>
                Verified 24/7 Scenic Live Webcams
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 18px",
              borderRadius: "9999px",
              background: "rgba(239, 68, 68, 0.16)",
              border: "1px solid rgba(248, 113, 113, 0.45)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#fecaca",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "9999px",
                background: "#ef4444",
              }}
            />
            LIVE WORLDWIDE
          </div>
        </div>

        {/* Middle Row: Hero Copy + Mini Live Preview Grid */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "44px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "580px" }}>
            <div style={{ fontSize: "52px", fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.03em" }}>
              Explore the World in Real Time
            </div>
            <div style={{ fontSize: "22px", color: "#cbd5e1", lineHeight: 1.45 }}>
              Watch official scenic webcams across cities, beaches, mountains, and wildlife reserves with live local time and weather.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
              width: "440px",
            }}
          >
            {PREVIEW_CARDS.map((card) => (
              <div
                key={card.city}
                style={{
                  width: "213px",
                  padding: "18px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#fca5a5",
                    }}
                  >
                    <div
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "9999px",
                        background: "#ef4444",
                      }}
                    />
                    {card.tag}
                  </div>
                  <div style={{ fontSize: "13px", color: "#bae6fd", fontWeight: 600 }}>
                    {card.temp}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                    {card.city}
                  </div>
                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                    {card.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "18px",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: "17px",
            color: "#94a3b8",
          }}
        >
          <div>Official Embeds · HLS &amp; Live Snapshots · Real-Time Weather</div>
          <div style={{ color: "#e2e8f0", fontWeight: 600 }}>LiveCam Global</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
