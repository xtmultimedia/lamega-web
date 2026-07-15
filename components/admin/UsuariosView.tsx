"use client";

// Admin-only: invite people to the panel, set their role, activate/remove.
// The invite link is always shown so it can be shared by hand when email
// delivery isn't available.

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/roles";
import { AdmButton, Card, IconBtn, ViewTitle } from "./primitives";

interface PanelUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  host_id: string | null;
  pending: boolean;
  last_login_at: string | null;
}

// Minimal shape of a locutor, for the profile-link picker.
interface HostOption {
  id: string;
  name: string;
}

const SELECT: React.CSSProperties = {
  background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-xs)",
  padding: "7px 9px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 13,
};
const INPUT: React.CSSProperties = {
  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
  padding: "11px 12px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 14,
};
const LABEL: React.CSSProperties = {
  fontSize: 10, letterSpacing: "0.12em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6,
};

function StatusPill({ u }: { u: PanelUser }) {
  const [c, label] = !u.active
    ? ["var(--fg-3)", "Inactivo"]
    : u.pending
      ? ["#E8A33D", "Invitación pendiente"]
      : ["var(--green)", "Activo"];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--r-pill)",
        background: `${c}1f`, border: `1px solid ${c}55`, color: c,
        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function InviteLink({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        marginBottom: 16, padding: 14, borderRadius: "var(--r-sm)",
        background: "rgba(29,185,84,0.10)", border: "1px solid rgba(29,185,84,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#5fe08a", fontSize: 14, marginBottom: 8 }}>
        <Icon name="check-circle" size={16} /> Invitación creada
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 10 }}>
        Compartí este enlace si el email no llega (vence en 7 días, un solo uso):
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input readOnly value={url} style={{ ...INPUT, flex: 1, minWidth: 220, fontFamily: "var(--font-mono)", fontSize: 12 }} />
        <AdmButton
          icon={copied ? "check" : "copy"}
          onClick={() => {
            navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            });
          }}
        >
          {copied ? "Copiado" : "Copiar"}
        </AdmButton>
        <AdmButton variant="ghost" onClick={onClose}>Cerrar</AdmButton>
      </div>
    </div>
  );
}

export function UsuariosView() {
  const [users, setUsers] = useState<PanelUser[] | null>(null);
  const [hosts, setHosts] = useState<HostOption[]>([]);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: Role }>({
    name: "", email: "", role: "editor",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setUsers(d.users);
    } catch {
      setUsers([]);
      setNote({ ok: false, msg: "No se pudo cargar la lista de usuarios." });
    }
  }, []);

  useEffect(() => {
    load();
    // locutor list for the profile-link picker (this view is admin-only, and
    // /api/admin/station allows admin/editor — so this is always permitted here)
    fetch("/api/admin/station")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.hosts && setHosts(d.hosts.filter((h: HostOption) => h.id)))
      .catch(() => {});
  }, [load]);

  const flash = (ok: boolean, msg: string) => {
    setNote({ ok, msg });
    setTimeout(() => setNote(null), 4000);
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "No se pudo invitar.");
      setInviteUrl(d.invite_url);
      flash(true, d.emailed ? `Invitación enviada a ${form.email}.` : "Invitación creada — compartí el enlace (el email no está configurado).");
      setForm({ name: "", email: "", role: "editor" });
      load();
    } catch (err) {
      flash(false, err instanceof Error ? err.message : "No se pudo invitar.");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "No se pudo actualizar.");
      if (d.invite_url) setInviteUrl(d.invite_url);
      flash(true, okMsg);
      load();
    } catch (err) {
      flash(false, err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  };

  const remove = async (u: PanelUser) => {
    if (!confirm(`¿Eliminar a ${u.name} (${u.email})? Perderá el acceso al panel.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "No se pudo eliminar.");
      flash(true, `${u.name} fue eliminado.`);
      load();
    } catch (err) {
      flash(false, err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  return (
    <>
      <ViewTitle kicker="Equipo" title="Usuarios" />

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

      {inviteUrl && <InviteLink url={inviteUrl} onClose={() => setInviteUrl(null)} />}

      {/* Invite */}
      <Card style={{ marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 14 }}>
          Invitar a alguien
        </div>
        <form onSubmit={invite} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "end" }}>
          <div>
            <div className="mono" style={LABEL}>Nombre</div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alexis Vilanez" required style={INPUT} />
          </div>
          <div>
            <div className="mono" style={LABEL}>Email</div>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="persona@email.com" required style={INPUT} />
          </div>
          <div>
            <div className="mono" style={LABEL}>Rol</div>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} style={{ ...INPUT, cursor: "pointer" }}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <AdmButton icon={busy ? "loader-2" : "user-plus"} onClick={() => {}}>
            {busy ? "Invitando…" : "Enviar invitación"}
          </AdmButton>
        </form>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 12, lineHeight: 1.6 }}>
          {ROLES.map((r) => (
            <div key={r}>
              <strong style={{ color: "var(--fg-2)" }}>{ROLE_LABELS[r]}:</strong> {ROLE_DESCRIPTIONS[r]}
            </div>
          ))}
        </div>
      </Card>

      {/* List */}
      <Card pad={0}>
        {users === null ? (
          <div style={{ color: "var(--fg-3)", fontSize: 14, textAlign: "center", padding: 22 }}>Cargando usuarios…</div>
        ) : users.length === 0 ? (
          <div style={{ color: "var(--fg-3)", fontSize: 14, textAlign: "center", padding: 22 }}>
            Todavía no hay usuarios. Invitá al primero desde el formulario de arriba.
          </div>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                padding: "16px 20px", borderTop: i ? "1px solid var(--line-1)" : "none", flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 190, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{u.name}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{u.email}</div>
              </div>
              <StatusPill u={u} />
              <select
                value={u.role}
                onChange={(e) => patch(u.id, { role: e.target.value }, `Rol de ${u.name} actualizado.`)}
                style={{ ...SELECT, cursor: "pointer" }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              {/* Links the account to a locutor profile → unlocks Mi Perfil */}
              <select
                value={u.host_id ?? ""}
                title="Perfil de locutor enlazado"
                onChange={(e) =>
                  patch(
                    u.id,
                    { hostId: e.target.value || null },
                    e.target.value ? `${u.name} quedó enlazado a su perfil de locutor.` : `${u.name} ya no está enlazado a un locutor.`,
                  )
                }
                style={{ ...SELECT, cursor: "pointer", maxWidth: 165 }}
              >
                <option value="">— Sin locutor —</option>
                {hosts.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                {u.pending && (
                  <IconBtn
                    icon="send" color="var(--red-bright)" title="Reenviar invitación"
                    onClick={() => patch(u.id, { resend_invite: true }, `Invitación reenviada a ${u.email}.`)}
                  />
                )}
                <IconBtn
                  icon={u.active ? "user-x" : "user-check"}
                  color={u.active ? "#E8A33D" : "var(--green)"}
                  title={u.active ? "Desactivar" : "Activar"}
                  onClick={() => patch(u.id, { active: !u.active }, `${u.name} ${u.active ? "desactivado" : "activado"}.`)}
                />
                <IconBtn icon="trash-2" color="var(--red)" title="Eliminar" onClick={() => remove(u)} />
              </div>
            </div>
          ))
        )}
      </Card>

      <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 14, lineHeight: 1.6 }}>
        Debe quedar siempre al menos un Admin activo. No podés cambiar tu propio rol, desactivarte ni eliminarte.
        <br />
        Enlazá una cuenta a un <strong>locutor</strong> para que pueda editar su foto, bio y redes desde <strong>Mi Perfil</strong> y aparecer en <strong>/staff</strong>.
      </div>
    </>
  );
}
