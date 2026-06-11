"use client";

import React, { useRef, useState } from "react";
import { Icon, Section, Bloom, SOCIAL } from "@/components/ui";
import { PLAYLISTS } from "@/components/data";
import { useStationData } from "@/components/useStationData";

interface PlaylistItem {
  name: string;
  count: number;
  hue1: string;
  hue2: string;
  url?: string | null;
}

function PlaylistCard({ pl }: { pl: PlaylistItem }) {
  const [h, setH] = useState(false);
  return (
    <div
      className="glass"
      style={{
        flexShrink: 0, width: 232, borderRadius: "var(--r-md)", padding: 16, scrollSnapAlign: "start",
        transition: "all var(--dur) var(--ease-out)", transform: h ? "translateY(-6px)" : "none",
        border: h ? "1px solid rgba(29,185,84,0.45)" : "1px solid var(--glass-border)",
        boxShadow: h ? "0 0 28px rgba(29,185,84,0.25), var(--shadow-lg)" : "var(--shadow-md)",
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {/* cover */}
      <div
        style={{
          position: "relative", aspectRatio: "1", borderRadius: "var(--r-sm)", overflow: "hidden", marginBottom: 16,
          background: `linear-gradient(135deg, ${pl.hue1}, ${pl.hue2})`, boxShadow: "inset 0 0 40px rgba(0,0,0,0.35)",
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 20%, rgba(255,255,255,0.18), transparent 50%)" }} />
        <span
          className="display"
          style={{ position: "absolute", left: 14, bottom: 12, right: 14, fontSize: 24, color: "#fff", lineHeight: 0.95, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
        >
          {pl.name}
        </span>
        <div style={{ position: "absolute", top: 12, left: 12, width: 26, height: 26 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#1DB954"><path d={SOCIAL.spotify.path} /></svg>
        </div>
        {/* play fab */}
        <div
          style={{
            position: "absolute", right: 12, bottom: 12, width: 46, height: 46, borderRadius: "50%",
            background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
            transform: h ? "translateY(0) scale(1)" : "translateY(8px) scale(0.9)",
            opacity: h ? 1 : 0, transition: "all var(--dur) var(--ease-out)",
          }}
        >
          <Icon name="play" size={22} color="#06150c" strokeWidth={2.6} style={{ marginLeft: 2 }} />
        </div>
      </div>
      <div className="display" style={{ fontSize: 18, color: "#fff" }}>{pl.name}</div>
      <div className="mono" style={{ fontSize: 12, color: "var(--fg-3)", margin: "5px 0 14px" }}>{pl.count} canciones</div>
      <a
        href={pl.url || SOCIAL.spotify.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px",
          borderRadius: "var(--r-pill)", background: h ? "#1ed760" : "var(--green)", color: "#06150c",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em",
          transition: "all var(--dur)", boxShadow: h ? "var(--glow-green)" : "none",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#06150c"><path d={SOCIAL.spotify.path} /></svg>
        Escuchar
      </a>
    </div>
  );
}

function ArrowBtn({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={dir}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 46, height: 46, borderRadius: "50%", border: "1px solid var(--line-2)",
        background: h ? "var(--bg-3)" : "var(--bg-2)", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--dur)",
      }}
    >
      <Icon name={dir === "left" ? "chevron-left" : "chevron-right"} size={22} />
    </button>
  );
}

export function Playlists() {
  const scroller = useRef<HTMLDivElement | null>(null);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 500, behavior: "smooth" });
  const station = useStationData();
  const items: PlaylistItem[] =
    station && station.playlists.length
      ? station.playlists.map((p) => ({ name: p.name.toUpperCase(), count: p.count, hue1: p.hue1, hue2: p.hue2, url: p.spotify_url }))
      : PLAYLISTS;
  return (
    <Section id="playlists" style={{ background: "var(--bg-1)", borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)" }}>
      <Bloom x="75%" y="0%" size={520} color="rgba(29,185,84,0.10)" />
      <div className="reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 56, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <span className="sec-index" style={{ color: "var(--green)", borderColor: "rgba(29,185,84,0.4)" }}>03</span>
            <span className="kicker" style={{ color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 9 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954"><path d={SOCIAL.spotify.path} /></svg>
              EN SPOTIFY
            </span>
          </div>
          <h2 className="h2">
            Nuestras <span style={{ color: "var(--green)" }}>Playlists</span>
          </h2>
          <p className="lead" style={{ maxWidth: 460, marginTop: 18 }}>
            Curadas por nuestros locutores. Dale play y llévate La Mega contigo.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ArrowBtn dir="left" onClick={() => scroll(-1)} />
          <ArrowBtn dir="right" onClick={() => scroll(1)} />
        </div>
      </div>

      <div
        ref={scroller}
        className="pl-scroller"
        style={{ display: "flex", gap: 18, overflowX: "auto", scrollSnapType: "x mandatory", margin: "0 -48px", padding: "0 48px 14px" }}
      >
        {items.map((pl) => (
          <PlaylistCard key={pl.name} pl={pl} />
        ))}
      </div>
      <style>{`
        .pl-scroller{ scrollbar-width: thin; }
        @media (max-width: 1024px){ .pl-scroller{ margin: 0 -32px !important; padding: 0 32px 14px !important; } }
        @media (max-width: 768px){ .pl-scroller{ margin: 0 -20px !important; padding: 0 20px 14px !important; } }
        @media (max-width: 480px){ .pl-scroller{ margin: 0 -16px !important; padding: 0 16px 14px !important; } }
      `}</style>
    </Section>
  );
}
