"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon, Button, OnAir, Bloom, useReveal } from "@/components/ui";
import { useRadio, fmt } from "@/components/radio/RadioProvider";

function Visualizer({ playing }: { playing: boolean }) {
  // decorative only — render after mount so SSR/client markup never differs
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const bars = useMemo(
    () =>
      Array.from({ length: 96 }, () => ({
        delay: (Math.random() * 1.2).toFixed(2),
        dur: (0.7 + Math.random() * 0.9).toFixed(2),
        h: 12 + Math.random() * 78,
      })),
    []
  );
  if (!mounted) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: "38%",
        display: "flex", alignItems: "flex-end", gap: 3, padding: "0 2%",
        maskImage: "linear-gradient(to top, #000 0%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, #000 0%, transparent 100%)",
        opacity: 0.5, zIndex: 0, pointerEvents: "none",
      }}
    >
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            flex: 1, height: b.h + "%", borderRadius: "3px 3px 0 0",
            background: "linear-gradient(to top, rgba(227,30,36,0.05), var(--red-bright))",
            transformOrigin: "bottom", transform: "scaleY(0.25)",
            animation: `eq-bounce ${b.dur}s var(--ease-out) ${b.delay}s infinite`,
            animationPlayState: playing ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}

export function PlayerCard() {
  const { nowPlaying, playing, loading, progress, volume, setVolume, toggle } = useRadio();
  const hue = "#E31E24";
  const frac =
    progress != null && nowPlaying.duration ? Math.min(1, progress / nowPlaying.duration) : 0;

  return (
    <div
      className="glass reveal"
      style={{
        padding: 28, borderRadius: "var(--r-lg)", width: "100%", maxWidth: 460,
        border: "1px solid var(--line-red)",
        boxShadow: "0 0 0 1px rgba(227,30,36,0.18), var(--glow-red-soft), var(--shadow-lg)",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <span className="kicker" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className={"eq" + (playing ? "" : " paused")} style={{ height: 11 }}>
            <i></i><i></i><i></i><i></i>
          </span>
          Stream en vivo
        </span>
        <OnAir compact />
      </div>

      {/* now playing */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
        <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
          <span
            style={{
              position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid var(--red-bright)",
              opacity: playing ? 1 : 0.3, animation: playing ? "pulse-ring 2s var(--ease-out) infinite" : "none",
            }}
          />
          <div
            style={{
              width: 92, height: 92, borderRadius: "50%", position: "relative",
              background: nowPlaying.cover_url
                ? `url(${nowPlaying.cover_url}) center/cover`
                : `radial-gradient(circle at 35% 30%, ${hue}, #120608 75%)`,
              boxShadow: "inset 0 2px 10px rgba(255,255,255,0.18), inset 0 -8px 20px rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: playing ? "spin-slow 8s linear infinite" : "none",
            }}
          >
            <span style={{ position: "absolute", inset: 14, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.10)" }} />
            <span style={{ position: "absolute", inset: 24, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)" }} />
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg)", border: "2px solid rgba(255,255,255,0.2)" }} />
          </div>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6 }}>
            Sonando ahora
          </div>
          <div className="display" style={{ fontSize: 28, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nowPlaying.title}
          </div>
          <div style={{ fontSize: 15, color: "var(--fg-2)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nowPlaying.artist}
          </div>
        </div>
      </div>

      {/* progress (live track position pushed by the automation app) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.10)", position: "relative" }}>
          <div
            style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: frac * 100 + "%", borderRadius: 999,
              background: "linear-gradient(90deg, var(--red), var(--red-bright))",
              boxShadow: "0 0 12px rgba(255,45,52,0.7)", transition: "width 1s linear",
            }}
          >
            {frac > 0 && (
              <span
                style={{
                  position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
                  width: 12, height: 12, borderRadius: "50%", background: "#fff", boxShadow: "0 0 10px rgba(255,45,52,0.9)",
                }}
              />
            )}
          </div>
        </div>
        <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-3)", marginTop: 8 }}>
          <span>{progress != null ? fmt(progress) : "EN VIVO"}</span>
          <span>{nowPlaying.duration ? fmt(nowPlaying.duration) : "99.9 FM"}</span>
        </div>
      </div>

      {/* controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <button
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Reproducir"}
          style={{
            width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer",
            background: "linear-gradient(180deg, var(--red-bright), var(--red))", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--glow-red)", transition: "transform var(--dur-fast)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Icon
            name={loading ? "loader-2" : playing ? "pause" : "play"}
            size={26}
            style={{
              marginLeft: playing || loading ? 0 : 3,
              animation: loading ? "spin-slow 1.2s linear infinite" : "none",
            }}
            strokeWidth={2.4}
          />
        </button>
        {/* volume */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, maxWidth: 160 }}>
          <Icon name={volume === 0 ? "volume-x" : "volume-2"} size={18} color="var(--fg-2)" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volumen"
            style={{ flex: 1, accentColor: "var(--red)", height: 4 }}
          />
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { playing, toggle } = useRadio();
  const revRef = useReveal();
  const scrollTo = (id: string) => {
    const e = document.querySelector(id) as HTMLElement | null;
    if (e) window.scrollTo({ top: e.offsetTop - 60, behavior: "smooth" });
  };
  return (
    <section
      id="inicio"
      ref={revRef as React.RefObject<HTMLElement>}
      style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 40px 80px", overflow: "hidden" }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(120% 90% at 70% 0%, #1a0608 0%, #0A0A0A 52%, #060606 100%)", zIndex: 0,
        }}
      />
      <Bloom x="-8%" y="2%" size={640} color="rgba(227,30,36,0.20)" />
      <Bloom x="60%" y="30%" size={560} color="rgba(122,31,196,0.12)" />
      <Visualizer playing={playing} />

      <div
        className="hero-grid"
        style={{
          maxWidth: 1240, margin: "0 auto", width: "100%", position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 56, alignItems: "center",
        }}
      >
        {/* copy */}
        <div>
          <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            <span className="kicker" style={{ color: "var(--fg-2)" }}>99.9 FM</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--red)" }} />
            <span className="kicker" style={{ color: "var(--fg-2)" }}>Imbabura</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--red)" }} />
            <span className="kicker">En Vivo</span>
          </div>
          <h1 className="display reveal" style={{ fontSize: "clamp(52px, 8vw, 108px)", margin: 0 }}>
            <span style={{ display: "block", color: "#fff" }}>Solo La Mega</span>
            <span className="shimmer" style={{ display: "block", filter: "drop-shadow(0 0 32px rgba(227,30,36,0.55))" }}>
              Supera a La Mega
            </span>
          </h1>
          <p className="reveal" style={{ fontSize: 19, lineHeight: 1.55, color: "var(--fg-2)", maxWidth: 460, margin: "26px 0 36px" }}>
            La radio líder de Imbabura. Pop, urbano y los hits que mueven la provincia — al aire las 24 horas desde Ibarra.
          </p>
          <div className="reveal" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Button variant="primary" size="lg" iconLeft={playing ? "pause" : "play"} onClick={toggle}>
              {playing ? "Pausar" : "Escuchar Ahora"}
            </Button>
            <Button variant="outline" size="lg" iconLeft="tv" onClick={() => scrollTo("#megatv")}>
              Ver Mega TV
            </Button>
          </div>
        </div>

        {/* player */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PlayerCard />
        </div>
      </div>

      <a
        href="#programacion"
        aria-label="Bajar"
        style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 1,
          color: "var(--fg-3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}
      >
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>SCROLL</span>
        <Icon name="chevron-down" size={20} style={{ animation: "pulse-dot 1.8s infinite" }} />
      </a>

      <style>{`@media (max-width: 920px){ .hero-grid{ grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>
    </section>
  );
}
