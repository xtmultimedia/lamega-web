"use client";

import React, { useState } from "react";
import { Icon, Section, SectionHead, Bloom, SOCIAL } from "@/components/ui";

function FeedShell({
  platform,
  color,
  handle,
  followers,
  children,
}: {
  platform: string;
  color: string;
  handle: string;
  followers: string;
  children: React.ReactNode;
}) {
  const [h, setH] = useState(false);
  const s = SOCIAL[platform];
  return (
    <div
      className="reveal glass"
      style={{
        borderRadius: "var(--r-md)", overflow: "hidden", display: "flex", flexDirection: "column",
        transition: "all var(--dur) var(--ease-out)", transform: h ? "translateY(-5px)" : "none",
        boxShadow: h ? `0 0 30px ${color}33, var(--shadow-lg)` : "var(--shadow-md)",
        border: h ? `1px solid ${color}66` : "1px solid var(--glass-border)",
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--line-1)" }}>
        <span
          style={{
            width: 40, height: 40, borderRadius: "50%", background: `${color}22`, border: `1px solid ${color}66`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d={s.path} /></svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{handle}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{followers} seguidores</div>
        </div>
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em",
            padding: "8px 16px", borderRadius: "var(--r-pill)", color: "#fff", whiteSpace: "nowrap",
            background: h ? color : "transparent", border: `1px solid ${color}`, transition: "all var(--dur)",
          }}
        >
          Seguir
        </a>
      </div>
      {children}
    </div>
  );
}

export function Social() {
  const ig = "#E1306C", tt = "#fff", fb = SOCIAL.facebook.color;
  return (
    <Section id="social" style={{ background: "var(--bg-1)", borderTop: "1px solid var(--line-1)" }}>
      <Bloom x="40%" y="-10%" size={520} color="rgba(227,30,36,0.10)" />
      <SectionHead
        align="center"
        index="05"
        kicker="NACIÓN MEGA"
        title={<>Síguenos en <span style={{ color: "var(--red)" }}>Redes</span></>}
        lead="Más de 35 mil seguidores viven La Mega cada día en Imbabura y el mundo. Únete a la conversación."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }} className="social-grid">
        {/* Instagram */}
        <FeedShell platform="instagram" color={ig} handle="@lamega99.9ecuador" followers="15.6K">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, padding: 3 }}>
            {[
              ["#E31E24", "#7A1FC4"], ["#1683C8", "#E31E24"], ["#D0307A", "#FF2D34"],
              ["#FF2D34", "#8E0F13"], ["#7A1FC4", "#1683C8"], ["#E31E24", "#D0307A"],
            ].map((g, i) => (
              <div key={i} style={{ aspectRatio: "1", background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 25%, rgba(255,255,255,0.18), transparent 55%)" }} />
                {i === 0 && (
                  <span style={{ position: "absolute", top: 6, right: 6 }}>
                    <Icon name="play" size={14} color="#fff" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </FeedShell>

        {/* TikTok */}
        <FeedShell platform="tiktok" color={tt} handle="@lamega99.9ecuador" followers="12.3K">
          <div
            style={{
              position: "relative", aspectRatio: "3/4", background: "linear-gradient(160deg, #25F4EE22, #FE2C5522 60%, #0a0a0a)",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", margin: 3, borderRadius: "var(--r-sm)",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.10), transparent 55%)" }} />
            <span
              style={{
                width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="play" size={28} color="#fff" strokeWidth={2.2} style={{ marginLeft: 3 }} />
            </span>
            <div style={{ position: "absolute", right: 12, bottom: 16, display: "flex", flexDirection: "column", gap: 16, alignItems: "center", color: "#fff" }}>
              <span style={{ textAlign: "center" }}>
                <Icon name="heart" size={24} /><span className="mono" style={{ display: "block", fontSize: 10 }}>48K</span>
              </span>
              <span style={{ textAlign: "center" }}>
                <Icon name="message-circle" size={24} /><span className="mono" style={{ display: "block", fontSize: 10 }}>1.2K</span>
              </span>
              <span style={{ textAlign: "center" }}>
                <Icon name="share-2" size={24} /><span className="mono" style={{ display: "block", fontSize: 10 }}>3.4K</span>
              </span>
            </div>
            <div className="mono" style={{ position: "absolute", left: 12, bottom: 14, fontSize: 11, color: "#fff" }}>
              ♪ Detrás de cámaras · El Ganado
            </div>
          </div>
        </FeedShell>

        {/* Facebook Live */}
        <FeedShell platform="facebook" color={fb} handle="La Mega 99.9 Ecuador" followers="7.5K">
          <div
            style={{
              position: "relative", aspectRatio: "16/10", background: "radial-gradient(120% 120% at 50% 0%, #16213e, #0a0a0a)",
              margin: 3, borderRadius: "var(--r-sm)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 6,
                background: "var(--red)", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10,
                letterSpacing: "0.1em", padding: "4px 9px", borderRadius: 4,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse-dot 1.3s infinite" }} />
              LIVE
            </div>
            <span
              style={{
                width: 58, height: 58, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="play" size={26} color="#fff" strokeWidth={2.2} style={{ marginLeft: 2 }} />
            </span>
            <div
              className="mono"
              style={{ position: "absolute", right: 10, bottom: 10, fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: 4 }}
            >
              ● 892 viendo
            </div>
          </div>
          <div style={{ padding: "12px 16px 16px" }}>
            <div style={{ fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.4 }}>
              Transmitiendo en vivo: <strong style={{ color: "#fff" }}>El Ganado</strong> con sorteo de entradas 🎟️
            </div>
          </div>
        </FeedShell>
      </div>
      <style>{`@media (max-width: 880px){ .social-grid{ grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; } }`}</style>
    </Section>
  );
}
