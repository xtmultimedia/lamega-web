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
} from "@/lib/megafono";
import { type DbPost, toAdminPost, uniqueSlug } from "../shared";

export const dynamic = "force-dynamic";

const canEdit = () => requireRole(["admin", "editor"]);

const patchSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(TITLE_MAX).optional(),
  slug: z.string().max(SLUG_MAX).refine(isValidSlug, "Slug inválido").optional(),
  excerpt: z.string().max(EXCERPT_MAX).nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  coverUrl: z.string().max(255).refine(isSafeUploadUrl, "Imagen no permitida").nullable().optional(),
  status: z.enum(POST_STATUSES).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await canEdit();
  if (denied) return denied;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = (await prisma.post.findUnique({ where: { id: params.id } })) as unknown as DbPost | null;
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if ("excerpt" in parsed.data) data.excerpt = parsed.data.excerpt || null;
  if ("coverUrl" in parsed.data) data.coverUrl = parsed.data.coverUrl || null;

  if ("contentHtml" in parsed.data) {
    try {
      data.contentHtml = parsed.data.contentHtml ? sanitizePostHtml(parsed.data.contentHtml) : null;
    } catch {
      return NextResponse.json({ error: "El contenido es demasiado largo." }, { status: 400 });
    }
  }

  // Pass the post's own id so an unchanged slug isn't seen as taken and bumped
  // to "-2" on every save — that would break the live URL of a published post.
  if (parsed.data.slug !== undefined && parsed.data.slug !== existing.slug) {
    data.slug = await uniqueSlug(parsed.data.slug, existing.id);
  }

  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
    // Stamp publishedAt on the FIRST publish only. Re-editing a live post must
    // not bump it to today (the list is ordered by this), and unpublishing keeps
    // the original date so a later republish doesn't jump to the top.
    if (parsed.data.status === "published" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  try {
    await prisma.post.update({ where: { id: params.id }, data });
  } catch (err) {
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Ya existe una nota con ese enlace." }, { status: 409 });
    }
    throw err;
  }

  // Re-read instead of trusting update()'s return: the shim returns null when
  // affectedRows === 0, which is what MySQL reports when a save writes identical
  // values. Treating that as an error would break "save with no changes".
  const fresh = (await prisma.post.findUnique({ where: { id: params.id } })) as unknown as DbPost | null;
  if (!fresh) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ post: toAdminPost(fresh) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await canEdit();
  if (denied) return denied;

  const { count } = await prisma.post.deleteMany({ where: { id: params.id } });
  if (count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
