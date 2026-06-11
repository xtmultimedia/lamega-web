"use client";

import React from "react";
import { Icon } from "@/components/ui";
import { useRadio } from "@/components/radio/RadioProvider";

// Site-wide emergency banner driven by POST /api/radio/emergency.
export function EmergencyBanner() {
  const { emergency } = useRadio();
  if (!emergency.active) return null;
  return (
    <div
      role="alert"
      style={{
        position: "fixed", top: 78, left: 0, right: 0, zIndex: 99,
        background: "linear-gradient(90deg, var(--red-deep), var(--red), var(--red-deep))",
        borderBottom: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 6px 30px rgba(227,30,36,0.5)",
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      }}
    >
      <Icon name="triangle-alert" size={18} color="#fff" />
      <span
        className="mono"
        style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#fff", textTransform: "uppercase" }}
      >
        {emergency.message || "Transmisión en modo emergencia"}
      </span>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "pulse-dot 1.2s infinite" }} />
    </div>
  );
}
