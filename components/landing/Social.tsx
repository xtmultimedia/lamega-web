"use client";

import React, { useState } from "react";
import { Section, SectionHead, Bloom, SOCIAL } from "@/components/ui";

const NETWORKS = [
  { key: "instagram", label: "Instagram",  handle: "@lamega99.9ecuador" },
  { key: "tiktok",    label: "TikTok",     handle: "@lamega99.9ecuador" },
  { key: "facebook",  label: "Facebook",   handle: "La Mega 99.9 Ecuador" },
  { key: "youtube",   label: "YouTube",    handle: "@lamega99.9ecuador" },
  { key: "spotify",   label: "Spotify",    handle: "La Mega 99.9" },
];

function NetworkButton({ netKey, label, handle }: { netKey: string; label: string; handle: string }) {
  const [h, setH] = useState(false);
  const s = SOCIAL[netKey];
  if (!s) return null;

  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        padding: "32px 24px", borderRadius: "var(--r-md)", textDecoration: "none",
        background: h ? `${s.color}14` : "var(--bg-2)",
        border: h ? `1px solid ${s.color}66` : "1px solid var(--line-1)",
        boxShadow: h ? `0 0 28px ${s.color}33, var(--shadow-lg)` : "var(--shadow-sm)",
        transition: "all var(--dur) var(--ease-out)",
        transform: h ? "translateY(-6px)" : "none",
      }}
    >
      {/* icon circle */}
      <span
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: h ? `${s.color}22` : "var(--bg-3)",
          border: `1.5px solid ${h ? s.color + "88" : "var(--line-2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all var(--dur)",
          boxShadow: h ? `0 0 20px ${s.color}44` : "none",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill={h ? s.color : "var(--fg-2)"} style={{ transition: "fill var(--dur)" }}>
          <path d={s.path} />
        </svg>
      </span>

      {/* label */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16,
            color: h ? s.color : "#fff", textTransform: "uppercase",
            letterSpacing: "0.04em", transition: "color var(--dur)",
          }}
        >
          {label}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
          {handle}
        </div>
      </div>

      {/* "Abrir" pill */}
      <span
        style={{
          fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
          textTransform: "uppercase", padding: "5px 14px", borderRadius: 999,
          background: h ? s.color : "transparent",
          border: `1px solid ${h ? s.color : "var(--line-2)"}`,
          color: h ? "#fff" : "var(--fg-3)",
          transition: "all var(--dur)",
        }}
      >
        {h ? "↗ Abrir" : "Seguir"}
      </span>
    </a>
  );
}

export function Social() {
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

      <div
        className="reveal social-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}
      >
        {NETWORKS.map((n) => (
          <NetworkButton key={n.key} netKey={n.key} label={n.label} handle={n.handle} />
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) { .social-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 560px) { .social-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; } }
      `}</style>
    </Section>
  );
}
