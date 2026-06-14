"use client";

// Admin dashboard views (ported from design-reference/dashboard-views.jsx).
// Dashboard / Solicitudes / Publicidad are wired to the real API + SSE;
// Programación / Locutores / Playlists / Configuración keep the design's
// demo data (out of scope for the automation API).

import React, { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { useRadio } from "@/components/radio/RadioProvider";
import { AdmButton, Badge, Card, IconBtn, Toggle, ViewTitle } from "./primitives";
import { SolicitudesTable, useRequests } from "./requests";
import { DEFAULT_FOOTER, type FooterColumn } from "@/lib/footer";

/* ---------- Stat cards (live) ---------- */
function StatCard({ s }: { s: { label: string; value: string; icon: string; hue: string; live?: boolean; delta: string } }) {
  return (
    <Card hover pad={20} style={{ position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden="true"
        style={{ position: "absolute", right: -20, top: -20, width: 90, height: 90, borderRadius: "50%", background: `radial-gradient(circle, ${s.hue}33, transparent 70%)` }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span
          style={{
            width: 42, height: 42, borderRadius: "var(--r-sm)", background: `${s.hue}1f`, border: `1px solid ${s.hue}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name={s.icon} size={20} color={s.hue} />
        </span>
        {s.live && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.hue, animation: "pulse-dot 1.3s infinite", boxShadow: `0 0 10px ${s.hue}` }} />
            <span className="mono" style={{ fontSize: 10, color: s.hue, fontWeight: 700 }}>LIVE</span>
          </span>
        )}
      </div>
      <div className="display" style={{ fontSize: 36, color: "#fff", lineHeight: 1 }}>{s.value}</div>
      <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 6 }}>{s.label}</div>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 10 }}>{s.delta}</div>
    </Card>
  );
}

function StatsRow() {
  const { stats, queueCount } = useRadio();
  const n = (v: number | null | undefined) => (v ?? 0).toLocaleString("es-EC");
  const cards = [
    { label: "Oyentes en vivo", value: n(stats?.listeners), icon: "radio", hue: "#FF2D34", live: true, delta: "actualizado por cabina" },
    { label: "Solicitudes hoy", value: n(stats?.requests_today), icon: "inbox", hue: "#16C8E8", delta: `${n(stats?.requests_pending)} pendientes` },
    { label: "Campañas activas", value: n(stats?.active_campaigns), icon: "megaphone", hue: "#A855F7", delta: "comercial" },
    { label: "Canciones en cola", value: n(queueCount ?? stats?.queue_length), icon: "list-music", hue: "#1DB954", delta: "aprobadas, listas al aire" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 26 }}>
      {cards.map((s) => (
        <StatCard key={s.label} s={s} />
      ))}
    </div>
  );
}

/* ---------- Quick actions ---------- */
function QuickActions() {
  const { emergency } = useRadio();
  const [toast, setToast] = useState<string | null>(null);
  const fire = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };
  const toggleEmergency = async () => {
    const next = !emergency.active;
    const res = await fetch("/api/admin/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    if (res.ok) fire(next ? "⚠ Modo emergencia ACTIVADO" : "Modo emergencia desactivado");
    else fire("No se pudo cambiar el modo emergencia");
  };
  return (
    <Card style={{ marginBottom: 26 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 16 }}>
        Acciones rápidas
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <AdmButton icon="play" onClick={() => fire("Canción enviada a cabina · al aire en segundos")}>Poner canción al aire</AdmButton>
        <AdmButton variant="ghost" icon="megaphone" onClick={() => fire("Anuncio urgente programado")}>Anuncio urgente</AdmButton>
        <AdmButton variant="danger" icon="triangle-alert" onClick={toggleEmergency}>
          {emergency.active ? "Desactivar emergencia" : "Modo emergencia"}
        </AdmButton>
      </div>
      {emergency.active && (
        <div
          style={{
            marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: "rgba(227,30,36,0.12)",
            border: "1px solid var(--line-red)", color: "var(--red-bright)", display: "flex", alignItems: "center", gap: 10, fontSize: 14,
          }}
        >
          <Icon name="triangle-alert" size={17} />
          Modo emergencia activo{emergency.message ? ` — ${emergency.message}` : ""}
        </div>
      )}
      {toast && (
        <div
          style={{
            marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: "rgba(29,185,84,0.12)",
            border: "1px solid rgba(29,185,84,0.4)", color: "#5fe08a", display: "flex", alignItems: "center", gap: 10, fontSize: 14,
          }}
        >
          <Icon name="check-circle" size={17} color="#1DB954" />
          {toast}
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   VIEWS
   ============================================================ */
export function DashboardView({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { rows, act } = useRequests();
  return (
    <>
      <ViewTitle kicker="Resumen en vivo" title="Dashboard" />
      <StatsRow />
      <QuickActions />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 20, color: "#fff", margin: 0 }}>Solicitudes recientes</h2>
        <span className="mono" style={{ fontSize: 12, color: "var(--red-bright)", cursor: "pointer" }} onClick={() => onNavigate?.("solicitudes")}>
          Ver todas →
        </span>
      </div>
      <SolicitudesTable rows={rows} act={act} limit={6} />
    </>
  );
}

export function SolicitudesView() {
  const { rows, act } = useRequests();
  const [filter, setFilter] = useState("todas");
  const chips = ["todas", "pending", "approved", "on_air", "rejected"];
  const label: Record<string, string> = {
    todas: "Todas", pending: "Pendientes", approved: "En cola", on_air: "Al aire", rejected: "Rechazadas",
  };
  const view = filter === "todas" ? rows : rows.filter((r) => r.status === filter);
  return (
    <>
      <ViewTitle kicker="Bandeja de entrada" title="Solicitudes" />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: "9px 16px", borderRadius: "var(--r-pill)", cursor: "pointer",
              border: `1px solid ${filter === c ? "var(--red)" : "var(--line-2)"}`,
              background: filter === c ? "rgba(227,30,36,0.14)" : "var(--bg-2)",
              color: filter === c ? "#fff" : "var(--fg-2)", fontFamily: "var(--font-display)", fontWeight: 600,
              fontSize: 13, textTransform: "uppercase", letterSpacing: "0.03em",
            }}
          >
            {label[c]}
          </button>
        ))}
      </div>
      <SolicitudesTable rows={view} act={act} />
    </>
  );
}

/* ---------- Publicidad (live from DB) ---------- */
interface CampaignRow {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  adType: string;
  duration: string | null;
  budget: string | null;
  audience: string[];
  brief: string | null;
  status: string;
  createdAt: string;
}

export function PublicidadView() {
  const [list, setList] = useState<CampaignRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/admin/campaigns")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setList(d.campaigns);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);
  return (
    <>
      <ViewTitle kicker="Campañas publicitarias" title="Publicidad" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loaded && list.length === 0 && (
          <Card>
            <div style={{ color: "var(--fg-3)", fontSize: 14, textAlign: "center", padding: 10 }}>
              Aún no hay solicitudes de publicidad. Llegan desde la pestaña “Publicita en La Mega” de /pide.
            </div>
          </Card>
        )}
        {list.map((c) => (
          <Card key={c.id} pad={18} hover>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 46, height: 46, borderRadius: "var(--r-sm)", background: "var(--bg-3)", border: "1px solid var(--line-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Icon name="building-2" size={20} color="var(--fg-2)" />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{c.businessName}</div>
                <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
                  {c.adType}
                  {c.duration ? ` · ${c.duration}` : ""}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>
                  {c.contactName} · {c.email}
                  {c.phone ? ` · ${c.phone}` : ""}
                </div>
              </div>
              <div style={{ minWidth: 130 }}>
                <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{c.budget || "Presupuesto N/D"}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>
                  {c.audience.length ? c.audience.join(", ") : "Público N/D"}
                </div>
              </div>
              <Badge kind={c.status === "active" ? "activa" : c.status === "paused" ? "pausada" : "nueva"} />
            </div>
            {c.brief && <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 12, lineHeight: 1.5 }}>“{c.brief}”</div>}
          </Card>
        ))}
      </div>
    </>
  );
}

interface StationConfigForm {
  frequency: string;
  city: string;
  coverage: string;
  slogan: string;
  streamOn: boolean;
  tvOn: boolean;
  pushOn: boolean;
  autoOn: boolean;
  maintenance: boolean;
  footer: FooterColumn[];
}

export function ConfiguracionView() {
  const [cfg, setCfg] = useState<StationConfigForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        // the API hands us footer parsed (array | null); show defaults when empty
        const footer: FooterColumn[] =
          Array.isArray(d.config?.footer) && d.config.footer.length ? d.config.footer : DEFAULT_FOOTER;
        setCfg({ ...d.config, footer });
      })
      .catch(() => {});
  }, []);

  const setField = (k: keyof StationConfigForm) => (v: string | boolean) =>
    setCfg((c) => (c ? { ...c, [k]: v } : c));

  // ---- footer editor helpers ----
  const setFooter = (fn: (f: FooterColumn[]) => FooterColumn[]) =>
    setCfg((c) => (c ? { ...c, footer: fn(c.footer) } : c));
  const addColumn = () => setFooter((f) => [...f, { title: "Nueva columna", links: [] }]);
  const removeColumn = (ci: number) => setFooter((f) => f.filter((_, i) => i !== ci));
  const setColTitle = (ci: number, title: string) =>
    setFooter((f) => f.map((c, i) => (i === ci ? { ...c, title } : c)));
  const addLink = (ci: number) =>
    setFooter((f) => f.map((c, i) => (i === ci ? { ...c, links: [...c.links, { label: "Nuevo enlace", url: "" }] } : c)));
  const removeLink = (ci: number, li: number) =>
    setFooter((f) => f.map((c, i) => (i === ci ? { ...c, links: c.links.filter((_, j) => j !== li) } : c)));
  const setLink = (ci: number, li: number, key: "label" | "url", v: string) =>
    setFooter((f) =>
      f.map((c, i) =>
        i === ci ? { ...c, links: c.links.map((l, j) => (j === li ? { ...l, [key]: v } : l)) } : c,
      ),
    );

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: cfg.frequency,
          city: cfg.city,
          coverage: cfg.coverage,
          slogan: cfg.slogan,
          streamOn: cfg.streamOn,
          tvOn: cfg.tvOn,
          pushOn: cfg.pushOn,
          autoOn: cfg.autoOn,
          maintenance: cfg.maintenance,
          footer: cfg.footer,
        }),
      });
      if (!res.ok) throw new Error();
      setNote({ ok: true, msg: "Configuración guardada — el sitio público ya muestra los nuevos datos." });
    } catch {
      setNote({ ok: false, msg: "No se pudo guardar. Inténtalo de nuevo." });
    } finally {
      setSaving(false);
      setTimeout(() => setNote(null), 3500);
    }
  };

  const fields: { k: keyof StationConfigForm; label: string }[] = [
    { k: "frequency", label: "Frecuencia" },
    { k: "city", label: "Ciudad" },
    { k: "coverage", label: "Cobertura" },
    { k: "slogan", label: "Eslogan" },
  ];
  const rows: { k: keyof StationConfigForm; label: string; desc: string; danger?: boolean }[] = [
    { k: "streamOn", label: "Stream en vivo", desc: "Transmisión 99.9 FM activa en la web y la app." },
    { k: "tvOn", label: "Mega TV", desc: "Señal de video en directo desde la cabina." },
    { k: "pushOn", label: "Notificaciones push", desc: "Alertas de concursos y artistas invitados." },
    { k: "autoOn", label: "Programación automática", desc: "Reproduce Mega Mix fuera del horario en vivo." },
    { k: "maintenance", label: "Modo mantenimiento", desc: "Muestra una página de espera al público.", danger: true },
  ];

  if (!cfg) {
    return (
      <>
        <ViewTitle kicker="Ajustes de la estación" title="Configuración" />
        <Card>
          <div style={{ color: "var(--fg-3)", fontSize: 14, textAlign: "center", padding: 10 }}>Cargando configuración…</div>
        </Card>
      </>
    );
  }

  return (
    <>
      <ViewTitle kicker="Ajustes de la estación" title="Configuración">
        <AdmButton icon={saving ? "loader-2" : "save"} onClick={save}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </AdmButton>
      </ViewTitle>
      {note && (
        <div
          style={{
            marginBottom: 16, padding: "12px 16px", borderRadius: "var(--r-sm)",
            background: note.ok ? "rgba(29,185,84,0.12)" : "rgba(227,30,36,0.12)",
            border: note.ok ? "1px solid rgba(29,185,84,0.4)" : "1px solid var(--line-red)",
            color: note.ok ? "#5fe08a" : "var(--red-bright)",
            display: "flex", alignItems: "center", gap: 10, fontSize: 14,
          }}
        >
          <Icon name={note.ok ? "check-circle" : "triangle-alert"} size={17} />
          {note.msg}
        </div>
      )}
      <Card style={{ marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6 }}>
          Datos de la señal
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 14 }}>
          {fields.map(({ k, label }) => (
            <div key={k}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              <input
                value={cfg[k] as string}
                onChange={(e) => setField(k)(e.target.value)}
                style={{
                  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
                  padding: "11px 12px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 14,
                }}
              />
            </div>
          ))}
        </div>
      </Card>
      <Card pad={0}>
        {rows.map((r, i) => (
          <div
            key={r.k}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 22px",
              borderTop: i ? "1px solid var(--line-1)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: r.danger ? "#FF2D34" : "#fff" }}>{r.label}</div>
              <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 3 }}>{r.desc}</div>
            </div>
            <Toggle on={cfg[r.k] as boolean} onChange={setField(r.k)} color={r.danger ? "var(--red)" : "var(--green)"} />
          </div>
        ))}
      </Card>

      {/* ---- Footer editor ---- */}
      <Card style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)", textTransform: "uppercase" }}>
            Footer del sitio
          </div>
          <AdmButton icon="plus" onClick={addColumn}>Agregar columna</AdmButton>
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 16 }}>
          Columnas y enlaces que aparecen al pie de la web. La URL es opcional: con URL el enlace es clickeable, sin URL queda como texto.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {cfg.footer.map((col, ci) => (
            <div
              key={ci}
              style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: 14 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <input
                  value={col.title}
                  onChange={(e) => setColTitle(ci, e.target.value)}
                  placeholder="Título de columna"
                  style={{
                    flex: 1, background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: "var(--r-xs)",
                    padding: "9px 11px", color: "#fff", fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600,
                  }}
                />
                <IconBtn icon="trash-2" color="var(--red)" title="Eliminar columna" onClick={() => removeColumn(ci)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col.links.map((lnk, li) => (
                  <div key={li} style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 8, borderBottom: li < col.links.length - 1 ? "1px solid var(--line-1)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        value={lnk.label}
                        onChange={(e) => setLink(ci, li, "label", e.target.value)}
                        placeholder="Etiqueta"
                        style={{
                          flex: 1, background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: "var(--r-xs)",
                          padding: "8px 10px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 13,
                        }}
                      />
                      <IconBtn icon="x" color="var(--red)" title="Eliminar enlace" onClick={() => removeLink(ci, li)} />
                    </div>
                    <input
                      value={lnk.url ?? ""}
                      onChange={(e) => setLink(ci, li, "url", e.target.value)}
                      placeholder="URL (opcional): https://… , mailto:… , /pagina"
                      style={{
                        background: "var(--bg)", border: "1px solid var(--line-1)", borderRadius: "var(--r-xs)",
                        padding: "7px 10px", color: "var(--fg-2)", fontFamily: "var(--font-mono)", fontSize: 12,
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => addLink(ci)}
                style={{
                  marginTop: 12, width: "100%", background: "transparent", border: "1px dashed var(--line-2)",
                  borderRadius: "var(--r-xs)", padding: "8px 10px", color: "var(--fg-2)", fontSize: 13, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Icon name="plus" size={14} /> Agregar enlace
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
