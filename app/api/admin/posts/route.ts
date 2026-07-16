import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { sanitizePostHtml } from "@/lib/sanitize";
import {
  EXCERPT_MAX,
  POST_STATUSES,
  SLUG_MAX,
  TITLE_MAX,
  isSafeUploadUrl,
  isValidSlug,
  slugify,
} from "@/lib/megafono";
import { type DbPost, toAdminPost, uniqueSlug } from "./shared";

export const dynamic = "force-dynamic";

// EL MEGÁFONO — the blog. Unlike /api/admin/station (which bulk-replaces whole
// tables), posts get real per-row CRUD: this table grows without bound and its
// rows own public URLs, so delete-and-recreate would break every published link.
const canEdit = () => requireRole(["admin", "editor"]);

export async function GET() {
  const denied = await canEdit();
  if (denied) return denied;

  // Drafts live here too, so this list is admin-only by construction.
  const rows = (await prisma.post.findMany({ orderBy: { createdAt: "desc" } })) as unknown as DbPost[];
  return NextResponse.json({ posts: rows.map(toAdminPost) });
}

const createSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(TITLE_MAX),
  slug: z.string().max(SLUG_MAX).refine(isValidSlug, "Slug inválido").optional(),
  excerpt: z.string().max(EXCERPT_MAX).nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  coverUrl: z.string().max(255).refine(isSafeUploadUrl, "Imagen no permitida").nullable().optional(),
  status: z.enum(POST_STATUSES).default("draft"),
});

export async function POST(req: Request) {
  const denied = await canEdit();
  if (denied) return denied;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { title, excerpt, contentHtml, coverUrl, status } = parsed.data;

  // slugify() returns "" for a title with no usable characters (e.g. "¿¡!?" or
  // pure emoji). An empty slug would collide on the UNIQUE index, so fall back
  // to a generic base and let uniqueSlug() number it.
  const base = parsed.data.slug ?? slugify(title) ?? "";
  const slug = await uniqueSlug(base || "nota", null);

  let clean: string | null = null;
  try {
    clean = contentHtml ? sanitizePostHtml(contentHtml) : null;
  } catch {
    return NextResponse.json({ error: "El contenido es demasiado largo." }, { status: 400 });
  }

  try {
    const created = (await prisma.post.create({
      data: {
        slug,
        title,
        excerpt: excerpt || null,
        contentHtml: clean,
        coverUrl: coverUrl || null,
        status,
        // Stamped on first publish only, so later edits never reshuffle the
        // public ordering. See the same rule in PATCH.
        publishedAt: status === "published" ? new Date() : null,
      },
    })) as unknown as DbPost;
    return NextResponse.json({ post: toAdminPost(created) }, { status: 201 });
  } catch (err) {
    // uniqueSlug() checks first, but two concurrent creates can still race to
    // the same slug. The UNIQUE index is the real guard; report it as a conflict
    // rather than a 500.
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Ya existe una nota con ese enlace. Probá de nuevo." }, { status: 409 });
    }
    throw err;
  }
}
