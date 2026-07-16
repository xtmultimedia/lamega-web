"use client";

// Public invite-acceptance page: the invited person sets their first password.
// Styled to match /admin/login.

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";

const INPUT: React.CSSProperties = {
  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
  padding: "13px 14px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 15, outline: "none",
  transition: "border-color var(--dur), box-shadow var(--dur)",
};

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
  color: "var(--fg-2)", fontWeight: 700, marginBottom: 9,
};

function InviteForm({ onMode }: { onMode: (reset: boolean) => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  // Cosmetic only: the accept endpoint treats invites and resets identically.
  const isReset = params.get("reset") === "1";

  useEffect(() => {
    onMode(isReset);
  }, [isReset, onMode]);
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pass.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (pass !== confirm) return setError("Las contraseñas no coinciden.");

    setBusy(true);
    try {
      const res = await fetch("/api/admin/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo activar el acceso.");
      setDone(true);
      setTimeout(() => router.push("/admin/login"), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar el acceso.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div style={{ color: "var(--red-bright)", textAlign: "center", fontSize: 14 }}>
        {isReset
          ? "Falta el enlace. Pedile al administrador que te genere uno nuevo."
          : "Falta el enlace de invitación. Pedile al administrador que te lo reenvíe."}
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: 10 }}>
        <Icon name="check-circle" size={44} color="var(--green)" />
        <div className="display" style={{ fontSize: 20, color: "#fff", margin: "14px 0 6px" }}>
          {isReset ? "¡Listo! Contraseña actualizada" : "¡Listo! Tu acceso está activo"}
        </div>
        <div style={{ fontSize: 14, color: "var(--fg-2)" }}>
          Te llevamos al login para que entres con tu email…
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div style={{ fontSize: 14, color: "var(--fg-2)", marginBottom: 20, lineHeight: 1.5 }}>
        {isReset
          ? "Elegí una contraseña nueva para tu cuenta del panel de La Mega 99.9."
          : "Creá tu contraseña para entrar al panel de La Mega 99.9."}
      </div>
      <label style={{ display: "block", marginBottom: 18 }}>
        <span className="mono" style={LABEL}>Nueva contraseña</span>
        <input
          type="password" value={pass} onChange={(e) => setPass(e.target.value)}
          placeholder="Mínimo 8 caracteres" autoComplete="new-password" required style={INPUT}
        />
      </label>
      <label style={{ display: "block", marginBottom: 22 }}>
        <span className="mono" style={LABEL}>Repetir contraseña</span>
        <input
          type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password" required style={INPUT}
        />
      </label>
      {error && (
        <div style={{ color: "var(--red-bright)", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="triangle-alert" size={15} /> {error}
        </div>
      )}
      <button
        type="submit" disabled={busy}
        style={{
          width: "100%", padding: "14px 18px", borderRadius: "var(--r-sm)", border: "none",
          background: "linear-gradient(180deg, var(--red-bright), var(--red))", color: "#fff",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase",
          letterSpacing: "0.06em", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? (isReset ? "Guardando…" : "Activando…") : isReset ? "Guardar contraseña" : "Activar mi acceso"}
      </button>
    </form>
  );
}

export default function AdminInvitePage() {
  // The heading lives outside <Suspense>, but only the inner form can read the
  // query string — so the form reports the mode back up.
  const [isReset, setIsReset] = useState(false);
  const onMode = useCallback((v: boolean) => setIsReset(v), []);
  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        background: "radial-gradient(120% 80% at 50% -5%, #1a0608 0%, #0A0A0A 55%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/mega-logo.png"
            alt="La Mega 99.9 FM"
            style={{ height: 52, margin: "0 auto 16px", filter: "drop-shadow(0 6px 22px rgba(227,30,36,0.5))" }}
          />
          <h1 className="display" style={{ fontSize: 30, color: "#fff", margin: 0 }}>
            {isReset ? (
              <>Nueva <span style={{ color: "var(--red)" }}>contraseña</span></>
            ) : (
              <>Activar <span style={{ color: "var(--red)" }}>acceso</span></>
            )}
          </h1>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: "var(--fg-3)", marginTop: 10, textTransform: "uppercase" }}>
            La Mega 99.9 · Panel
          </div>
        </div>
        <div
          className="glass"
          style={{
            padding: 28, borderRadius: "var(--r-lg)", border: "1px solid var(--line-red)",
            boxShadow: "0 0 0 1px rgba(227,30,36,0.12), var(--glow-red-soft), var(--shadow-lg)",
          }}
        >
          <Suspense fallback={<div style={{ color: "var(--fg-3)", fontSize: 14 }}>Cargando…</div>}>
            <InviteForm onMode={onMode} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
