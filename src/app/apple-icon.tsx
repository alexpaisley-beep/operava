import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the mark on brand navy, so it reads at small sizes. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e3a66",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 104, height: 104 }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 104,
              border: "15px solid #ffffff",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -6,
              right: -12,
              width: 56,
              height: 56,
              borderRadius: "0 100% 0 100%",
              background: "linear-gradient(135deg, #9ed13f 0%, #4ea33f 100%)",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
