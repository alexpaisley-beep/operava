import { ImageResponse } from "next/og";

export const alt =
  "Operava — custom software for landscaping companies that have outgrown generic tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social card. Rendered at build time from the brand palette rather
 * than shipped as a binary, so it stays in sync with the site.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a1526",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", position: "relative", width: 64, height: 64 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 64,
                border: "9px solid #ffffff",
                display: "flex",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -4,
                right: -8,
                width: 34,
                height: 34,
                borderRadius: "0 100% 0 100%",
                background: "linear-gradient(135deg, #9ed13f 0%, #4ea33f 100%)",
                display: "flex",
              }}
            />
          </div>
          <div style={{ display: "flex", color: "#ffffff", fontSize: 40, letterSpacing: -1.4 }}>
            Operava
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: 66,
              lineHeight: 1.08,
              letterSpacing: -2.6,
              maxWidth: 960,
            }}
          >
            Custom software for landscaping companies that have outgrown generic tools.
          </div>
          <div
            style={{
              display: "flex",
              color: "#c3d2e6",
              fontSize: 27,
              marginTop: 26,
              maxWidth: 880,
              lineHeight: 1.4,
            }}
          >
            Built around your workflows, crews, estimating and integrations — not somebody
            else&rsquo;s CRM.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", width: 56, height: 4, background: "#8dc63f" }} />
          <div style={{ display: "flex", color: "#c3d2e6", fontSize: 24 }}>
            Custom builds from $6,000
          </div>
        </div>
      </div>
    ),
    size,
  );
}
