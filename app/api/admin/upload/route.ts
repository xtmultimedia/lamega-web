import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { currentRole, requireRole } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const MAX_BYTES = 80 * 1024 * 1024; // 80 MB — Galería (admin/editor)
const LOCUTOR_MAX_BYTES = 8 * 1024 * 1024; // 8 MB — profile avatars

// Receives one file (multipart field "file"), stores it under
// public/uploads/ and returns its public URL.
export async function POST(req: Request) {
  // Galería (admin/editor) + Mi Perfil avatars (locutor, restricted below).
  const denied = await requireRole(["admin", "editor", "locutor"]);
  if (denied) return denied;
  const role = await currentRole();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: `Tipo no permitido: ${file.type}. Usa JPG, PNG, WebP, GIF, MP4, WebM o MOV.` }, { status: 400 });
  }

  // Locutores only ever upload their own avatar — images only, and far below
  // the Galería's video allowance.
  if (role === "locutor") {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo podés subir imágenes (JPG, PNG, WebP)." }, { status: 400 });
    }
    if (file.size > LOCUTOR_MAX_BYTES) {
      return NextResponse.json({ error: "La imagen es muy grande (máx. 8 MB)" }, { status: 400 });
    }
  } else if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx. 80 MB)" }, { status: 400 });
  }

  const name = `${randomUUID()}.${ext}`;
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    ok: true,
    url: `/uploads/${name}`,
    kind: file.type.startsWith("video/") ? "video" : "image",
  });
}
