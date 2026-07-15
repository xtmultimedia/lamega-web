"use client";

// "Mi Perfil": every panel user edits their OWN photo, bio, socials and
// password. Name/alias/programs stay admin-controlled (Locutores).
// Backed by /api/admin/me, which resolves the row from the session.

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import {
  BIO_MAX, HOST_NETWORKS, NETWORK_LABELS, SOCIALS_MAX,
  type HostNetwork, type HostSocial,
} from "@/lib/hosts";
import { AdmButton, Card, IconBtn, ViewTitle } from "./primitives";
import { uploadFile } from "./station-views";

interface MeHost {
  id: string; name: string; alias: string; show: string; hue: string;
  photoUrl: string | null; bio: string | null; socials: HostSocial[];
}
interface MeUser {
  id: string; email: string | null; name: string; role: string; envAdmin: boolean;
}

const INPUT: React.CSSProperties = {
  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
  padding: "11px 12px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 14,
};
const LABEL: React.CSSProperties = {
  fontSize: 10, letterSpacing: "0.12em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6,
};

function Note({ note }: { note: { ok: boolean; msg: string } | null }) {
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

function PasswordCard() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote(null);
    if (next.length < 8) return setNote({ ok: false, msg: "La nueva contraseña debe tener al menos 8 caracteres." });
    if (next !== confirm) return setNote({ ok: false, msg: "Las contraseñas nuevas no coinciden." });
    setBusy(true);
    try {
      const res = await fetch("/api/admin/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: cur, new_password: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "No se pudo cambiar la contraseña.");
      setNote({ ok: true, msg: "Contraseña actualizada." });
      setCur(""); setNext(""); setConfirm("");
    } catch (err) {
      setNote({ ok: false, msg: err instanceof Error ? err.message : "No se pudo cambiar la contraseña." });
    } finally {
      setBusy(false);
      setTimeout(() => setNote(null), 4000);
    }
  };

  return (
    <Card style={{ marginTop: 20 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 14 }}>
        Cambiar mi contraseña
      </div>
      <Note note={note} />
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, alignItems: "end" }}>
        <div>
          <div className="mono" style={LABEL}>Contraseña actual</div>
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required style={INPUT} />
        </div>
        <div>
          <div className="mono" style={LABEL}>Nueva</div>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Mínimo 8" autoComplete="new-password" required style={INPUT} />
        </div>
        <div>
          <div className="mono" style={LABEL}>Repetir nueva</div>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required style={INPUT} />
        </div>
        <AdmButton icon={busy ? "loader-2" : "key-round"} onClick={() => {}}>
          {busy ? "Guardando…" : "Cambiar"}
        </AdmButton>
      </form>
    </Card>
  );
}

export function PerfilView() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [host, setHost] = useState<MeHost | null>(null);
  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setUser(d.user); setHost(d.host); setLinked(d.linked);
    } catch {
      setNote({ ok: false, msg: "No se pudo cargar tu perfil." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (ok: boolean, msg: string) => {
    setNote({ ok, msg });
    setTimeout(() => setNote(null), 4000);
  };

  const pickPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !host) return;
      try {
        const { url } = await uploadFile(file);
        setHost({ ...host, photoUrl: url });
      } catch (err) {
        flash(false, err instanceof Error ? err.message : "No se pudo subir la imagen.");
      }
    };
    input.click();
  };

  const save = async () => {
    if (!host) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: host.bio, photoUrl: host.photoUrl, socials: host.socials }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "No se pudo guardar.");
      if (d.host) setHost(d.host);
      flash(true, "Perfil guardado — ya se ve en la web.");
    } catch (err) {
      flash(false, err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <ViewTitle kicker="Tu cuenta" title="Mi Perfil" />
        <Card><div style={{ color: "var(--fg-3)", fontSize: 14, textAlign: "center", padding: 10 }}>Cargando…</div></Card>
      </>
    );
  }

  const setSocial = (i: number, patch: Partial<HostSocial>) =>
    host && setHost({ ...host, socials: host.socials.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <>
      <ViewTitle kicker="Tu cuenta" title="Mi Perfil">
        {linked && (
          <AdmButton icon={saving ? "loader-2" : "save"} onClick={save}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </AdmButton>
        )}
      </ViewTitle>

      <Note note={note} />

      {/* Account summary */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{user?.name}</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
              {user?.email ?? "cuenta de emergencia (.env)"} · {user?.role}
            </div>
          </div>
        </div>
      </Card>

      {!linked ? (
        <Card>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", color: "var(--fg-2)", fontSize: 14, lineHeight: 1.6 }}>
            <Icon name="info" size={18} color="var(--red-bright)" />
            <div>
              {user?.envAdmin
                ? "Estás usando la cuenta de emergencia del servidor, que no tiene perfil público. Iniciá sesión con tu cuenta de email para editar tu perfil."
                : "Tu cuenta todavía no está enlazada a un locutor, así que no hay perfil público que editar. Pedile a un administrador que la enlace desde Usuarios."}
            </div>
          </div>
        </Card>
      ) : (
        host && (
          <>
            <Card>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
                      background: host.photoUrl ? `url(${host.photoUrl}) center/cover` : `radial-gradient(circle at 35% 30%, ${host.hue}, #150708)`,
                      border: "2px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {!host.photoUrl && <Icon name="mic" size={34} color="rgba(255,255,255,0.85)" />}
                  </div>
                  <button
                    onClick={pickPhoto}
                    title="Cambiar foto"
                    style={{
                      position: "absolute", right: -2, bottom: -2, width: 32, height: 32, borderRadius: "50%",
                      background: "var(--red)", border: "2px solid #0c0c0e", color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="camera" size={15} />
                  </button>
                  {host.photoUrl && (
                    <button
                      onClick={() => setHost({ ...host, photoUrl: null })}
                      title="Quitar foto"
                      style={{
                        position: "absolute", left: -2, bottom: -2, width: 28, height: 28, borderRadius: "50%",
                        background: "var(--bg-3)", border: "1px solid var(--line-2)", color: "var(--fg-2)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>

                {/* Identity (read-only) + bio */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div className="display" style={{ fontSize: 20, color: "#fff" }}>{host.name}</div>
                  <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 4 }}>
                    {host.alias || "—"} {host.show ? `· ${host.show}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16 }}>
                    Tu nombre, alias y programas los gestiona un administrador.
                  </div>

                  <div className="mono" style={LABEL}>Sobre vos (se muestra en la web)</div>
                  <textarea
                    value={host.bio ?? ""}
                    onChange={(e) => setHost({ ...host, bio: e.target.value.slice(0, BIO_MAX) })}
                    placeholder="Contale a los oyentes quién sos, tu estilo, lo que te gusta…"
                    rows={4}
                    style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }}
                  />
                  <div className="mono" style={{ fontSize: 10, color: (host.bio?.length ?? 0) >= BIO_MAX ? "var(--red-bright)" : "var(--fg-3)", textAlign: "right", marginTop: 4 }}>
                    {host.bio?.length ?? 0}/{BIO_MAX}
                  </div>
                </div>
              </div>
            </Card>

            {/* Socials */}
            <Card style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)", textTransform: "uppercase" }}>
                  Mis redes
                </div>
                {host.socials.length < SOCIALS_MAX && (
                  <AdmButton
                    icon="plus"
                    onClick={() => setHost({ ...host, socials: [...host.socials, { network: "instagram", url: "" }] })}
                  >
                    Agregar red
                  </AdmButton>
                )}
              </div>
              {host.socials.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--fg-3)" }}>
                  Todavía no agregaste redes. Los oyentes las verán en tu perfil público.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {host.socials.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={s.network}
                        onChange={(e) => setSocial(i, { network: e.target.value as HostNetwork })}
                        style={{ ...INPUT, width: "auto", cursor: "pointer" }}
                      >
                        {HOST_NETWORKS.map((n) => (
                          <option key={n} value={n}>{NETWORK_LABELS[n]}</option>
                        ))}
                      </select>
                      <input
                        value={s.url}
                        onChange={(e) => setSocial(i, { url: e.target.value })}
                        placeholder="https://instagram.com/tu.usuario"
                        style={{ ...INPUT, flex: 1, minWidth: 200, fontFamily: "var(--font-mono)", fontSize: 12 }}
                      />
                      <IconBtn
                        icon="trash-2" color="var(--red)" title="Quitar"
                        onClick={() => setHost({ ...host, socials: host.socials.filter((_, j) => j !== i) })}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 12 }}>
                Solo enlaces que empiecen con <code>https://</code>. Máximo {SOCIALS_MAX}.
              </div>
            </Card>
          </>
        )
      )}

      {!user?.envAdmin && <PasswordCard />}
    </>
  );
}
