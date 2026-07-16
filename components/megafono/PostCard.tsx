"use client";

// Shared post card: used by the /megafono list and by the homepage strip.
// Presentational only — no data fetching, so both callers control their source.

import React, { useState } from "react";
import { Icon } from "@/components/ui";
import { formatPostDate, postDateAttr, type PublicPost } from "@/lib/megafono";

export function PostCard({ post, accent = "var(--red)" }: { post: PublicPost; accent?: string }) {
  const [h, setH] = useState(false);
  return (
    <a
      href={`/megafono/${post.slug}`}
      className="reveal glass"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        borderRadius: "var(--r-md)", overflow: "hidden", textDecoration: "none",
        display: "flex", flexDirection: "column",
        transition: "all var(--dur) var(--ease-out)",
        transform: h ? "translateY(-6px)" : "none",
        border: h ? "1px solid var(--line-red)" : "1px solid var(--glass-border)",
        boxShadow: h ? `0 0 30px ${accent}33, var(--shadow-lg)` : "var(--shadow-md)",
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 9", flexShrink: 0, overflow: "hidden",
          background: post.coverUrl
            ? `url(${post.coverUrl}) center/cover`
            : `radial-gradient(circle at 35% 30%, ${accent}, #150708)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderBottom: "1px solid var(--line-1)",
        }}
      >
        {!post.coverUrl && <Icon name="megaphone" size={34} color="rgba(255,255,255,0.7)" />}
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {post.publishedAt && (
          <time
            dateTime={postDateAttr(post.publishedAt)}
            className="mono"
            style={{ fontSize: 10, letterSpacing: "0.12em", color: accent, textTransform: "uppercase" }}
          >
            {formatPostDate(post.publishedAt)}
          </time>
        )}
        <h3 className="display" style={{ fontSize: 19, color: "#fff", lineHeight: 1.25, margin: 0 }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--fg-2)", margin: 0 }}>{post.excerpt}</p>
        )}
        <span
          className="mono"
          style={{
            fontSize: 10, letterSpacing: "0.12em", color: "var(--fg-3)", textTransform: "uppercase",
            marginTop: "auto", paddingTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          Leer nota <Icon name="arrow-right" size={13} />
        </span>
      </div>
    </a>
  );
}
