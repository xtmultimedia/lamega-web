"use client";

// /pide — Formulario inteligente (Pide tu canción · Publicita)
// Ported from design-reference/formulario.jsx, wired to the real API.

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { SaludosWidget } from "@/components/saludos/SaludosWidget";
import { saludosActivo } from "@/lib/saludos";
import { useStationData } from "@/components/useStationData";

/* ---------- Field shell ---------- */
function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-2)", fontWeight: 700 }}>
          {label}
        </span>
        {optional && <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>· opcional</span>}
        {hint && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-3)" }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
  padding: "13px 14px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 15, outline: "none",
  transition: "border-color var(--dur), box-shadow var(--dur)",
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{ ...INPUT, borderColor: f ? "var(--red)" : "var(--line-2)", boxShadow: f ? "0 0 0 3px rgba(227,30,36,0.15)" : "none", ...props.style }}
    />
  );
}

function TextArea({ value, onChange, max, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; max?: number; placeholder?: string; rows?: number }) {
  const [f, setF] = useState(false);
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(max ? e.target.value.slice(0, max) : e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{
          ...INPUT, resize: "vertical", lineHeight: 1.5,
          borderColor: f ? "var(--red)" : "var(--line-2)",
          boxShadow: f ? "0 0 0 3px rgba(227,30,36,0.15)" : "none",
        }}
      />
      {max && (
        <div className="mono" style={{ textAlign: "right", fontSize: 11, color: value.length >= max ? "var(--red-bright)" : "var(--fg-3)", marginTop: 5 }}>
          {value.length}/{max}
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{
          ...INPUT, appearance: "none", cursor: "pointer", color: value ? "#fff" : "var(--fg-3)",
          borderColor: f ? "var(--red)" : "var(--line-2)", boxShadow: f ? "0 0 0 3px rgba(227,30,36,0.15)" : "none",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o} style={{ color: "#fff", background: "#161618" }}>{o}</option>
        ))}
      </select>
      <Icon name="chevron-down" size={18} color="var(--fg-3)" style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

/* ---------- Pills (single / multi) ---------- */
function Pills({
  options, value, onChange, multi,
}: {
  options: string[];
  value: string | string[];
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const isOn = (o: string) => (multi ? (value as string[]).includes(o) : value === o);
  const toggle = (o: string) => {
    if (multi) {
      const v = value as string[];
      onChange(v.includes(o) ? v.filter((x) => x !== o) : [...v, o]);
    } else onChange(o);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {options.map((o) => {
        const on = isOn(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: "var(--r-pill)", cursor: "pointer",
              border: `1px solid ${on ? "var(--red)" : "var(--line-2)"}`,
              background: on ? "rgba(227,30,36,0.16)" : "var(--bg-2)",
              color: on ? "#fff" : "var(--fg-2)", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14,
              boxShadow: on ? "0 0 18px rgba(227,30,36,0.25)" : "none", transition: "all var(--dur)",
            }}
          >
            {multi && (
              <span
                style={{
                  width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${on ? "var(--red-bright)" : "var(--line-strong)"}`,
                  background: on ? "var(--red)" : "transparent",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {on && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
              </span>
            )}
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Toggle row ---------- */
function ToggleRow({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "15px 16px", cursor: "pointer",
        borderRadius: "var(--r-sm)", background: on ? "rgba(227,30,36,0.08)" : "var(--bg-2)",
        border: `1px solid ${on ? "var(--line-red)" : "var(--line-2)"}`, transition: "all var(--dur)", marginBottom: 20,
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{label}</div>
        {desc && <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>{desc}</div>}
      </div>
      <span
        style={{
          position: "relative", width: 46, height: 26, borderRadius: 999, background: on ? "var(--red)" : "var(--bg-4)",
          flexShrink: 0, boxShadow: on ? "var(--glow-red)" : "none", transition: "all var(--dur)",
        }}
      >
        <span
          style={{
            position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff",
            transition: "left var(--dur) var(--ease-out)", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        />
      </span>
    </div>
  );
}

/* ---------- Song autocomplete ---------- */
const SONGS = [
  { t: "Provenza", a: "Karol G" }, { t: "La Bachata", a: "Manuel Turizo" }, { t: "TQG", a: "Karol G, Shakira" },
  { t: "Despechá", a: "Rosalía" }, { t: "Ojitos Lindos", a: "Bad Bunny, Bomba Estéreo" }, { t: "Monotonía", a: "Shakira, Ozuna" },
  { t: "Me Porto Bonito", a: "Bad Bunny, Chencho" }, { t: "Tití Me Preguntó", a: "Bad Bunny" }, { t: "Quevedo: Bzrp Vol. 52", a: "Bizarrap, Quevedo" },
  { t: "El Ganado", a: "Dayanara" }, { t: "Pepas", a: "Farruko" }, { t: "Tusa", a: "Karol G, Nicki Minaj" },
  { t: "Hawái", a: "Maluma" }, { t: "Lokera", a: "Rauw Alejandro" }, { t: "La Jumpa", a: "Arcángel, Bad Bunny" },
];

type Song = { t: string; a: string };

function SongSearch({ selected, onSelect }: { selected: Song | null; onSelect: (s: Song | null) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const matches = q.trim()
    ? SONGS.filter((s) => (s.t + " " + s.a).toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];
  // allow free text too: pressing enter with no match keeps typed title
  if (selected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: "var(--r-sm)", background: "var(--bg-2)", border: "1px solid var(--line-red)" }}>
        <span
          style={{
            width: 42, height: 42, borderRadius: "var(--r-xs)", background: "radial-gradient(circle at 35% 30%, var(--red), #150708)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Icon name="music" size={18} color="#fff" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{selected.t}</div>
          <div style={{ fontSize: 13, color: "var(--fg-3)" }}>{selected.a}</div>
        </div>
        <button
          type="button"
          onClick={() => { onSelect(null); setQ(""); }}
          aria-label="Quitar"
          style={{
            background: "var(--bg-3)", border: "1px solid var(--line-2)", borderRadius: "var(--r-xs)", width: 32, height: 32,
            color: "var(--fg-2)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    );
  }
  return (
    <div ref={box} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Icon name="search" size={18} color="var(--fg-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
        <Input
          value={q}
          placeholder="Escribe el nombre de la canción o el artista…"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) {
              e.preventDefault();
              onSelect(matches[0] ?? { t: q.trim(), a: "" });
              setOpen(false);
            }
          }}
          style={{ paddingLeft: 42 }}
        />
      </div>
      {open && matches.length > 0 && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
            background: "#141417", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", boxShadow: "var(--shadow-lg)", overflow: "hidden",
          }}
        >
          {matches.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onSelect(s); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", cursor: "pointer",
                background: "transparent", border: "none",
                borderBottom: i < matches.length - 1 ? "1px solid var(--line-1)" : "none", textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon name="music" size={16} color="var(--red-bright)" />
              <span style={{ flex: 1 }}>
                <span style={{ color: "#fff", fontSize: 14 }}>{s.t}</span>{" "}
                <span style={{ color: "var(--fg-3)", fontSize: 13 }}>· {s.a}</span>
              </span>
              <Icon name="corner-down-left" size={14} color="var(--fg-3)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- File drop (name captured; binary not uploaded in v1) ---------- */
function FileDrop({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const [over, setOver] = useState(false);
  const inp = useRef<HTMLInputElement | null>(null);
  const pick = (f?: File | null) => f && onFile(f);
  return (
    <div
      onClick={() => inp.current && inp.current.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "18px 16px", borderRadius: "var(--r-sm)", cursor: "pointer",
        border: `1.5px dashed ${over ? "var(--red)" : "var(--line-strong)"}`,
        background: over ? "rgba(227,30,36,0.08)" : "var(--bg-2)", transition: "all var(--dur)",
      }}
    >
      <input ref={inp} type="file" hidden onChange={(e) => pick(e.target.files?.[0])} accept="image/*,audio/*,.pdf" />
      <span style={{ width: 44, height: 44, borderRadius: "var(--r-sm)", background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={file ? "file-check-2" : "upload-cloud"} size={20} color={file ? "var(--green)" : "var(--fg-2)"} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file ? file.name : "Sube tu material publicitario"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>
          {file ? "Archivo listo · clic para cambiar" : "Arrastra o haz clic · imagen, audio o PDF"}
        </div>
      </div>
    </div>
  );
}

/* ---------- Submit button ---------- */
function Submit({ children, icon, busy }: { children: React.ReactNode; icon?: string; busy?: boolean }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="submit"
      disabled={busy}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 11, padding: "17px 24px",
        borderRadius: "var(--r-sm)", border: "none", cursor: busy ? "wait" : "pointer", marginTop: 8,
        background: "linear-gradient(180deg, var(--red-bright), var(--red))", color: "#fff",
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.05em",
        boxShadow: h ? "0 0 40px rgba(255,45,52,0.65)" : "var(--glow-red)",
        transform: h && !busy ? "translateY(-2px)" : "none", transition: "all var(--dur)",
        opacity: busy ? 0.7 : 1,
      }}
    >
      {busy ? "Enviando…" : children}
      {icon && !busy && <Icon name={icon} size={19} />}
      {busy && <Icon name="loader-2" size={19} style={{ animation: "spin-slow 1.2s linear infinite" }} />}
    </button>
  );
}

/* ---------- Success ---------- */
function Success({ title, msg, onReset }: { title: string; msg: string; onReset: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", animation: "rise var(--dur-slow) var(--ease-out)" }}>
      <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 26px" }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--red-bright)", animation: "pulse-ring 1.8s var(--ease-out) infinite" }} />
        <div
          style={{
            width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(180deg, var(--red-bright), var(--red))",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--glow-red)",
          }}
        >
          <Icon name="check" size={48} color="#fff" strokeWidth={2.6} />
        </div>
      </div>
      <h2 className="display" style={{ fontSize: "clamp(26px, 5vw, 38px)", color: "#fff", margin: "0 0 14px" }}>{title}</h2>
      <p style={{ fontSize: 16, color: "var(--fg-2)", maxWidth: 420, margin: "0 auto 28px", lineHeight: 1.6 }}>{msg}</p>
      <button
        onClick={onReset}
        style={{
          display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 22px", borderRadius: "var(--r-sm)",
          background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "#fff", cursor: "pointer",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em",
        }}
      >
        <Icon name="rotate-ccw" size={16} /> Enviar otra
      </button>
    </div>
  );
}

function ErrorNote({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div
      style={{
        marginTop: 14, padding: "12px 16px", borderRadius: "var(--r-sm)", background: "rgba(227,30,36,0.10)",
        border: "1px solid var(--line-red)", color: "var(--red-bright)", display: "flex", alignItems: "center", gap: 10, fontSize: 14,
      }}
    >
      <Icon name="triangle-alert" size={17} />
      {msg}
    </div>
  );
}

/* ============================================================
   TAB 1 — Pide tu canción
   ============================================================ */
function CancionForm() {
  const station = useStationData();
  const slotOptions =
    station && station.shows.length
      ? station.shows
          .filter((s) => s.days === "semana" && s.is_on)
          .map((s) => `${s.name} (${s.start_time} – ${s.end_time})`)
      : ["Megapolis (6:00 – 10:00)", "El Ganado (10:00 – 14:00)", "La Tarde Mega (14:00 – 18:00)", "Mega Noche (18:00 – 22:00)"];
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [song, setSong] = useState<Song | null>(null);
  const [ded, setDed] = useState("");
  const [slot, setSlot] = useState("");
  const [special, setSpecial] = useState(false);
  const [toWhom, setToWhom] = useState("");
  const [occasion, setOccasion] = useState("");

  const reset = () => {
    setDone(false); setName(""); setPhone(""); setSong(null); setDed("");
    setSlot(""); setSpecial(false); setToWhom(""); setOccasion(""); setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!song) {
      setError("Elige tu canción antes de enviar.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          song_title: song.t,
          song_artist: song.a,
          dedication: ded,
          preferred_slot: slot,
          is_special: special,
          special_for: toWhom,
          occasion,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("No pudimos enviar tu solicitud. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <Success
        title="¡Tu solicitud fue enviada!"
        msg="Estamos en eso 🔥 Mantente al aire en 99.9 FM — tu canción puede sonar muy pronto."
        onReset={reset}
      />
    );

  return (
    <form onSubmit={submit}>
      <Field label="¿Cómo te llamas?">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required />
      </Field>
      <Field label="WhatsApp" optional hint="para avisarte cuando suene">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="099 999 9999" inputMode="tel" />
      </Field>
      <Field label="Tu canción">
        <SongSearch selected={song} onSelect={setSong} />
      </Field>
      <Field label="Mensaje o dedicatoria">
        <TextArea value={ded} onChange={setDed} max={160} placeholder="Escribe tu saludo o dedicatoria…" />
      </Field>
      <Field label="Horario preferido">
        <Select value={slot} onChange={setSlot} placeholder="Elige un programa…" options={slotOptions} />
      </Field>

      <ToggleRow label="¿Es una dedicatoria especial?" desc="Cumpleaños, aniversario, una sorpresa…" on={special} onChange={setSpecial} />
      {special && (
        <div style={{ animation: "rise var(--dur) var(--ease-out)", paddingLeft: 14, borderLeft: "2px solid var(--line-red)", marginBottom: 4 }}>
          <Field label="¿Para quién?">
            <Input value={toWhom} onChange={(e) => setToWhom(e.target.value)} placeholder="Nombre de esa persona especial" />
          </Field>
          <Field label="Ocasión">
            <Pills options={["Cumpleaños", "Aniversario", "Te quiero", "Pedida", "Solo porque sí"]} value={occasion} onChange={setOccasion} />
          </Field>
        </div>
      )}

      <Submit icon="music" busy={busy}>Enviar mi solicitud</Submit>
      <ErrorNote msg={error} />
    </form>
  );
}

/* ============================================================
   TAB 2 — Publicita en La Mega
   ============================================================ */
function PublicidadForm() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biz, setBiz] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [dur, setDur] = useState("");
  const [budget, setBudget] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [brief, setBrief] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const reset = () => {
    setDone(false); setBiz(""); setContact(""); setEmail(""); setPhone(""); setType("");
    setDur(""); setBudget(""); setAudience([]); setBrief(""); setFile(null); setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!type) {
      setError("Elige el tipo de anuncio.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: biz,
          contact_name: contact,
          email,
          phone,
          ad_type: type,
          duration: dur,
          budget,
          audience,
          brief,
          file_name: file?.name ?? "",
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("No pudimos enviar tu solicitud. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <Success
        title="¡Genial!"
        msg="Un ejecutivo de ventas te contactará en menos de 24 horas para diseñar tu campaña en La Mega 99.9."
        onReset={reset}
      />
    );

  return (
    <form onSubmit={submit}>
      <Field label="Nombre del negocio">
        <Input value={biz} onChange={(e) => setBiz(e.target.value)} placeholder="Tu empresa o marca" required />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="f-grid2">
        <Field label="Nombre de contacto">
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Tu nombre" required />
        </Field>
        <Field label="Teléfono">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="099 999 9999" inputMode="tel" />
        </Field>
      </div>
      <Field label="Correo electrónico">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@empresa.com" required />
      </Field>
      <Field label="Tipo de anuncio">
        <Pills options={["Radio Spot", "Mención en vivo", "Patrocinio de programa", "Pack completo"]} value={type} onChange={setType} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="f-grid2">
        <Field label="Duración de campaña">
          <Select value={dur} onChange={setDur} placeholder="Elige…" options={["1 semana", "2 semanas", "1 mes", "3 meses", "Personalizado"]} />
        </Field>
        <Field label="Presupuesto">
          <Select value={budget} onChange={setBudget} placeholder="Elige…" options={["Menos de $500", "$500 – $1.500", "$1.500 – $5.000", "Más de $5.000"]} />
        </Field>
      </div>
      <Field label="Público objetivo">
        <Pills multi options={["Jóvenes 18-25", "Adultos 26-40", "Familias", "Empresas"]} value={audience} onChange={setAudience} />
      </Field>
      <Field label="Cuéntanos tu idea" optional>
        <TextArea value={brief} onChange={setBrief} placeholder="¿Qué quieres comunicar? ¿Tienes fechas clave?" rows={4} />
      </Field>
      <Field label="Material publicitario" optional>
        <FileDrop file={file} onFile={setFile} />
      </Field>
      <Submit icon="megaphone" busy={busy}>Quiero publicitar en La Mega</Submit>
      <ErrorNote msg={error} />
    </form>
  );
}

/* ============================================================
   TOP BAR + APP
   ============================================================ */
const tbLink: React.CSSProperties = {
  padding: "9px 14px", borderRadius: "var(--r-sm)", fontFamily: "var(--font-display)", fontWeight: 600,
  fontSize: 14, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--fg-2)",
};

function TopBar() {
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 40, background: "rgba(10,10,10,0.78)",
        WebkitBackdropFilter: "blur(20px) saturate(150%)", backdropFilter: "blur(20px) saturate(150%)",
        borderBottom: "1px solid var(--line-1)",
      }}
    >
      <div
        style={{
          maxWidth: 1100, margin: "0 auto", height: 72, padding: "0 clamp(16px, 4vw, 32px)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="arrow-left" size={18} color="var(--fg-2)" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/mega-logo.png" alt="La Mega" style={{ height: 32, filter: "drop-shadow(0 3px 10px rgba(227,30,36,0.45))" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#fff",
              background: "linear-gradient(180deg, var(--red-bright), var(--red))", padding: "4px 8px", borderRadius: 4, letterSpacing: "0.08em",
            }}
          >
            99.9 FM
          </span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a href="/" className="tb-link" style={tbLink}>Inicio</a>
          <a href="/#megatv" className="tb-link f-hide-sm" style={tbLink}>Mega TV</a>
          <a href="/admin" className="tb-link" style={{ ...tbLink, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon name="layout-dashboard" size={15} /> <span className="f-hide-sm">Admin</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

export function FormApp() {
  const [tab, setTab] = useState<"cancion" | "publicidad">("cancion");
  const tabs = [
    { id: "cancion" as const, label: "Pide tu canción", icon: "music" },
    { id: "publicidad" as const, label: "Publicita en La Mega", icon: "megaphone" },
  ];
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, background: "radial-gradient(120% 80% at 50% -5%, #1a0608 0%, #0A0A0A 55%)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <TopBar />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(36px, 6vw, 64px) clamp(16px, 4vw, 24px) 80px" }}>
          {/* header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: "0.24em", color: "var(--red-bright)", textTransform: "uppercase", marginBottom: 16 }}>
              La nación Mega te escucha
            </div>
            <h1 className="display" style={{ fontSize: "clamp(34px, 6vw, 56px)", color: "#fff", margin: 0 }}>
              {tab === "cancion" ? (
                <>Pide tu <span style={{ color: "var(--red)" }}>canción</span></>
              ) : (
                <>Publicita en <span style={{ color: "var(--red)" }}>La Mega</span></>
              )}
            </h1>
          </div>

          {/* tabs */}
          <div style={{ display: "flex", gap: 8, padding: 6, borderRadius: "var(--r-md)", background: "var(--bg-1)", border: "1px solid var(--line-1)", marginBottom: 28 }}>
            {tabs.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 12px",
                    borderRadius: "var(--r-sm)", cursor: "pointer", border: "none",
                    background: on ? "linear-gradient(180deg, var(--red-bright), var(--red))" : "transparent",
                    color: on ? "#fff" : "var(--fg-2)", fontFamily: "var(--font-display)", fontWeight: 700,
                    fontSize: "clamp(12px, 2.4vw, 14px)", textTransform: "uppercase", letterSpacing: "0.03em",
                    boxShadow: on ? "var(--glow-red)" : "none", transition: "all var(--dur)",
                  }}
                >
                  <Icon name={t.icon} size={16} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* form card */}
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: "var(--r-lg)", padding: "clamp(22px, 4vw, 36px)", boxShadow: "var(--shadow-lg)" }}>
            {/* XT Saludos: con el buzón configurado, el pedido va directo al aire vía
                XT Radio (catálogo real + filtro IA). Sin buzón, el formulario de siempre. */}
            {tab === "cancion"
              ? (saludosActivo() ? <SaludosWidget ancho="100%" plano /> : <CancionForm />)
              : <PublicidadForm />}
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--fg-3)", marginTop: 24 }}>
            Al enviar aceptas que La Mega 99.9 use tus datos para contactarte. · 99.9 FM Guayaquil, Ecuador.
          </p>
        </div>
      </div>
      <style>{`
        .tb-link:hover{ color:#fff !important; background: var(--bg-2); }
        @media (max-width: 560px){ .f-grid2{ grid-template-columns: 1fr !important; } .f-hide-sm{ display:none !important; } }
      `}</style>
    </div>
  );
}
