import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

// Branded social-share image (1200×630). Statically generated at build, so
// production serves a static file with no runtime image generation.
export const runtime = "nodejs";
export const alt = `${SITE.name} — ${SITE.city}, ${SITE.region}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #3a0d10 0%, #1a0608 35%, #070707 70%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, letterSpacing: 6, color: "#FF6B6F", fontWeight: 700 }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: "#E31E24" }} />
          {SITE.frequency} · {SITE.city.toUpperCase()} · {SITE.region.toUpperCase()}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
          <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 0.95, letterSpacing: -2 }}>LA MEGA</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#E31E24", lineHeight: 1 }}>99.9 FM</div>
        </div>

        <div style={{ fontSize: 38, fontWeight: 700, marginTop: 28, color: "#f2f2f2" }}>
          {SITE.slogan}
        </div>

        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            marginTop: 36,
            fontSize: 26,
            fontWeight: 700,
            color: "#ffffff",
            border: "2px solid rgba(227,30,36,0.7)",
            borderRadius: 14,
            padding: "12px 22px",
            background: "rgba(227,30,36,0.12)",
          }}
        >
          La 1ª emisora con su propio sistema creado con IA
        </div>
      </div>
    ),
    size,
  );
}
