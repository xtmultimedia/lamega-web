"use client";

import React, { useEffect, useState } from "react";
import { Icon, OnAir, SocialIcon } from "@/components/ui";
import { NAV_LINKS } from "@/components/data";
import { INTRO_EVENT } from "@/components/landing/Intro";

// "INICIO" replays the tuner intro
const replayIntro = () => window.dispatchEvent(new Event(INTRO_EVENT));

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "all var(--dur) var(--ease-out)",
        background: scrolled ? "rgba(10,10,10,0.78)" : "rgba(10,10,10,0.16)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)", backdropFilter: "blur(22px) saturate(150%)",
        borderBottom: scrolled ? "1px solid var(--line-1)" : "1px solid transparent",
        boxShadow: scrolled ? "0 8px 30px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <div
        className="nav-inner"
        style={{
          maxWidth: 1440, margin: "0 auto", height: 78, padding: "0 clamp(20px, 4vw, 40px)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
        }}
      >
        {/* logo + badge */}
        <a href="#inicio" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 13, flexShrink: 0, zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/mega-logo.png" alt="La Mega" style={{ height: 36, width: "auto", filter: "drop-shadow(0 4px 14px rgba(227,30,36,0.45))" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em",
              color: "#fff", padding: "5px 10px", borderRadius: "var(--r-xs)",
              background: "linear-gradient(180deg, var(--red-bright), var(--red))", boxShadow: "var(--glow-red)",
            }}
          >
            99.9 FM
          </span>
        </a>

        {/* desktop nav links */}
        <nav className="nav-links" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} {...l} onClick={l.href === "#inicio" ? replayIntro : undefined} />
          ))}
        </nav>

        {/* right cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, zIndex: 2 }}>
          <a
            href="/pide"
            className="nav-cta"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: "var(--r-pill)",
              background: "linear-gradient(180deg, var(--red-bright), var(--red))", color: "#fff",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em",
              boxShadow: "var(--glow-red)", whiteSpace: "nowrap",
            }}
          >
            <Icon name="music" size={15} /> Pide tu canción
          </a>
          <div className="nav-social" style={{ display: "flex", gap: 7 }}>
            {["instagram", "tiktok", "facebook", "youtube", "spotify"].map((n) => (
              <SocialIcon key={n} name={n} size={15} />
            ))}
          </div>
          <a
            href="/admin"
            className="nav-admin"
            aria-label="Panel admin"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38,
              borderRadius: "var(--r-sm)", border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--fg-2)",
            }}
          >
            <Icon name="layout-dashboard" size={17} />
          </a>
          <button
            className="nav-burger"
            aria-label="Menú"
            onClick={() => setOpen((o) => !o)}
            style={{
              display: "none", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
              width: 44, height: 44, color: "#fff", cursor: "pointer", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name={open ? "x" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* full-screen mobile overlay */}
      <div
        className="nav-overlay"
        aria-hidden={!open}
        style={{
          position: "fixed", inset: 0, zIndex: 1,
          background: "radial-gradient(120% 90% at 50% 0%, #1a0608 0%, #0A0A0A 60%)",
          WebkitBackdropFilter: open ? "blur(8px)" : "none", backdropFilter: open ? "blur(8px)" : "none",
          display: "flex", flexDirection: "column", justifyContent: "center", padding: "90px 28px 40px",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          visibility: open ? "visible" : "hidden",
          transform: open ? "translateY(0)" : "translateY(-12px)",
          transition: "opacity var(--dur) var(--ease-out), transform var(--dur) var(--ease-out), visibility var(--dur)",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <OnAir />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => {
                setOpen(false);
                if (l.href === "#inicio") replayIntro();
              }}
              className="nav-ov-link"
              style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px, 9vw, 44px)",
                textTransform: "uppercase", letterSpacing: "-0.01em", color: "#fff", padding: "8px 0",
                display: "flex", alignItems: "center", gap: 16,
              }}
            >
              <span className="mono" style={{ fontSize: 13, color: "var(--red)", fontWeight: 700 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {l.label}
            </a>
          ))}
          <a
            href="/pide"
            className="nav-ov-link"
            style={{
              marginTop: 18, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(24px, 7vw, 34px)",
              textTransform: "uppercase", color: "var(--red-bright)", display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <Icon name="music" size={26} /> Pide tu canción
          </a>
          <a
            href="/admin"
            className="nav-ov-link"
            style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(20px, 6vw, 26px)",
              textTransform: "uppercase", color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 12, marginTop: 8,
            }}
          >
            <Icon name="layout-dashboard" size={22} /> Panel Admin
          </a>
        </nav>
        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          {["instagram", "tiktok", "facebook", "youtube", "spotify"].map((n) => (
            <SocialIcon key={n} name={n} size={20} />
          ))}
        </div>
      </div>

      <style>{`
        .nav-ov-link:hover{ color: var(--red-bright) !important; }
        @media (max-width: 1180px){ .nav-social{ display:none !important; } }
        @media (max-width: 1024px){
          .nav-links{ display:none !important; }
          .nav-admin{ display:none !important; }
          .nav-burger{ display:inline-flex !important; }
        }
        @media (max-width: 560px){ .nav-cta{ display:none !important; } }
        @media (min-width: 1025px){ .nav-overlay{ display:none !important; } }
      `}</style>
    </header>
  );
}

function NavLink({ label, href, onClick }: { label: string; href: string; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", padding: "10px 15px", fontFamily: "var(--font-display)", fontWeight: 600,
        fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase",
        color: hover ? "#fff" : "var(--fg-2)", transition: "color var(--dur)", whiteSpace: "nowrap",
      }}
    >
      {label}
      <span
        style={{
          position: "absolute", left: 15, right: 15, bottom: 6, height: 2, borderRadius: 2,
          background: "linear-gradient(90deg, var(--red), var(--red-bright))",
          transform: hover ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left",
          transition: "transform var(--dur) var(--ease-out)", boxShadow: "0 0 10px rgba(255,45,52,0.7)",
        }}
      />
    </a>
  );
}
