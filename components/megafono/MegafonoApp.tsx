"use client";

// Public /megafono index. Data arrives as props from the server component (same
// reasoning as StaffApp: it bypasses useStationData's module-level cache).

import React from "react";
import { Bloom, Icon, Section, SectionHead } from "@/components/ui";
import { RadioProvider } from "@/components/radio/RadioProvider";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { MiniPlayer } from "@/components/landing/MiniPlayer";
import { PostCard } from "./PostCard";
import type { PublicPost } from "@/lib/megafono";

function Pager({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  const link = (n: number) => (n <= 1 ? "/megafono" : `/megafono?page=${n}`);
  const btn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px",
    borderRadius: "var(--r-pill)", border: "1px solid var(--line-2)", background: "var(--bg-2)",
    color: "var(--fg-2)", textDecoration: "none", fontFamily: "var(--font-mono)",
    fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
  };
  return (
    <nav
      aria-label="Paginación"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 48 }}
    >
      {page > 1 ? (
        <a href={link(page - 1)} style={btn} rel="prev">
          <Icon name="arrow-left" size={13} /> Anteriores
        </a>
      ) : (
        <span style={{ ...btn, opacity: 0.35 }} aria-disabled="true">
          <Icon name="arrow-left" size={13} /> Anteriores
        </span>
      )}
      <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.1em" }}>
        {page} / {pages}
      </span>
      {page < pages ? (
        <a href={link(page + 1)} style={btn} rel="next">
          Siguientes <Icon name="arrow-right" size={13} />
        </a>
      ) : (
        <span style={{ ...btn, opacity: 0.35 }} aria-disabled="true">
          Siguientes <Icon name="arrow-right" size={13} />
        </span>
      )}
    </nav>
  );
}

export function MegafonoApp({ posts, page, pages }: { posts: PublicPost[]; page: number; pages: number }) {
  // RadioProvider is mandatory: Nav, Footer and MiniPlayer all call useRadio().
  return (
    <RadioProvider>
      <Nav />
      <main>
        <Section id="megafono" style={{ paddingTop: "clamp(120px, 16vw, 170px)" }}>
          <Bloom x="8%" y="6%" size={560} />
          <Bloom x="88%" y="60%" size={460} color="rgba(22,131,200,0.18)" />
          <SectionHead
            index="01"
            kicker="El Megáfono"
            title={<>Las noticias de <span style={{ color: "var(--red)" }}>La Mega</span></>}
            lead="Todo lo que suena, se mueve y se cuenta en Imbabura. Actualizado cada día."
            align="center"
            max={720}
          />
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--fg-3)", fontSize: 14, padding: "40px 0" }}>
              Todavía no hay notas publicadas. Muy pronto.
            </div>
          ) : (
            <>
              <div
                className="megafono-grid"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22, marginTop: 44 }}
              >
                {posts.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
              <Pager page={page} pages={pages} />
            </>
          )}
          <style>{`
            @media (max-width: 520px){ .megafono-grid{ grid-template-columns: 1fr !important; } }
          `}</style>
        </Section>
      </main>
      <Footer />
      <div aria-hidden="true" style={{ height: "clamp(70px, 11vw, 88px)" }} />
      <MiniPlayer />
    </RadioProvider>
  );
}
