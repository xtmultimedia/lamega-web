"use client";

// Public /megafono/[slug] — a single note.

import React from "react";
import { Bloom, Icon, Section } from "@/components/ui";
import { RadioProvider } from "@/components/radio/RadioProvider";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { MiniPlayer } from "@/components/landing/MiniPlayer";
import { PostCard } from "./PostCard";
import { POST_BYLINE, formatPostDate, postDateAttr, type PublicPost } from "@/lib/megafono";

export interface PostPageData extends PublicPost {
  contentHtml: string | null;
}

export function PostApp({ post, more }: { post: PostPageData; more: PublicPost[] }) {
  // RadioProvider is mandatory: Nav, Footer and MiniPlayer all call useRadio().
  return (
    <RadioProvider>
      <Nav />
      <main>
        <Section id="nota" style={{ paddingTop: "clamp(120px, 16vw, 170px)" }}>
          <Bloom x="10%" y="4%" size={520} />

          <article style={{ maxWidth: 760, margin: "0 auto" }}>
            <a
              href="/megafono"
              className="mono"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none",
                fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                color: "var(--fg-3)", marginBottom: 20,
              }}
            >
              <Icon name="arrow-left" size={13} /> El Megáfono
            </a>

            <h1 className="display" style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.1, color: "#fff", margin: "0 0 16px" }}>
              {post.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
              {post.publishedAt && (
                <time dateTime={postDateAttr(post.publishedAt)} className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--red)", textTransform: "uppercase" }}>
                  {formatPostDate(post.publishedAt)}
                </time>
              )}
              <span aria-hidden="true" style={{ color: "var(--line-2)" }}>·</span>
              {/* Posts are signed by the station, not by individual people. */}
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--fg-3)", textTransform: "uppercase" }}>
                Por {POST_BYLINE}
              </span>
            </div>

            {post.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- next/image needs a loader config the standalone host doesn't have
              <img
                src={post.coverUrl}
                alt=""
                style={{
                  width: "100%", aspectRatio: "16 / 9", objectFit: "cover",
                  borderRadius: "var(--r-md)", border: "1px solid var(--line-1)", marginBottom: 32,
                }}
              />
            )}

            {post.excerpt && (
              <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--fg-1)", margin: "0 0 26px", fontWeight: 500 }}>
                {post.excerpt}
              </p>
            )}

            {post.contentHtml && (
              // SAFE: contentHtml is sanitized on WRITE by lib/sanitize.ts, so the
              // column only ever holds allowlisted markup. Do not render unsanitized
              // HTML here — see the reasoning in that file.
              <div className="post-body" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            )}
          </article>

          {more.length > 0 && (
            <div style={{ maxWidth: 1100, margin: "80px auto 0" }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 20 }}>
                Más de El Megáfono
              </div>
              <div className="megafono-more" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
                {more.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          )}

          <style>{`
            @media (max-width: 520px){ .megafono-more{ grid-template-columns: 1fr !important; } }
            /* Styles the sanitized post body. The allowlist in lib/sanitize.ts is
               the contract: every tag it permits is styled here. */
            .post-body{ font-size: 16px; line-height: 1.75; color: var(--fg-2); }
            .post-body > *:first-child{ margin-top: 0; }
            .post-body p{ margin: 0 0 20px; }
            .post-body h2, .post-body h3, .post-body h4{
              font-family: var(--font-display); color: #fff; line-height: 1.25;
              margin: 38px 0 14px; letter-spacing: -0.01em;
            }
            .post-body h2{ font-size: 27px; }
            .post-body h3{ font-size: 22px; }
            .post-body h4{ font-size: 18px; }
            .post-body strong{ color: var(--fg-1); font-weight: 700; }
            .post-body a{ color: var(--red); text-decoration: underline; text-underline-offset: 3px; }
            .post-body a:hover{ color: #fff; }
            .post-body ul, .post-body ol{ margin: 0 0 20px; padding-left: 22px; }
            .post-body li{ margin-bottom: 8px; }
            .post-body blockquote{
              margin: 28px 0; padding: 4px 0 4px 20px;
              border-left: 3px solid var(--red); color: var(--fg-1);
              font-size: 18px; line-height: 1.6; font-style: italic;
            }
            .post-body img{
              max-width: 100%; height: auto; display: block; margin: 28px 0;
              border-radius: var(--r-sm); border: 1px solid var(--line-1);
            }
            .post-body hr{ border: 0; border-top: 1px solid var(--line-2); margin: 36px 0; }
          `}</style>
        </Section>
      </main>
      <Footer />
      <div aria-hidden="true" style={{ height: "clamp(70px, 11vw, 88px)" }} />
      <MiniPlayer />
    </RadioProvider>
  );
}
