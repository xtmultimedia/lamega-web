"use client";

// Editable station data views: Programación, Locutores, Playlists.
// Load from GET /api/admin/station, edit locally, persist with the
// "Guardar cambios" button (PUT bulk replace).

import React, { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import type { HostSocial } from "@/lib/hosts";
import { AdmButton, Card, IconBtn, Toggle, ViewTitle } from "./primitives";

export interface ShowRow {
  id?: string;
  name: string;
  host: string; // display label, derived from hostIds
  hostIds: string[]; // the real link
  startTime: string;
  endTime: string;
  days: "semana" | "sabado" | "domingo";
  slot?: string | null;
  blurb?: string | null;
  hue: string;
  isOn: boolean;
  featured: boolean;
}

// bio/socials must be carried here even though this view doesn't edit them:
// the whole list is sent back on save, so a missing field would wipe what the
// locutor wrote in Mi Perfil.
export interface HostRow {
  id?: string;
  name: string;
  alias: string;
  show: string;
  hue: string;
  photoUrl?: string | null;
  bio?: string | null;
  socials?: HostSocial[] | null;
  showsCount: number;
}

// Uploads one file to /api/admin/upload and returns its public URL.
export async function uploadFile(file: File): Promise<{ url: string; kind: "image" | "video" }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error(d?.error || "Error al subir el archivo");
  }
  return res.json();
}

export interface PlaylistRow {
  id?: string;
  name: string;
  count: number;
  hue1: string;
  hue2: string;
  spotifyUrl?: string | null;
}

const HUES = ["#E31E24", "#FF2D34", "#D0307A", "#7A1FC4", "#1683C8", "#1DB954", "#8E0F13", "#E0A82E"];
const DAY_LABEL: Record<string, string> = { semana: "Lun – Vie", sabado: "Sábado", domingo: "Domingo" };

function useStation() {
  const [shows, setShows] = useState<ShowRow[] | null>(null);
  const [hosts, setHosts] = useState<HostRow[] | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/station")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setShows(d.shows);
        setHosts(d.hosts);
        setPlaylists(d.playlists);
      })
      .catch(() => {});
  }, []);

  const save = async (part: { shows?: ShowRow[]; hosts?: HostRow[]; playlists?: PlaylistRow[] }) => {
    const res = await fetch("/api/admin/station", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(part),
    });
    if (!res.ok) throw new Error();
    const d = await res.json();
    setShows(d.shows);
    setHosts(d.hosts);
    setPlaylists(d.playlists);
  };

  return { shows, setShows, hosts, setHosts, playlists, setPlaylists, save };
}

function SaveNote({ note }: { note: { ok: boolean; msg: string } | null }) {
  if (!note) return null;
  return (
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
  );
}

function useSaveState() {
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);
  const run = async (fn: () => Promise<void>, okMsg: string) => {
    setSaving(true);
    setNote(null);
    try {
      await fn();
      setNote({ ok: true, msg: okMsg });
    } catch {
      setNote({ ok: false, msg: "No se pudo guardar. Inténtalo de nuevo." });
    } finally {
      setSaving(false);
      setTimeout(() => setNote(null), 3500);
    }
  };
  return { saving, note, run };
}

const FIELD: React.CSSProperties = {
  background: "var(--bg-3)", border: "1px solid var(--line-2)", color: "#fff",
  borderRadius: "var(--r-sm)", padding: "9px 10px", fontFamily: "var(--font-body)", fontSize: 13.5,
};

function HuePicker({ value, onChange }: { value: string; onChange: (h: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {HUES.map((h) => (
        <button
          key={h}
          type="button"
          title={h}
          onClick={() => onChange(h)}
          style={{
            width: 18, height: 18, borderRadius: "50%", cursor: "pointer", background: h,
            border: value === h ? "2px solid #fff" : "2px solid transparent",
            boxShadow: value === h ? `0 0 10px ${h}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function Loading({ title, kicker }: { title: string; kicker: string }) {
  return (
    <>
      <ViewTitle kicker={kicker} title={title} />
      <Card>
        <div style={{ color: "var(--fg-3)", fontSize: 14, textAlign: "center", padding: 10 }}>Cargando…</div>
      </Card>
    </>
  );
}

// Multi-select of locutores for a program. Replaces the old single <select>,
// which couldn't express the multi-host reality already in the data
// ("Joselyn Hernández & Marcos Cruz"). No selection = "Automático".
function HostPicker({
  hosts, selected, label, onToggle,
}: {
  hosts: HostRow[]; selected: string[]; label: string; onToggle: (hostId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const named = hosts.filter((h) => h.id && selected.includes(h.id));
  const text = named.length ? named.map((h) => h.name).join(" & ") : label || "Automático";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={text}
        style={{
          ...FIELD, cursor: "pointer", maxWidth: 190, display: "flex", alignItems: "center", gap: 7,
          textAlign: "left", whiteSpace: "nowrap", overflow: "hidden",
        }}
      >
        <Icon name="mic" size={15} color="var(--fg-3)" />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {named.length > 1 ? `${named.length} locutores` : text}
        </span>
        <Icon name="chevron-down" size={14} color="var(--fg-3)" />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 61, minWidth: 210, maxHeight: 260,
              overflowY: "auto", background: "var(--bg-2)", border: "1px solid var(--line-2)",
              borderRadius: "var(--r-sm)", boxShadow: "var(--shadow-lg)", padding: 6,
            }}
          >
            {hosts.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--fg-3)", padding: 8 }}>No hay locutores cargados.</div>
            )}
            {hosts.map((h) =>
              h.id ? (
                <label
                  key={h.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: "var(--r-xs)",
                    cursor: "pointer", fontSize: 13, color: "#fff",
                  }}
                >
                  <input type="checkbox" checked={selected.includes(h.id)} onChange={() => onToggle(h.id!)} />
                  {h.name}
                </label>
              ) : (
                <div key={h.name} style={{ fontSize: 11, color: "var(--fg-3)", padding: "7px 8px" }}>
                  {h.name} — guardá primero para poder asignarlo
                </div>
              ),
            )}
            <div style={{ borderTop: "1px solid var(--line-1)", marginTop: 6, paddingTop: 6, fontSize: 11, color: "var(--fg-3)", padding: "8px" }}>
              Sin selección = <strong>Automático</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   PROGRAMACIÓN
   ============================================================ */
export function ProgramacionView() {
  const { shows, setShows, hosts, save } = useStation();
  const { saving, note, run } = useSaveState();
  const [drag, setDrag] = useState<number | null>(null);

  if (!shows) return <Loading kicker="Parrilla editable" title="Programación" />;

  const set = (i: number, patch: Partial<ShowRow>) =>
    setShows((s) => s!.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const del = (i: number) => setShows((s) => s!.filter((_, j) => j !== i));
  const add = () =>
    setShows((s) => [
      ...s!,
      { name: "Nuevo programa", host: "Automático", hostIds: [], startTime: "00:00", endTime: "01:00", days: "semana", hue: "#E31E24", isOn: true, featured: false },
    ]);
  const onDrop = (i: number) => {
    if (drag === null || drag === i) return;
    setShows((s) => {
      const c = [...s!];
      const [m] = c.splice(drag, 1);
      c.splice(i, 0, m);
      return c;
    });
    setDrag(null);
  };

  // Toggling a locutor rewrites BOTH hostIds (the real link) and host (the
  // display label) so /api/station and CurrentProgram never drift from it.
  const toggleHost = (i: number, hostId: string) => {
    const cur = shows[i].hostIds ?? [];
    const next = cur.includes(hostId) ? cur.filter((x) => x !== hostId) : [...cur, hostId];
    const label =
      next
        .map((id) => (hosts ?? []).find((h) => h.id === id)?.name)
        .filter(Boolean)
        .join(" & ") || "Automático";
    set(i, { hostIds: next, host: label });
  };

  return (
    <>
      <ViewTitle kicker="Parrilla editable" title="Programación">
        <div style={{ display: "flex", gap: 10 }}>
          <AdmButton variant="ghost" icon="plus" onClick={add}>Nuevo programa</AdmButton>
          <AdmButton icon={saving ? "loader-2" : "save"} onClick={() => run(() => save({ shows }), "Programación guardada — la web pública ya muestra la nueva parrilla.")}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </AdmButton>
        </div>
      </ViewTitle>
      <SaveNote note={note} />
      <div className="mono" style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="grip-vertical" size={15} /> Arrastra para reordenar · edita nombre, horario, día y locutor · marca ★ para destacarlo en la portada
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shows.map((s, i) => (
          <div
            key={s.id ?? `new-${i}`}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: "var(--r-md)",
              background: "var(--bg-1)", border: "1px solid var(--line-1)", borderLeft: `4px solid ${s.hue}`,
              opacity: drag === i ? 0.4 : 1, transition: "opacity var(--dur)", flexWrap: "wrap",
            }}
          >
            <Icon name="grip-vertical" size={18} color="var(--fg-3)" style={{ flexShrink: 0, cursor: "grab" }} />
            <input
              value={s.startTime}
              onChange={(e) => set(i, { startTime: e.target.value })}
              style={{ ...FIELD, width: 64, fontFamily: "var(--font-mono)", textAlign: "center", color: s.hue, fontWeight: 700 }}
              placeholder="06:00"
            />
            <span className="mono" style={{ color: "var(--fg-3)" }}>–</span>
            <input
              value={s.endTime}
              onChange={(e) => set(i, { endTime: e.target.value })}
              style={{ ...FIELD, width: 64, fontFamily: "var(--font-mono)", textAlign: "center", color: s.hue, fontWeight: 700 }}
              placeholder="10:00"
            />
            <input
              value={s.name}
              onChange={(e) => set(i, { name: e.target.value })}
              style={{ ...FIELD, flex: 1, minWidth: 150, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15 }}
              placeholder="Nombre del programa"
            />
            <select value={s.days} onChange={(e) => set(i, { days: e.target.value as ShowRow["days"] })} style={{ ...FIELD, cursor: "pointer" }}>
              {Object.entries(DAY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <HostPicker
              hosts={hosts ?? []}
              selected={s.hostIds ?? []}
              label={s.host}
              onToggle={(hostId) => toggleHost(i, hostId)}
            />
            <HuePicker value={s.hue} onChange={(hue) => set(i, { hue })} />
            <button
              type="button"
              title={s.featured ? "Quitar de destacados" : "Destacar en portada"}
              onClick={() => set(i, { featured: !s.featured })}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: s.featured ? "#E0A82E" : "var(--fg-3)", display: "flex",
              }}
            >
              <Icon name="star" size={18} strokeWidth={s.featured ? 2.6 : 2} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: s.isOn ? "#1DB954" : "var(--fg-3)", minWidth: 28 }}>{s.isOn ? "ON" : "OFF"}</span>
              <Toggle on={s.isOn} onChange={(v) => set(i, { isOn: v })} color="var(--green)" />
            </div>
            <IconBtn icon="trash-2" color="#FF2D34" title="Eliminar" onClick={() => del(i)} />
          </div>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 16 }}>
        ★ Los programas destacados (máx. 4 recomendado) aparecen como tarjetas grandes en la portada. La parrilla semanal usa el día asignado a cada bloque.
      </div>
    </>
  );
}

/* ============================================================
   LOCUTORES
   ============================================================ */
export function LocutoresView() {
  const { hosts, setHosts, shows, save } = useStation();
  const { saving, note, run } = useSaveState();

  if (!hosts) return <Loading kicker="Equipo al aire" title="Locutores" />;

  const set = (i: number, patch: Partial<HostRow>) =>
    setHosts((h) => h!.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const del = (i: number) => setHosts((h) => h!.filter((_, j) => j !== i));
  const add = () => setHosts((h) => [...h!, { name: "Nuevo locutor", alias: "", show: "", hue: "#E31E24", showsCount: 0 }]);

  const pickPhoto = (i: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { url } = await uploadFile(file);
        set(i, { photoUrl: url });
      } catch (e: any) {
        alert(e?.message || "Error al subir la foto");
      }
    };
    input.click();
  };

  const showNames = Array.from(new Set((shows ?? []).map((s) => s.name)));

  return (
    <>
      <ViewTitle kicker="Equipo al aire" title="Locutores">
        <div style={{ display: "flex", gap: 10 }}>
          <AdmButton variant="ghost" icon="user-plus" onClick={add}>Añadir locutor</AdmButton>
          <AdmButton icon={saving ? "loader-2" : "save"} onClick={() => run(() => save({ hosts }), "Locutores guardados.")}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </AdmButton>
        </div>
      </ViewTitle>
      <SaveNote note={note} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {hosts.map((l, i) => (
          <Card key={l.id ?? `new-${i}`} style={{ textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <IconBtn icon="trash-2" color="#FF2D34" title="Eliminar" onClick={() => del(i)} />
            </div>
            <div style={{ position: "relative", width: 76, margin: "0 auto 14px" }}>
              <div
                style={{
                  width: 76, height: 76, borderRadius: "50%", overflow: "hidden",
                  background: l.photoUrl ? `url(${l.photoUrl}) center/cover` : `radial-gradient(circle at 35% 30%, ${l.hue}, #150708)`,
                  border: "2px solid var(--line-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {!l.photoUrl && <Icon name="mic" size={30} color="#fff" />}
              </div>
              <button
                type="button"
                title={l.photoUrl ? "Cambiar foto" : "Subir foto"}
                onClick={() => pickPhoto(i)}
                style={{
                  position: "absolute", right: -8, bottom: -4, width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(180deg, var(--red-bright), var(--red))", border: "2px solid var(--bg-1)",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "var(--glow-red)",
                }}
              >
                <Icon name="camera" size={14} />
              </button>
              {l.photoUrl && (
                <button
                  type="button"
                  title="Quitar foto"
                  onClick={() => set(i, { photoUrl: null })}
                  style={{
                    position: "absolute", left: -8, bottom: -4, width: 26, height: 26, borderRadius: "50%",
                    background: "var(--bg-3)", border: "1px solid var(--line-2)", color: "var(--fg-2)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
            <input
              value={l.name}
              onChange={(e) => set(i, { name: e.target.value })}
              style={{ ...FIELD, width: "100%", textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "uppercase", marginBottom: 8 }}
              placeholder="Nombre"
            />
            <input
              value={l.alias}
              onChange={(e) => set(i, { alias: e.target.value })}
              style={{ ...FIELD, width: "100%", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: l.hue, marginBottom: 8 }}
              placeholder="Alias (ej. El Búho)"
            />
            <select value={l.show} onChange={(e) => set(i, { show: e.target.value })} style={{ ...FIELD, width: "100%", cursor: "pointer", marginBottom: 10 }}>
              <option value="">— Sin programa —</option>
              {showNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <HuePicker value={l.hue} onChange={(hue) => set(i, { hue })} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   PLAYLISTS
   ============================================================ */
export function PlaylistsView() {
  const { playlists, setPlaylists, save } = useStation();
  const { saving, note, run } = useSaveState();

  if (!playlists) return <Loading kicker="Listas en rotación" title="Playlists" />;

  const set = (i: number, patch: Partial<PlaylistRow>) =>
    setPlaylists((p) => p!.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const del = (i: number) => setPlaylists((p) => p!.filter((_, j) => j !== i));
  const add = () => setPlaylists((p) => [...p!, { name: "Nueva playlist", count: 0, hue1: "#E31E24", hue2: "#7A1FC4", spotifyUrl: "" }]);

  return (
    <>
      <ViewTitle kicker="Listas en rotación" title="Playlists">
        <div style={{ display: "flex", gap: 10 }}>
          <AdmButton variant="ghost" icon="plus" onClick={add}>Nueva playlist</AdmButton>
          <AdmButton icon={saving ? "loader-2" : "save"} onClick={() => run(() => save({ playlists }), "Playlists guardadas.")}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </AdmButton>
        </div>
      </ViewTitle>
      <SaveNote note={note} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {playlists.map((p, i) => (
          <Card key={p.id ?? `new-${i}`} pad={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: "var(--r-sm)", background: `linear-gradient(135deg, ${p.hue1}, ${p.hue2})`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Icon name="music" size={20} color="#fff" />
              </div>
              <input
                value={p.name}
                onChange={(e) => set(i, { name: e.target.value })}
                style={{ ...FIELD, width: 180, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase" }}
                placeholder="Nombre"
              />
              <label className="mono" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--fg-3)" }}>
                Canciones
                <input
                  type="number"
                  min={0}
                  value={p.count}
                  onChange={(e) => set(i, { count: Math.max(0, Number(e.target.value) || 0) })}
                  style={{ ...FIELD, width: 80, fontFamily: "var(--font-mono)" }}
                />
              </label>
              <input
                value={p.spotifyUrl ?? ""}
                onChange={(e) => set(i, { spotifyUrl: e.target.value })}
                style={{ ...FIELD, flex: 1, minWidth: 200 }}
                placeholder="https://open.spotify.com/playlist/…"
              />
              <HuePicker value={p.hue1} onChange={(hue1) => set(i, { hue1 })} />
              <IconBtn icon="trash-2" color="#FF2D34" title="Eliminar" onClick={() => del(i)} />
            </div>
          </Card>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 16 }}>
        El enlace de Spotify se abre desde el botón “Escuchar” de cada playlist en la portada.
      </div>
    </>
  );
}

/* ============================================================
   GALERÍA (fotos y videos de eventos)
   ============================================================ */
interface MediaRow {
  id?: string;
  kind: "image" | "video" | "youtube";
  url: string;
  title: string;
}

function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

export function GaleriaView() {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const { saving, note, run } = useSaveState();

  useEffect(() => {
    fetch("/api/admin/media")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setItems(d.items))
      .catch(() => {});
  }, []);

  if (!items) return <Loading kicker="Fotos y videos" title="Galería" />;

  const set = (i: number, patch: Partial<MediaRow>) =>
    setItems((m) => m!.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const del = (i: number) => setItems((m) => m!.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) =>
    setItems((m) => {
      const c = [...m!];
      const j = i + dir;
      if (j < 0 || j >= c.length) return c;
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const pickFiles = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/mp4,video/webm,video/quicktime";
    input.multiple = true;
    input.onchange = async () => {
      const files = [...(input.files ?? [])];
      if (!files.length) return;
      setUploading(true);
      try {
        for (const f of files) {
          const { url, kind } = await uploadFile(f);
          setItems((m) => [{ kind, url, title: "" }, ...m!]);
        }
      } catch (e: any) {
        alert(e?.message || "Error al subir");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const addYoutube = () => {
    const url = ytUrl.trim();
    if (!url) return;
    if (!ytId(url)) {
      alert("Pega un enlace válido de YouTube (youtube.com/watch?v=… o youtu.be/…)");
      return;
    }
    setItems((m) => [{ kind: "youtube", url, title: "" }, ...m!]);
    setYtUrl("");
  };

  const save = async () => {
    const res = await fetch("/api/admin/media", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error();
    const d = await res.json();
    setItems(d.items);
  };

  return (
    <>
      <ViewTitle kicker="Fotos y videos de eventos" title="Galería">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <AdmButton variant="ghost" icon={uploading ? "loader-2" : "upload-cloud"} onClick={pickFiles}>
            {uploading ? "Subiendo…" : "Subir foto / video"}
          </AdmButton>
          <AdmButton icon={saving ? "loader-2" : "save"} onClick={() => run(save, "Galería guardada — ya es visible en la portada.")}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </AdmButton>
        </div>
      </ViewTitle>
      <SaveNote note={note} />

      {/* add YouTube link */}
      <Card pad={16} style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Icon name="youtube" size={20} color="#FF0000" />
          <input
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addYoutube()}
            placeholder="Pega un enlace de YouTube (video o short) y presiona Agregar…"
            style={{ ...FIELD, flex: 1, minWidth: 240 }}
          />
          <AdmButton variant="ghost" icon="plus" onClick={addYoutube}>Agregar</AdmButton>
        </div>
      </Card>

      {items.length === 0 && (
        <Card>
          <div style={{ color: "var(--fg-3)", fontSize: 14, textAlign: "center", padding: 10 }}>
            Aún no hay fotos ni videos. Sube archivos o agrega enlaces de YouTube — aparecerán en la sección “La Mega en Acción” de la portada.
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {items.map((m, i) => (
          <Card key={m.id ?? `${m.url}-${i}`} pad={10}>
            <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: "var(--r-sm)", overflow: "hidden", background: "var(--bg-2)", marginBottom: 10 }}>
              {m.kind === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {m.kind === "video" && (
                <video src={m.url} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {m.kind === "youtube" && ytId(m.url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://img.youtube.com/vi/${ytId(m.url)}/hqdefault.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {m.kind !== "image" && (
                <span style={{ position: "absolute", inset: 0, margin: "auto", width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="play" size={17} color="#fff" style={{ marginLeft: 2 }} />
                </span>
              )}
              <span className="mono" style={{ position: "absolute", top: 8, left: 8, fontSize: 9, letterSpacing: "0.1em", color: "#fff", background: "rgba(0,0,0,0.6)", padding: "3px 7px", borderRadius: 999, textTransform: "uppercase" }}>
                {m.kind === "image" ? "Foto" : m.kind === "video" ? "Video" : "YouTube"}
              </span>
            </div>
            <input
              value={m.title}
              onChange={(e) => set(i, { title: e.target.value })}
              placeholder="Título (ej. Concierto Mega Party 2026)"
              style={{ ...FIELD, width: "100%", marginBottom: 8, fontSize: 12.5 }}
            />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <IconBtn icon="arrow-left" color="#16C8E8" title="Mover antes" onClick={() => move(i, -1)} />
              <IconBtn icon="arrow-right" color="#16C8E8" title="Mover después" onClick={() => move(i, 1)} />
              <IconBtn icon="trash-2" color="#FF2D34" title="Eliminar" onClick={() => del(i)} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
