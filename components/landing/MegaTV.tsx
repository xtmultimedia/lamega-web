"use client";

import React, { useState } from "react";
import { Section, SectionHead, Bloom, SOCIAL } from "@/components/ui";
import { useRadio } from "@/components/radio/RadioProvider";

// OneStream Live "Universal Embed Player" — one permanent embed for all events.
// Shows the configured offline poster when not broadcasting and auto-connects
// the moment a stream goes LIVE in OneStream (no manual switch on the site).
// Customize the offline poster in OneStream → Universal Embed Settings →
// Universal Player → Background.
const ONESTREAM_EMBED = "https://player.onestream.live/embed?token=MzY0MzEzMQ==&type=up";

function LivePill({ name, color, icon, href }: { name: string; color: string; icon: string; href: string }) {
  const [h, setH] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, padding: "11px 18px", borderRadius: "var(--r-pill)",
        background: h ? "var(--bg-3)" : "var(--bg-2)", border: "1px solid var(--line-2)",
        transition: "all var(--dur) var(--ease-out)", transform: h ? "translateY(-2px)" : "none",
        boxShadow: h ? `0 0 22px ${color}55` : "none", fontWeight: 600, fontSize: 14,
      }}
    >
      <span style={{ width: 22, height: 22, display: "inline-flex" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
          <path d={icon} />
        </svg>
      </span>
      {name}
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red-bright)", animation: "pulse-dot 1.3s infinite" }} />
    </a>
  );
}

export function MegaTV() {
  const { program } = useRadio();
  const fb = SOCIAL.facebook, tt = SOCIAL.tiktok, yt = SOCIAL.youtube;
  const nowOn = program ? `${program.program_name} · ${program.host}` : null;

  return (
    <Section id="megatv" style={{ background: "var(--bg-1)", borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)" }}>
      <Bloom x="70%" y="-10%" size={520} color="rgba(227,30,36,0.12)" />
      <SectionHead
        align="center"
        index="01"
        kicker="SEÑAL EN VIDEO"
        title={<>Mega TV <span style={{ color: "var(--red)" }}>99.9</span></>}
        lead="Entra a la cabina. Transmitimos los shows en vivo y a todo color, directo desde el estudio."
      />

      {/* live video player — OneStream Universal Embed (offline poster ↔ live, automatic) */}
      <div
        className="reveal"
        style={{
          position: "relative", aspectRatio: "16 / 9", borderRadius: "var(--r-lg)", overflow: "hidden",
          border: "1px solid var(--line-red)",
          boxShadow: "0 0 0 1px rgba(227,30,36,0.12), var(--glow-red-soft), var(--shadow-lg)",
          background: "radial-gradient(120% 120% at 50% 0%, #1c0a0c, #0a0a0a 70%)",
        }}
      >
        <iframe
          src={ONESTREAM_EMBED}
          title="Mega TV 99.9 — señal en vivo"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block" }}
        />

        {/* brand wordmark — top-right, non-interactive so it never blocks player controls */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: 16, right: 18, pointerEvents: "none", zIndex: 2,
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(0,0,0,0.45)", padding: "5px 12px", borderRadius: "var(--r-pill)", backdropFilter: "blur(6px)",
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, letterSpacing: "0.08em", color: "rgba(255,255,255,0.9)" }}>
            MEGA<span style={{ color: "var(--red)" }}>TV</span>
          </span>
        </div>
      </div>

      {/* now-on-air strip (real program from the live state) + follow links */}
      <div
        className="reveal"
        style={{
          marginTop: 22, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--red-bright)", boxShadow: "0 0 10px var(--red-bright)", animation: "pulse-dot 1.3s infinite" }} />
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--red-bright)" }}>AHORA EN CABINA</div>
            <div className="display" style={{ fontSize: 18, color: "#fff" }}>{nowOn ?? "Programación La Mega 99.9"}</div>
          </div>
        </div>
      </div>

      {/* follow elsewhere */}
      <div className="reveal" style={{ marginTop: 28, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, justifyContent: "center" }}>
        <span style={{ color: "var(--fg-3)", fontWeight: 600, marginRight: 4 }}>Síguenos también en vivo en:</span>
        <LivePill name="Facebook Live" color={fb.color} icon={fb.path} href={fb.url} />
        <LivePill name="TikTok Live" color="#25F4EE" icon={tt.path} href={tt.url} />
        <LivePill name="YouTube Live" color={yt.color} icon={yt.path} href={yt.url} />
      </div>
    </Section>
  );
}
