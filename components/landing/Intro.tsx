"use client";

// Animated intro: a radio tuner sweeps the FM band, overshoots, and locks
// onto 99.9 — then the brand flashes in and the overlay fades out.
// Plays on every page load, and replays when the user clicks "INICIO"
// (the nav dispatches the `lamega:intro` event). Skippable.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const INTRO_EVENT = "lamega:intro";

const START = 87.5;
const TARGET = 99.9;
const SWEEP_MS = 2400; // frequency sweep duration
const LOCK_MS = 1500; // brand reveal after lock
const FADE_MS = 600;

// ease-out with a slight overshoot past the target, settling back (tuning feel)
function tune(p: number) {
  const back = 1.70158;
  const x = p - 1;
  return x * x * ((back + 1) * x + back) + 1;
}

export function Intro() {
  const [phase, setPhase] = useState<"hidden" | "sweep" | "locked" | "fade">("hidden");
  const [freq, setFreq] = useState(START);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const ticks = useMemo(() => Array.from({ length: 41 }, (_, i) => 87 + i * 0.5), []);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const finish = useCallback(() => {
    stopAll();
    setPhase("hidden");
    document.body.style.overflow = "";
  }, [stopAll]);

  const start = useCallback(() => {
    stopAll();
    setFreq(START);
    setPhase("sweep");
    document.body.style.overflow = "hidden";
    window.scrollTo({ top: 0 });

    let locked = false;
    const lock = () => {
      if (locked) return;
      locked = true;
      setFreq(TARGET);
      setPhase("locked");
      timersRef.current.push(setTimeout(() => setPhase("fade"), LOCK_MS));
      timersRef.current.push(setTimeout(() => finish(), LOCK_MS + FADE_MS));
    };

    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / SWEEP_MS);
      setFreq(START + (TARGET - START) * tune(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else lock();
    };
    rafRef.current = requestAnimationFrame(step);
    // safety net: if rAF gets throttled (hidden tab), lock on time anyway
    timersRef.current.push(setTimeout(lock, SWEEP_MS + 150));
  }, [finish, stopAll]);

  useEffect(() => {
    start(); // every page load
    const onReplay = () => start(); // "INICIO" clicks
    window.addEventListener(INTRO_EVENT, onReplay);
    return () => {
      window.removeEventListener(INTRO_EVENT, onReplay);
      stopAll();
      document.body.style.overflow = "";
    };
  }, [start, stopAll]);

  if (phase === "hidden") return null;

  const locked = phase === "locked" || phase === "fade";
  // dial ruler position: center follows current frequency
  const PX_PER_MHZ = 56;
  const rulerShift = -(freq - 87) * PX_PER_MHZ;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "radial-gradient(120% 90% at 50% 10%, #160507 0%, #0A0A0A 60%, #050505 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        opacity: phase === "fade" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms var(--ease-out)`,
        overflow: "hidden",
      }}
    >
      {/* signal-noise bars in the background */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: "30%",
          display: "flex", alignItems: "flex-end", gap: 4, padding: "0 4%",
          maskImage: "linear-gradient(to top, #000, transparent)",
          WebkitMaskImage: "linear-gradient(to top, #000, transparent)",
          opacity: locked ? 0.55 : 0.25, transition: "opacity 400ms",
        }}
      >
        {ticks.map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1, height: `${15 + ((i * 37) % 70)}%`, borderRadius: "3px 3px 0 0",
              background: "linear-gradient(to top, rgba(227,30,36,0.05), var(--red-bright))",
              transformOrigin: "bottom",
              animation: `eq-bounce ${(0.5 + ((i * 13) % 9) / 10).toFixed(2)}s var(--ease-out) ${((i * 7) % 12) / 10}s infinite`,
            }}
          />
        ))}
      </div>

      {/* kicker */}
      <div className="mono" style={{ fontSize: 12, letterSpacing: "0.35em", color: locked ? "var(--red-bright)" : "var(--fg-3)", textTransform: "uppercase", marginBottom: 26, transition: "color 300ms" }}>
        {locked ? "● Señal encontrada" : "Sintonizando…"}
      </div>

      {/* frequency readout */}
      <div
        className="display"
        style={{
          fontSize: "clamp(72px, 16vw, 170px)", lineHeight: 1, color: locked ? "#fff" : "var(--fg-2)",
          textShadow: locked ? "0 0 60px rgba(255,45,52,0.9), 0 0 24px rgba(255,45,52,0.7)" : "none",
          transition: "color 300ms, text-shadow 300ms",
          fontVariantNumeric: "tabular-nums",
          animation: locked ? "pulse-dot 1.6s var(--ease-out) 1" : "none",
        }}
      >
        {freq.toFixed(1)}
        <span style={{ fontSize: "0.32em", marginLeft: 14, color: locked ? "var(--red-bright)" : "var(--fg-3)", transition: "color 300ms" }}>FM</span>
      </div>

      {/* dial ruler */}
      <div style={{ position: "relative", width: "min(680px, 86vw)", height: 76, marginTop: 38, overflow: "hidden" }}>
        {/* needle */}
        <div
          style={{
            position: "absolute", left: "50%", top: 0, bottom: 14, width: 3, transform: "translateX(-50%)", zIndex: 2,
            background: "linear-gradient(180deg, var(--red-bright), var(--red))",
            boxShadow: locked ? "0 0 18px rgba(255,45,52,0.95)" : "0 0 8px rgba(255,45,52,0.5)",
            borderRadius: 2, transition: "box-shadow 300ms",
          }}
        />
        {/* moving scale */}
        <div
          style={{
            position: "absolute", top: 8, left: "50%", display: "flex", alignItems: "flex-start",
            transform: `translateX(${rulerShift}px)`,
            willChange: "transform",
          }}
        >
          {ticks.map((f) => {
            const major = Number.isInteger(f);
            const isTarget = Math.abs(f - 100) < 0.01; // 99.9 sits next to the 100 tick
            return (
              <div key={f} style={{ width: PX_PER_MHZ / 2, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 2, height: major ? 26 : 14,
                    background: isTarget && locked ? "var(--red-bright)" : major ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)",
                    boxShadow: isTarget && locked ? "0 0 12px rgba(255,45,52,0.9)" : "none",
                  }}
                />
                {major && (
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 8, transform: "translateX(-50%)" }}>
                    {f.toFixed(0)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* edge fade */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #0A0A0A 0%, transparent 18%, transparent 82%, #0A0A0A 100%)", pointerEvents: "none" }} />
      </div>

      {/* brand reveal */}
      <div
        style={{
          marginTop: 40, textAlign: "center",
          opacity: locked ? 1 : 0, transform: locked ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 480ms var(--ease-out), transform 480ms var(--ease-out)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/mega-logo.png" alt="" style={{ height: 54, margin: "0 auto 14px", filter: "drop-shadow(0 6px 26px rgba(227,30,36,0.65))" }} />
        <div className="display" style={{ fontSize: 17, letterSpacing: "0.12em", color: "var(--fg-2)" }}>
          Solo La Mega <span style={{ color: "var(--red-bright)" }}>·</span> Supera a La Mega
        </div>
      </div>

      {/* skip */}
      <button
        onClick={finish}
        className="mono"
        style={{
          position: "absolute", bottom: 30, right: 30, padding: "9px 16px", borderRadius: "var(--r-pill)",
          background: "rgba(255,255,255,0.04)", border: "1px solid var(--line-2)", color: "var(--fg-3)",
          fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer",
        }}
      >
        Saltar intro →
      </button>
    </div>
  );
}
