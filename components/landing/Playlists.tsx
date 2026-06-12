"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon, Section, Bloom, SOCIAL } from "@/components/ui";

const PLAYLISTS = [
  { id: "6XmCif0wWxu6BGIpIRDM65", name: "Rock La Mega" },
  { id: "5CBbX9uavQMEnwQYBZ6lae", name: "Rock Latino La Mega" },
  { id: "42ysAQif314kXIKZJCve6D", name: "Pop La Mega" },
  { id: "3110hl0wAJkk9U4gkET6GM", name: "Reggaetón La Mega" },
];

function SpotifyEmbed({ id, name }: { id: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setLoaded(true); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ flexShrink: 0, width: 320, scrollSnapAlign: "start", borderRadius: "var(--r-md)", overflow: "hidden" }}
    >
      {loaded ? (
        <iframe
          src={`https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`}
          width="320"
          height="460"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={name}
          style={{ display: "block", borderRadius: "var(--r-md)" }}
        />
      ) : (
        <div
          style={{
            width: 320, height: 460, borderRadius: "var(--r-md)",
            background: "var(--bg-2)", border: "1px solid var(--line-1)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#1DB954" opacity={0.4}>
            <path d={SOCIAL.spotify.path} />
          </svg>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Cargando playlist…</span>
        </div>
      )}
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
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <Section id="playlists" style={{ background: "var(--bg-1)", borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)" }}>
      <Bloom x="75%" y="0%" size={520} color="rgba(29,185,84,0.10)" />

      <div className="reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
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
        {PLAYLISTS.map((pl) => (
          <SpotifyEmbed key={pl.id} id={pl.id} name={pl.name} />
        ))}
      </div>

      <style>{`
        .pl-scroller{ scrollbar-width: thin; scrollbar-color: #1DB95444 transparent; }
        @media (max-width: 1024px){ .pl-scroller{ margin: 0 -32px !important; padding: 0 32px 14px !important; } }
        @media (max-width: 768px){ .pl-scroller{ margin: 0 -20px !important; padding: 0 20px 14px !important; } }
        @media (max-width: 480px){ .pl-scroller{ margin: 0 -16px !important; padding: 0 16px 14px !important; } }
      `}</style>
    </Section>
  );
}
