"use client";

import React from "react";
import { useRadio } from "@/components/radio/RadioProvider";

export function Ticker() {
  const { nowPlaying, config } = useRadio();
  const items = [
    "EN VIVO",
    `${nowPlaying.title} · ${nowPlaying.artist}`,
    `${config.frequency} ${config.coverage}`.toUpperCase(),
    config.slogan.toUpperCase(),
    config.city.toUpperCase(),
    "PIDE TU TEMA AL 096 13 14 999",
    "ALEXA, ABRE RADIO MEGA ECUADOR",
  ];
  const run = (k: string) => (
    <div key={k} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      {items.map((t, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "0 28px" }}>
          {i === 0 && (
            <span
              style={{
                width: 10, height: 10, borderRadius: "50%", background: "#fff",
                boxShadow: "0 0 10px #fff", animation: "pulse-dot 1.3s infinite", flexShrink: 0,
              }}
            />
          )}
          <span className="display" style={{ fontSize: 16, color: "#fff", letterSpacing: "0.04em" }}>{t}</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.55)" }} />
        </span>
      ))}
    </div>
  );
  return (
    <div
      style={{
        background: "linear-gradient(90deg, var(--red), var(--red-bright), var(--red))",
        borderTop: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(0,0,0,0.3)",
        overflow: "hidden", padding: "14px 0", position: "relative", zIndex: 2,
        boxShadow: "0 0 40px rgba(227,30,36,0.4)",
      }}
    >
      <div style={{ display: "flex", width: "max-content", animation: "ticker-scroll 32s linear infinite" }}>
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}
