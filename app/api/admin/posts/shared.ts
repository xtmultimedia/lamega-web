// Shared helpers for the EL MEGÁFONO admin routes. Not a route itself — only
// route.ts files under app/ become endpoints.

import { prisma } from "@/lib/prisma";
import { SLUG_MAX, type AdminPost, type PostStatus } from "@/lib/megafono";

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

/** DB row → the shape the admin panel consumes (dates as ISO strings). */
export function toAdminPost(p: DbPost): AdminPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    contentHtml: p.contentHtml,
    coverUrl: p.coverUrl,
    status: p.status as PostStatus,
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
  };
}

/**
 * Find a free slug, appending -2, -3, … until one is unused.
 *
 * `excludeId` is the post being edited — without it, saving a post without
 * touching its title would see its OWN slug as taken and rename it to "-2" on
 * every save, silently breaking the published URL.
 *
 * The shim has no `contains`/LIKE, so this probes by equality (the UNIQUE index
 * makes each probe an index hit). Sequential by design: the loop stops at the
 * first gap, which for real editorial volume is the first or second try.
 */
export async function uniqueSlug(base: string, excludeId: string | null): Promise<string> {
  // Reserve room for the "-99" suffix so a max-length title can still be numbered.
  const stem = base.slice(0, SLUG_MAX - 4).replace(/-+$/g, "") || "nota";
  for (let n = 1; n <= 99; n++) {
    const candidate = n === 1 ? stem : `${stem}-${n}`;
    const hit = (await prisma.post.findUnique({ where: { slug: candidate } })) as unknown as DbPost | null;
    if (!hit || hit.id === excludeId) return candidate;
  }
  // 99 posts sharing one title is pathological; fall back to a random suffix
  // rather than looping forever or throwing.
  return `${stem}-${Math.random().toString(36).slice(2, 8)}`;
}
