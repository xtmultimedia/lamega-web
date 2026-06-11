"use client";

// Admin login styled to match the La Mega design language.

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";

const INPUT: React.CSSProperties = {
  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
  padding: "13px 14px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 15, outline: "none",
  transition: "border-color var(--dur), box-shadow var(--dur)",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", {
      username: user,
      password: pass,
      redirect: false,
    });
    setBusy(false);
    if (res?.ok) {
      router.push(params.get("callbackUrl") || "/admin");
      router.refresh();
    } else {
      setError("Usuario o contraseña incorrectos.");
    }
  };

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
            alt="La Mega"
            style={{ height: 52, margin: "0 auto 16px", filter: "drop-shadow(0 6px 22px rgba(227,30,36,0.5))" }}
          />
          <h1 className="display" style={{ fontSize: 30, color: "#fff", margin: 0 }}>
            Panel <span style={{ color: "var(--red)" }}>Admin</span>
          </h1>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: "var(--fg-3)", marginTop: 10, textTransform: "uppercase" }}>
            La Mega 99.9 · Acceso restringido
          </div>
        </div>

        <form
          onSubmit={submit}
          className="glass"
          style={{
            padding: 28, borderRadius: "var(--r-lg)", border: "1px solid var(--line-red)",
            boxShadow: "0 0 0 1px rgba(227,30,36,0.12), var(--glow-red-soft), var(--shadow-lg)",
          }}
        >
          <label style={{ display: "block", marginBottom: 18 }}>
            <span className="mono" style={{ display: "block", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-2)", fontWeight: 700, marginBottom: 9 }}>
              Usuario
            </span>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" autoComplete="username" required style={INPUT} />
          </label>
          <label style={{ display: "block", marginBottom: 22 }}>
            <span className="mono" style={{ display: "block", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-2)", fontWeight: 700, marginBottom: 9 }}>
              Contraseña
            </span>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" required style={INPUT} />
          </label>

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px 24px",
              borderRadius: "var(--r-sm)", border: "none", cursor: busy ? "wait" : "pointer",
              background: "linear-gradient(180deg, var(--red-bright), var(--red))", color: "#fff",
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.05em",
              boxShadow: "var(--glow-red)", opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Verificando…" : "Ingresar"}
            <Icon name={busy ? "loader-2" : "log-in"} size={18} style={busy ? { animation: "spin-slow 1.2s linear infinite" } : undefined} />
          </button>

          {error && (
            <div
              style={{
                marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: "rgba(227,30,36,0.10)",
                border: "1px solid var(--line-red)", color: "var(--red-bright)",
                display: "flex", alignItems: "center", gap: 10, fontSize: 14,
              }}
            >
              <Icon name="triangle-alert" size={17} />
              {error}
            </div>
          )}
        </form>

        <div style={{ textAlign: "center", marginTop: 22 }}>
          <a href="/" className="mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>
            ← Volver al sitio
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
