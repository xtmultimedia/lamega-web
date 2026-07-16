// SERVER-ONLY data access for EL MEGÁFONO's public surfaces (/api/posts,
// /megafono, /megafono/[slug], sitemap). The pure types/helpers the client also
// needs live in lib/megafono.ts — keep this file out of client components.

import "server-only";
import { prisma } from "./prisma";
import { POSTS_PER_PAGE, type PublicPost } from "./megafono";

// the shim returns RowDataPacket[]; shape is guaranteed by the CREATE TABLE in lib/prisma.ts
export type DbPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentHtml: string | null;
  coverUrl: string | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * DB rows → public shape.
 *
 * Drops rows with no publishedAt IN MEMORY. It can't be a `where` clause: the
 * shim compiles `{ publishedAt: { not: null } }` to `publishedAt <> NULL`, which
 * is never true in SQL and would return zero rows. In practice publishing always
 * stamps the date, so this is a belt-and-braces guard against a half-written row
 * rendering as "Invalid Date".
 */
export function toPublicPosts(rows: DbPost[]): PublicPost[] {
  return rows
    .filter((p) => p.publishedAt != null)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverUrl: p.coverUrl,
      publishedAt: new Date(p.publishedAt as Date).toISOString(),
    }));
}

/** One page of published posts, newest first. `page` is 1-based. */
export async function getPublishedPosts(page = 1): Promise<{ posts: PublicPost[]; total: number; pages: number }> {
  const total = await prisma.post.count({ where: { status: "published" } });
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pages);

  const rows = (await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    skip: (safePage - 1) * POSTS_PER_PAGE,
    take: POSTS_PER_PAGE,
  })) as unknown as DbPost[];

  return { posts: toPublicPosts(rows), total, pages };
}

/** Every published post, for the sitemap. */
export async function getAllPublishedPosts(): Promise<PublicPost[]> {
  const rows = (await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
  })) as unknown as DbPost[];
  return toPublicPosts(rows);
}

/**
 * A single published post by slug, with its body. Returns null for unknown
 * slugs AND for drafts — callers turn that into a 404, so an unpublished URL is
 * indistinguishable from a nonexistent one.
 */
export async function getPublishedPost(
  slug: string,
): Promise<(PublicPost & { contentHtml: string | null }) | null> {
  const row = (await prisma.post.findUnique({ where: { slug } })) as unknown as DbPost | null;
  if (!row || row.status !== "published" || row.publishedAt == null) return null;
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverUrl: row.coverUrl,
    publishedAt: new Date(row.publishedAt).toISOString(),
    contentHtml: row.contentHtml,
  };
}
