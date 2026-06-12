"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { useRadio, fmt } from "@/components/radio/RadioProvider";

export function MiniPlayer() {
  const { nowPlaying, playing, loading, progress, volume, setVolume, toggle } = useRadio();
  const [show, setShow] = useState(false);
  const frac =
    progress != null && nowPlaying.duration ? Math.min(1, progress / nowPlaying.duration) : 0;

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.85);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 90,
        transform: show ? "translateY(0)" : "translateY(110%)",
        transition: "transform var(--dur-slow) var(--ease-out)",
        background: "rgba(12,12,13,0.82)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)", backdropFilter: "blur(22px) saturate(150%)",
        borderTop: "1px solid var(--line-red)",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(227,30,36,0.12)",
      }}
    >
      {/* progress line across top */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", position: "relative" }}>
        <div
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: frac * 100 + "%",
            background: "linear-gradient(90deg, var(--red), var(--red-bright))",
            boxShadow: "0 0 10px rgba(255,45,52,0.8)", transition: "width 1s linear",
          }}
        />
      </div>

      <div
        className="mini-inner"
        style={{ maxWidth: 1440, margin: "0 auto", padding: "12px 40px", display: "flex", alignItems: "center", gap: 20 }}
      >
        {/* now playing */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          {nowPlaying.cover_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={nowPlaying.cover_url}
              alt={nowPlaying.title}
              style={{
                width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                objectFit: "cover", boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
              }}
            />
          ) : (
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: "radial-gradient(circle at 35% 30%, #E31E24, #150708)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: playing ? "spin-slow 8s linear infinite" : "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--bg)", border: "1.5px solid rgba(255,255,255,0.25)" }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={"eq" + (playing ? "" : " paused")} style={{ height: 10 }}>
                <i></i><i></i><i></i><i></i>
              </span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--red-bright)" }}>
                EN VIVO · 99.9 FM
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap", overflow: "hidden" }}>
              <span className="display" style={{ fontSize: 16, color: "#fff" }}>{nowPlaying.title}</span>
              <span style={{ fontSize: 13, color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis" }}>
                · {nowPlaying.artist}
              </span>
            </div>
          </div>
        </div>

        {/* controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={toggle}
            aria-label={playing ? "Pausar" : "Reproducir"}
            className="mini-play"
            style={{
              width: 46, height: 46, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "linear-gradient(180deg, var(--red-bright), var(--red))", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--glow-red)",
            }}
          >
            <Icon
              name={loading ? "loader-2" : playing ? "pause" : "play"}
              size={20}
              strokeWidth={2.4}
              style={{
                marginLeft: playing || loading ? 0 : 2,
                animation: loading ? "spin-slow 1.2s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        {/* volume + time */}
        <div className="mini-vol" style={{ display: "flex", alignItems: "center", gap: 12, flex: "0 0 auto" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", minWidth: 78, textAlign: "right" }}>
            {progress != null && nowPlaying.duration
              ? `${fmt(progress)} / ${fmt(nowPlaying.duration)}`
              : "EN VIVO"}
          </span>
          <Icon name={volume === 0 ? "volume-x" : "volume-2"} size={18} color="var(--fg-2)" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volumen"
            style={{ width: 90, accentColor: "var(--red)", height: 4 }}
          />
        </div>
      </div>
      <style>{`
        @media (max-width: 760px){
          .mini-vol{ display:none !important; }
          .mini-inner{ padding: 16px 16px calc(16px + env(safe-area-inset-bottom)) !important; gap: 12px !important; }
          .mini-play{ width: 54px !important; height: 54px !important; }
        }
      `}</style>
    </div>
  );
}
