"use client";

// Public /staff page. Data arrives as props from the server component, so this
// bypasses useStationData's module-level cache entirely — a locutor's new photo
// shows up on the next request with no cache busting.

import React, { useState } from "react";
import { Bloom, Icon, Section, SectionHead, SocialIcon } from "@/components/ui";
import { NETWORK_LABELS, type HostSocial } from "@/lib/hosts";
import { RadioProvider } from "@/components/radio/RadioProvider";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { MiniPlayer } from "@/components/landing/MiniPlayer";

export interface StaffMember {
  id: string;
  name: string;
  alias: string;
  hue: string;
  photoUrl: string | null;
  bio: string | null;
  socials: HostSocial[];
  programs: { name: string; time: string }[];
}

function MemberCard({ m }: { m: StaffMember }) {
  const [h, setH] = useState(false);
  return (
    <div
      className="reveal glass"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        borderRadius: "var(--r-md)", overflow: "hidden", padding: 24,
        transition: "all var(--dur) var(--ease-out)",
        transform: h ? "translateY(-6px)" : "none",
        border: h ? "1px solid var(--line-red)" : "1px solid var(--glass-border)",
        boxShadow: h ? `0 0 30px ${m.hue}33, var(--shadow-lg)` : "var(--shadow-md)",
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 84, height: 84, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
            background: m.photoUrl ? `url(${m.photoUrl}) center/cover` : `radial-gradient(circle at 35% 30%, ${m.hue}, #150708)`,
            border: "2px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!m.photoUrl && <Icon name="mic" size={30} color="rgba(255,255,255,0.85)" />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="display" style={{ fontSize: 20, color: "#fff", lineHeight: 1.15 }}>{m.name}</div>
          {m.alias && (
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", color: m.hue, textTransform: "uppercase", marginTop: 5 }}>
              {m.alias}
            </div>
          )}
        </div>
      </div>

      {m.bio && <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--fg-2)", margin: 0 }}>{m.bio}</p>}

      {m.programs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {m.programs.map((p) => (
            <span
              key={p.name}
              title={p.time}
              style={{
                fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
                color: "var(--fg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-pill)",
                padding: "4px 10px", background: "var(--bg-2)",
              }}
            >
              {p.name}
            </span>
          ))}
        </div>
      )}

      {m.socials.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4, flexWrap: "wrap" }}>
          {m.socials.map((s, i) => (
            <SocialIcon
              key={`${s.network}-${i}`}
              name={s.network}
              href={s.url}
              size={16}
              label={`${m.name} en ${NETWORK_LABELS[s.network]}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StaffSection({ members }: { members: StaffMember[] }) {
  return (
    <Section id="staff" style={{ paddingTop: "clamp(120px, 16vw, 170px)" }}>
      <Bloom x="8%" y="6%" size={560} />
      <Bloom x="88%" y="60%" size={460} color="rgba(122,31,196,0.18)" />
      <SectionHead
        index="01"
        kicker="Nuestro equipo"
        title={<>Las voces de <span style={{ color: "var(--red)" }}>La Mega</span></>}
        lead="Conocé a los locutores que te acompañan cada día desde Ibarra."
        align="center"
        max={720}
      />
      {members.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--fg-3)", fontSize: 14, padding: "40px 0" }}>
          Muy pronto vas a conocer a todo el equipo.
        </div>
      ) : (
        <div
          className="staff-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22, marginTop: 44 }}
        >
          {members.map((m) => (
            <MemberCard key={m.id} m={m} />
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 520px){ .staff-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </Section>
  );
}

export function StaffApp({ members }: { members: StaffMember[] }) {
  // RadioProvider is mandatory: Nav, Footer and MiniPlayer all call useRadio().
  return (
    <RadioProvider>
      <Nav />
      <main>
        <StaffSection members={members} />
      </main>
      <Footer />
      <div aria-hidden="true" style={{ height: "clamp(70px, 11vw, 88px)" }} />
      <MiniPlayer />
    </RadioProvider>
  );
}
