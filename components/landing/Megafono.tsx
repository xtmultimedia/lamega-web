"use client";

// Homepage strip: the 3 most recent notes + "Ver todas". The landing is a client
// component, so this fetches /api/posts the same way useStationData fetches
// /api/station.

import React, { useEffect, useState } from "react";
import { Bloom, Icon, Section, SectionHead } from "@/components/ui";
import { PostCard } from "@/components/megafono/PostCard";
import { HOME_POSTS, type PublicPost } from "@/lib/megafono";

// Module-level cache, mirroring useStationData: the strip shouldn't refetch on
// every remount while navigating around the landing.
let cache: PublicPost[] | null = null;

export function Megafono() {
  const [posts, setPosts] = useState<PublicPost[] | null>(cache);

  useEffect(() => {
    if (cache) return;
    fetch(`/api/posts?take=${HOME_POSTS}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.posts) return;
        cache = d.posts as PublicPost[];
        setPosts(cache);
      })
      .catch(() => {});
  }, []);

  // Render nothing until there's something to show — an empty "news" strip on
  // the landing looks broken, and the section is optional by design.
  if (!posts || posts.length === 0) return null;

  return (
    <Section id="megafono">
      <Bloom x="88%" y="20%" size={480} color="rgba(22,131,200,0.16)" />
      <SectionHead
        index="03"
        kicker="El Megáfono"
        title={<>Lo último de <span style={{ color: "var(--red)" }}>La Mega</span></>}
        lead="Noticias, artistas y lo que se mueve en Imbabura."
      />
      <div
        className="megafono-strip"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22, marginTop: 44 }}
      >
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <a
          href="/megafono"
          className="mono"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px",
            borderRadius: "var(--r-pill)", border: "1px solid var(--line-2)", background: "var(--bg-2)",
            color: "var(--fg-1)", textDecoration: "none",
            fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
          }}
        >
          Ver todas las notas <Icon name="arrow-right" size={14} />
        </a>
      </div>
      <style>{`
        @media (max-width: 520px){ .megafono-strip{ grid-template-columns: 1fr !important; } }
      `}</style>
    </Section>
  );
}
