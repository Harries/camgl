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
                <linearGradient id="og-body" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0F172A" />
                  <stop offset="55%" stopColor="#1E3A8A" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="og-glass" x1="22" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#og-body)" />
              <path d="M15 22V17C15 15.8954 15.8954 15 17 15H22" stroke="#E0F2FE" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M15 42V47C15 48.1046 15.8954 49 17 49H22" stroke="#E0F2FE" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M42 49H47C48.1046 49 49 48.1046 49 47V42" stroke="#E0F2FE" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="32" cy="32" r="12.5" stroke="#FFFFFF" strokeWidth="2.6" />
              <circle cx="32" cy="32" r="8.2" fill="url(#og-glass)" />
              <circle cx="32" cy="32" r="3.4" fill="#0F172A" />
              <circle cx="29" cy="28.5" r="2.1" fill="#FFFFFF" fillOpacity="0.85" />
              <circle cx="47.5" cy="16.5" r="4.8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.8" />
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
