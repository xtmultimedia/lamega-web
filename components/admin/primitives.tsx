"use client";

// Admin dashboard primitives ported from design-reference/dashboard.jsx.

import React, { useState } from "react";
import { Icon } from "@/components/ui";

export function Card({
  children, style = {}, pad = 22, hover = false,
}: {
  children: React.ReactNode; style?: React.CSSProperties; pad?: number; hover?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: "var(--bg-1)", border: `1px solid ${h ? "var(--line-red)" : "var(--line-1)"}`,
        borderRadius: "var(--r-md)", padding: pad, boxShadow: "var(--shadow-md)",
        transition: "all var(--dur) var(--ease-out)", ...style,
      }}
    >
      {children}
    </div>
  );
}

export const BADGE: Record<string, { c: string; label: string; pulse?: boolean }> = {
  pendiente: { c: "#E0A82E", label: "Pendiente" },
  aprobada: { c: "#1DB954", label: "En cola" },
  alaire: { c: "#FF2D34", label: "Al aire", pulse: true },
  rechazada: { c: "#6B6B72", label: "Rechazada" },
  dedicatoria: { c: "#A855F7", label: "Dedicatoria" },
  solicitud: { c: "#16C8E8", label: "Solicitud" },
  activa: { c: "#1DB954", label: "Activa" },
  pausada: { c: "#6B6B72", label: "Pausada" },
  nueva: { c: "#16C8E8", label: "Nueva" },
  borrador: { c: "#E0A82E", label: "Borrador" },
  publicada: { c: "#1DB954", label: "Publicada" },
};

export function Badge({ kind, children }: { kind: string; children?: React.ReactNode }) {
  const b = BADGE[kind] || { c: "var(--fg-3)", label: String(children ?? kind) };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: "var(--r-pill)",
        background: `${b.c}1f`, border: `1px solid ${b.c}55`, color: b.c,
        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em",
        textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      {b.pulse && <span style={{ width: 7, height: 7, borderRadius: "50%", background: b.c, animation: "pulse-dot 1.3s infinite" }} />}
      {children || b.label}
    </span>
  );
}

export function Toggle({ on, onChange, color = "var(--red)" }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      style={{
        position: "relative", width: 44, height: 25, borderRadius: 999, border: "none", cursor: "pointer", padding: 0,
        background: on ? color : "var(--bg-4)",
        boxShadow: on ? "0 0 16px " + (color === "var(--red)" ? "rgba(255,45,52,0.5)" : "rgba(29,185,84,0.4)") : "none",
        transition: "background var(--dur), box-shadow var(--dur)",
      }}
    >
      <span
        style={{
          position: "absolute", top: 3, left: on ? 22 : 3, width: 19, height: 19, borderRadius: "50%", background: "#fff",
          transition: "left var(--dur) var(--ease-out)", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      />
    </button>
  );
}

export function AdmButton({
  children, variant = "primary", icon, onClick, style = {}, full = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  icon?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  full?: boolean;
}) {
  const [h, setH] = useState(false);
  const V: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(180deg, var(--red-bright), var(--red))", color: "#fff",
      boxShadow: h ? "0 0 26px rgba(255,45,52,0.6)" : "var(--glow-red)",
    },
    ghost: { background: h ? "var(--bg-3)" : "var(--bg-2)", color: "#fff", border: "1px solid var(--line-2)" },
    danger: {
      background: h ? "#ff1a22" : "transparent", color: h ? "#fff" : "#FF2D34",
      border: "1px solid #FF2D34", boxShadow: h ? "0 0 26px rgba(255,45,52,0.55)" : "none",
    },
  };
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto",
        padding: "12px 18px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.04em",
        transition: "all var(--dur)", ...V[variant], ...style,
      }}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function ViewTitle({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 26 }}>
      <div>
        {kicker && (
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: "var(--red-bright)", textTransform: "uppercase", marginBottom: 10 }}>
            {kicker}
          </div>
        )}
        <h1 className="display" style={{ fontSize: "clamp(26px, 3vw, 34px)", color: "#fff", margin: 0 }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function IconBtn({ icon, color, title, onClick }: { icon: string; color: string; title: string; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 32, height: 32, borderRadius: "var(--r-xs)", cursor: "pointer",
        background: h ? `${color}22` : "var(--bg-3)", border: `1px solid ${h ? color : "var(--line-2)"}`,
        color: h ? color : "var(--fg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "all var(--dur)",
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
