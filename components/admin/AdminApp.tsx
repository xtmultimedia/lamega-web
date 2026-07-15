"use client";

// Admin dashboard shell (Sidebar + Topbar) ported from
// design-reference/dashboard.jsx, with NextAuth logout and live data.

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui";
import { RadioProvider, useRadio } from "@/components/radio/RadioProvider";
import { APP_VERSION } from "@/lib/version";
import { canAccessSection, ROLE_LABELS, type Role } from "@/lib/roles";
import { UsuariosView } from "./UsuariosView";
import { DashboardView, SolicitudesView, PublicidadView, ConfiguracionView } from "./views";
import { ProgramacionView, LocutoresView, PlaylistsView, GaleriaView } from "./station-views";

const ADM_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "programacion", label: "Programación", icon: "calendar-days" },
  { id: "locutores", label: "Locutores", icon: "mic" },
  { id: "playlists", label: "Playlists", icon: "list-music" },
  { id: "galeria", label: "Galería", icon: "image" },
  { id: "publicidad", label: "Publicidad", icon: "megaphone" },
  { id: "solicitudes", label: "Solicitudes", icon: "inbox", badge: true },
  { id: "usuarios", label: "Usuarios", icon: "users" },
  { id: "configuracion", label: "Configuración", icon: "settings" },
];

function Sidebar({
  active, onSelect, open, role, onClose,
}: {
  active: string; onSelect: (id: string) => void; open: boolean; role: Role; onClose: () => void;
}) {
  const { stats } = useRadio();
  const nav = ADM_NAV.filter((n) => canAccessSection(role, n.id));
  return (
    <>
      <div
        onClick={onClose}
        className="adm-backdrop"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40,
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity var(--dur)",
        }}
      />
      <aside
        className="adm-sidebar"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 256, zIndex: 50,
          background: "#0c0c0e", borderRight: "1px solid var(--line-1)",
          display: "flex", flexDirection: "column", padding: "22px 16px",
          transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform var(--dur) var(--ease-out)",
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 22px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/mega-logo.png" alt="La Mega" style={{ height: 30, filter: "drop-shadow(0 3px 10px rgba(227,30,36,0.45))" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#fff",
              background: "linear-gradient(180deg, var(--red-bright), var(--red))", padding: "3px 7px", borderRadius: 4, letterSpacing: "0.06em",
            }}
          >
            99.9 FM
          </span>
        </a>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--fg-3)", padding: "0 8px 12px", textTransform: "uppercase" }}>
          Panel de control
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {nav.map((n) => {
            const on = active === n.id;
            const badge = n.badge && stats ? stats.requests_pending : null;
            return (
              <button
                key={n.id}
                onClick={() => { onSelect(n.id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: "var(--r-sm)",
                  border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                  background: on ? "linear-gradient(90deg, rgba(227,30,36,0.18), rgba(227,30,36,0.02))" : "transparent",
                  color: on ? "#fff" : "var(--fg-2)", position: "relative",
                  fontFamily: "var(--font-body)", fontWeight: on ? 600 : 500, fontSize: 14, transition: "all var(--dur)",
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--bg-2)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                {on && (
                  <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 999, background: "var(--red-bright)", boxShadow: "var(--glow-red)" }} />
                )}
                <Icon name={n.icon} size={19} color={on ? "var(--red-bright)" : "var(--fg-3)"} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {badge != null && badge > 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--red)", padding: "2px 7px", borderRadius: 999 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: "1px solid var(--line-1)", paddingTop: 14, marginTop: 8 }}>
          <a
            href="/pide"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: "var(--r-sm)", color: "var(--fg-2)", fontSize: 13, marginBottom: 6 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; }}
          >
            <Icon name="external-link" size={16} color="var(--red-bright)" /> Formulario público
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px" }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--red), var(--red-deep))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 800, color: "#fff", fontSize: 14,
              }}
            >
              LM
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{ROLE_LABELS[role]}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>La Mega 99.9 · v{APP_VERSION}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 30, height: 68, display: "flex", alignItems: "center", gap: 16,
        padding: "0 clamp(16px, 3vw, 32px)", background: "rgba(10,10,10,0.8)",
        WebkitBackdropFilter: "blur(18px)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--line-1)",
      }}
    >
      <button
        onClick={onMenu}
        className="adm-burger"
        aria-label="Menú"
        style={{
          display: "none", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
          width: 42, height: 42, color: "#fff", cursor: "pointer", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name="menu" size={20} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          La Mega <span style={{ color: "var(--red)" }}>99.9</span>
        </span>
        <span
          className="adm-live"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 999,
            background: "rgba(227,30,36,0.12)", border: "1px solid var(--line-red)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red-bright)", animation: "pulse-dot 1.3s infinite" }} />
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#fff" }}>EN VIVO</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          aria-label="Notificaciones"
          style={{
            position: "relative", width: 42, height: 42, borderRadius: "var(--r-sm)", background: "var(--bg-2)",
            border: "1px solid var(--line-2)", color: "var(--fg-1)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="bell" size={18} />
          <span style={{ position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: "50%", background: "var(--red-bright)", boxShadow: "0 0 8px var(--red-bright)" }} />
        </button>
        <div
          className="adm-avatar"
          style={{
            width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, var(--red), var(--red-deep))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, color: "#fff", fontSize: 14,
          }}
        >
          LM
        </div>
        <button
          aria-label="Salir"
          title="Cerrar sesión"
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            width: 42, height: 42, borderRadius: "var(--r-sm)", background: "var(--bg-2)", border: "1px solid var(--line-2)",
            color: "var(--fg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <Icon name="log-out" size={18} />
        </button>
      </div>
    </header>
  );
}

const VIEWS: Record<string, React.ComponentType<any>> = {
  dashboard: DashboardView,
  solicitudes: SolicitudesView,
  programacion: ProgramacionView,
  publicidad: PublicidadView,
  locutores: LocutoresView,
  playlists: PlaylistsView,
  galeria: GaleriaView,
  configuracion: ConfiguracionView,
  usuarios: UsuariosView,
};

function AdminShell({ role }: { role: Role }) {
  const [active, setActive] = useState("dashboard");
  const [sidebar, setSidebar] = useState(false);
  // Cosmetic guard — the API routes enforce roles server-side.
  const allowed = canAccessSection(role, active);
  const View = (allowed && VIEWS[active]) || (() => null);

  useEffect(() => {
    document.body.classList.add("no-vignette");
    const apply = () => setSidebar(window.innerWidth > 1024);
    apply();
    window.addEventListener("resize", apply);
    return () => {
      document.body.classList.remove("no-vignette");
      window.removeEventListener("resize", apply);
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", color: "var(--fg-1)", background: "#0A0A0A" }}>
      <Sidebar
        active={active}
        onSelect={setActive}
        open={sidebar}
        role={role}
        onClose={() => { if (window.innerWidth <= 1024) setSidebar(false); }}
      />
      <div className="adm-main" style={{ marginLeft: 256, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Topbar onMenu={() => setSidebar(true)} />
        <main className="adm-scroll" style={{ flex: 1, padding: "clamp(20px, 3vw, 36px)", maxWidth: 1280, width: "100%", margin: "0 auto" }}>
          <View onNavigate={setActive} />
        </main>
      </div>
      <style>{`
        @media (max-width: 1024px){
          .adm-main{ margin-left: 0 !important; }
          .adm-burger{ display: inline-flex !important; }
        }
        @media (min-width: 1025px){ .adm-backdrop{ display:none !important; } }
        @media (max-width: 560px){ .adm-live{ display:none !important; } }
      `}</style>
    </div>
  );
}

export function AdminApp({ role }: { role: Role }) {
  return (
    <RadioProvider>
      <AdminShell role={role} />
    </RadioProvider>
  );
}
