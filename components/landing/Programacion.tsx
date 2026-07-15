"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon, Section, SectionHead, Bloom } from "@/components/ui";
import { DAYS, SCHEDULE, WEEKEND, PROGRAMS } from "@/components/data";
import { useStationData, type PublicHost, type PublicShow } from "@/components/useStationData";

interface Block {
  time: string;
  name: string;
  hue: string;
}

// One conductor on a featured card. `photo` is null when the show isn't linked
// to a real Host (e.g. "Automático") — the card then shows the mic fallback.
interface CardHost {
  name: string;
  photo: string | null;
  hue: string;
}

// The design's static fallback stores a single free-text host string.
const staticPrograms = PROGRAMS.map((p) => ({
  ...p,
  hosts: [{ name: p.host, photo: null, hue: p.hue }] as CardHost[],
}));

// Derive the featured cards + weekly grid from the DB-backed station data;
// fall back to the design's static content while loading.
function useProgramData() {
  const station = useStationData();
  if (!station || station.shows.length === 0) {
    return { programs: staticPrograms, schedule: SCHEDULE as Block[], weekend: WEEKEND as Record<string, Block[]> };
  }
  const on = station.shows.filter((s) => s.is_on);
  const toBlock = (s: PublicShow): Block => ({ time: s.start_time, name: s.name.toUpperCase(), hue: s.hue });
  // Real link (host_ids) — replaces the old fuzzy name match, which only ever
  // found the FIRST host of a multi-host show. Unlinked rows ("Automático",
  // not-yet-backfilled) fall back to the free-text label with no photo.
  const hostsFor = (s: PublicShow): CardHost[] => {
    const linked = s.host_ids
      .map((id) => station.hosts.find((h) => h.id === id))
      .filter((h): h is PublicHost => !!h);
    if (linked.length === 0) return [{ name: s.host, photo: null, hue: s.hue }];
    return linked.map((h) => ({ name: h.name, photo: h.photo_url ?? null, hue: h.hue }));
  };
  const programs = on
    .filter((s) => s.featured)
    .map((s) => ({
      name: s.name.toUpperCase(),
      time: `${s.start_time} – ${s.end_time}`,
      slot: (s.slot || "").toUpperCase(),
      hosts: hostsFor(s),
      blurb: s.blurb || "",
      hue: s.hue,
    }));
  return {
    programs: programs.length ? programs : staticPrograms,
    schedule: on.filter((s) => s.days === "semana").map(toBlock),
    weekend: {
      "SÁB": on.filter((s) => s.days === "sabado").map(toBlock),
      "DOM": on.filter((s) => s.days === "domingo").map(toBlock),
    },
  };
}

// EQ spectrum — each row index maps to a frequency-band colour
const EQ_COLORS = [
  "#00D4FF", // 0 — cyan
  "#7B2FFF", // 1 — indigo
  "#FF00CC", // 2 — magenta
  "#FF3A44", // 3 — red (La Mega)
  "#FF6B00", // 4 — orange
  "#FFD700", // 5 — yellow
  "#00E676", // 6 — green
  "#00B4D8", // 7 — sky
  "#A855F7", // 8 — violet
];
const eqColor = (j: number) => EQ_COLORS[j % EQ_COLORS.length];

function ScheduleGrid({ schedule, weekend }: { schedule: Block[]; weekend: Record<string, Block[]> }) {
  const liveDay = new Date().getDay();
  const dayIndex = (liveDay + 6) % 7;
  const [openDay, setOpenDay] = useState(dayIndex);
  const blocksFor = (d: string) => (d === "SÁB" || d === "DOM" ? weekend[d] : schedule);

  // Trigger EQ bar animation when the grid enters the viewport
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("eq-visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* desktop / tablet grid */}
      <div ref={gridRef} className="glass sched-desktop" style={{ padding: 18, borderRadius: "var(--r-lg)", overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(118px, 1fr))", gap: 10, minWidth: 840 }}>
          {DAYS.map((d, i) => {
            const blocks = blocksFor(d);
            const isToday = i === dayIndex;
            return (
              <div key={d}>
                {/* day header */}
                <div
                  style={{
                    textAlign: "center", padding: "9px 0", marginBottom: 10, borderRadius: "var(--r-sm)",
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, letterSpacing: "0.08em",
                    color: isToday ? "#fff" : "var(--fg-2)",
                    background: isToday ? "linear-gradient(180deg, var(--red-bright), var(--red))" : "var(--bg-2)",
                    boxShadow: isToday ? "var(--glow-red)" : "none",
                    border: isToday ? "none" : "1px solid var(--line-1)",
                  }}
                >
                  {d}
                  {isToday && (
                    <span style={{ display: "block", fontSize: 9, fontFamily: "var(--font-mono)", opacity: 0.85, letterSpacing: "0.15em" }}>HOY</span>
                  )}
                </div>

                {/* EQ bars — colour assigned by column (day index i) so each day
                    is its own vertical frequency band, like a real EQ spectrum */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {blocks.map((b, j) => {
                    const c = eqColor(i);
                    return (
                      <div
                        key={j}
                        className="eq-bar"
                        style={{
                          // @ts-ignore
                          "--eq-c": c,
                          "--eq-delay": `${j * 65 + i * 22}ms`,
                          padding: "10px 11px",
                          borderRadius: "var(--r-sm)",
                          background: `linear-gradient(160deg, rgba(${hexToRgb(c)},0.18) 0%, rgba(${hexToRgb(c)},0.05) 100%)`,
                          borderLeft: `3px solid ${c}`,
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          borderRight: "1px solid rgba(255,255,255,0.04)",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          boxShadow: `inset 2px 0 12px rgba(${hexToRgb(c)},0.10)`,
                          transition: "all 0.2s ease",
                          cursor: "default",
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget;
                          el.style.background = `linear-gradient(160deg, rgba(${hexToRgb(c)},0.32) 0%, rgba(${hexToRgb(c)},0.12) 100%)`;
                          el.style.transform = "translateX(3px) scaleY(1.03)";
                          el.style.boxShadow = `inset 2px 0 18px rgba(${hexToRgb(c)},0.22), 0 0 18px rgba(${hexToRgb(c)},0.18)`;
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget;
                          el.style.background = `linear-gradient(160deg, rgba(${hexToRgb(c)},0.18) 0%, rgba(${hexToRgb(c)},0.05) 100%)`;
                          el.style.transform = "none";
                          el.style.boxShadow = `inset 2px 0 12px rgba(${hexToRgb(c)},0.10)`;
                        }}
                      >
                        <div className="mono" style={{ fontSize: 10, color: c, marginBottom: 4, opacity: 0.9 }}>{b.time}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "#fff", lineHeight: 1.1, textTransform: "uppercase" }}>
                          {b.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* mobile accordion */}
      <div className="reveal sched-mobile" style={{ display: "none", flexDirection: "column", gap: 10 }}>
        {DAYS.map((d, i) => {
          const blocks = blocksFor(d);
          const isToday = i === dayIndex;
          const isOpen = openDay === i;
          return (
            <div
              key={d}
              className="glass"
              style={{ borderRadius: "var(--r-md)", overflow: "hidden", border: isToday ? "1px solid var(--line-red)" : "1px solid var(--glass-border)" }}
            >
              <button
                onClick={() => setOpenDay(isOpen ? -1 : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "16px 18px", background: "none", border: "none", cursor: "pointer", color: "#fff",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="display" style={{ fontSize: 18, color: isToday ? "var(--red-bright)" : "#fff" }}>{d}</span>
                  {isToday && (
                    <span className="mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "#fff", background: "var(--red)", padding: "3px 7px", borderRadius: 999 }}>
                      HOY
                    </span>
                  )}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{blocks.length} shows</span>
                  <Icon name="chevron-down" size={20} color="var(--fg-2)" style={{ transition: "transform var(--dur)", transform: isOpen ? "rotate(180deg)" : "none" }} />
                </span>
              </button>
              <div style={{ maxHeight: isOpen ? 800 : 0, overflow: "hidden", transition: "max-height var(--dur-slow) var(--ease-out)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px 14px" }}>
                  {blocks.map((b, j) => {
                    const c = eqColor(j);
                    return (
                      <div
                        key={j}
                        style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--r-sm)",
                          background: `linear-gradient(90deg, rgba(${hexToRgb(c)},0.16) 0%, rgba(${hexToRgb(c)},0.04) 100%)`,
                          borderLeft: `3px solid ${c}`,
                          border: `1px solid rgba(${hexToRgb(c)},0.18)`,
                          borderLeftWidth: 3,
                        }}
                      >
                        <span className="mono" style={{ fontSize: 12, color: c, minWidth: 48 }}>{b.time}</span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#fff", textTransform: "uppercase" }}>{b.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        /* EQ bar entrance animation */
        @keyframes eq-bar-in {
          from { transform: translateY(18px) scaleY(0.55); opacity: 0; }
          to   { transform: translateY(0)    scaleY(1);    opacity: 1; }
        }
        .eq-bar {
          opacity: 0;
          transform-origin: bottom center;
        }
        .eq-visible .eq-bar {
          animation: eq-bar-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
          animation-delay: var(--eq-delay, 0ms);
        }
        @media (max-width: 768px){
          .sched-desktop{ display:none !important; }
          .sched-mobile{ display:flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .eq-bar { opacity: 1 !important; transform: none !important; animation: none !important; }
        }
      `}</style>
    </>
  );
}

// Convert #RRGGBB to "R,G,B" for use in rgba()
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function ProgramCard({ p }: { p: { name: string; time: string; slot: string; hosts: CardHost[]; blurb: string; hue: string } }) {
  const [h, setH] = useState(false);
  return (
    <div
      className="reveal glass"
      style={{
        borderRadius: "var(--r-md)", overflow: "hidden", transition: "all var(--dur) var(--ease-out)",
        transform: h ? "translateY(-6px)" : "none",
        border: h ? "1px solid var(--line-red)" : "1px solid var(--glass-border)",
        boxShadow: h ? `0 0 30px ${p.hue}33, var(--shadow-lg)` : "var(--shadow-md)",
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {/* gradient header */}
      <div style={{ position: "relative", padding: "20px 20px 16px", background: `linear-gradient(135deg, ${p.hue}, ${p.hue}22 90%)`, overflow: "hidden" }}>
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,0.08) 6px 7px)", opacity: 0.6 }}
        />
        <div className="mono" style={{ position: "relative", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>{p.slot}</div>
        <div className="display" style={{ position: "relative", fontSize: 26, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>{p.name}</div>
        <div className="mono" style={{ position: "relative", fontSize: 12, color: "#fff", marginTop: 6, opacity: 0.95 }}>{p.time}</div>
      </div>
      {/* body */}
      <div style={{ padding: "18px 20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          {/* stacked avatars — one per conductor (overlap when there are several) */}
          <div style={{ display: "flex", flexShrink: 0 }}>
            {p.hosts.map((h, i) => (
              <div
                key={`${h.name}-${i}`}
                title={h.name}
                style={{
                  width: 46, height: 46, borderRadius: "50%", overflow: "hidden",
                  background: h.photo ? `url(${h.photo}) center/cover` : `radial-gradient(circle at 35% 30%, ${h.hue}, #150708)`,
                  border: "2px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center",
                  marginLeft: i ? -14 : 0, zIndex: p.hosts.length - i, position: "relative",
                }}
              >
                {!h.photo && <Icon name="mic" size={20} color="rgba(255,255,255,0.85)" />}
              </div>
            ))}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--fg-3)", textTransform: "uppercase" }}>
              {p.hosts.length > 1 ? "Conducen" : "Conduce"}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>
              {p.hosts.map((h) => h.name).join(" & ")}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--fg-2)", margin: 0 }}>{p.blurb}</p>
      </div>
    </div>
  );
}

export function Programacion() {
  const { programs, schedule, weekend } = useProgramData();
  return (
    <Section id="programacion">
      <Bloom x="-6%" y="10%" size={520} color="rgba(122,31,196,0.10)" />
      <SectionHead
        align="left"
        index="02"
        kicker="LUNES A DOMINGO · 24/7"
        title={<>Nuestra <span style={{ color: "var(--red)" }}>Programación</span></>}
        lead="Los shows que marcan el ritmo del día en Imbabura, más la parrilla completa de toda la semana."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 44 }}>
        {programs.map((p) => (
          <ProgramCard key={p.name} p={p} />
        ))}
      </div>

      <div className="reveal" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <Icon name="calendar-days" size={18} color="var(--red-bright)" />
        <span className="mono" style={{ fontSize: 12, letterSpacing: "0.18em", color: "var(--fg-2)", textTransform: "uppercase" }}>
          Parrilla semanal completa
        </span>
      </div>
      <ScheduleGrid schedule={schedule} weekend={weekend} />
    </Section>
  );
}
