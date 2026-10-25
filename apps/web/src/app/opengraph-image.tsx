import { ImageResponse } from "next/og";

export const alt = "ClipMax — long video in, a week of clips out.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#08090a",
        color: "#f4f4f5",
        padding: "64px 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -240,
          right: -160,
          width: 760,
          height: 760,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(21,94,239,0.55), rgba(21,94,239,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -280,
          left: -120,
          width: 620,
          height: 620,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(155,231,255,0.18), rgba(155,231,255,0))",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "#155eef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          C
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1 }}>ClipMax</span>
          <span style={{ fontSize: 13, letterSpacing: 4, color: "#9be7ff" }}>STUDIO</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
        <div style={{ fontSize: 74, lineHeight: 0.98, letterSpacing: -4, fontWeight: 600 }}>
          Long video in.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            fontSize: 74,
            lineHeight: 1.02,
            letterSpacing: -4,
            fontWeight: 600,
          }}
        >
          <span>A week of clips</span>
          <span style={{ color: "#9be7ff", fontStyle: "italic", fontWeight: 400 }}>out.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 22, color: "#a1a1aa", letterSpacing: -0.2 }}>
          Hook detection · 9:16 crop · word-level captions · private storage
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          paddingTop: 22,
          fontSize: 14,
          letterSpacing: 2,
          color: "#71717a",
        }}
      >
        <span>CLIPMAX · PRIVATE BETA</span>
        <span style={{ color: "#9be7ff" }}>ONE RECORDING. A WEEK OF POSTS.</span>
      </div>
    </div>,
    size,
  );
}
