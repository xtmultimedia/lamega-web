import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { currentUserId, requireRole } from "@/lib/auth-guard";
import { ENV_ADMIN_ID } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Change your OWN password. Like /api/admin/me, the row is resolved from the
// session — never from the body — and the current password must be proven.
const schema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres").max(200),
});

type DbUser = { id: string; passwordHash: string | null };

export async function POST(req: Request) {
  const denied = await requireRole(["admin", "editor", "locutor"]);
  if (denied) return denied;

  const id = await currentUserId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (id === ENV_ADMIN_ID) {
    return NextResponse.json(
      { error: "La cuenta de emergencia (.env) cambia su contraseña editando el archivo .env del servidor." },
      { status: 409 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const u = (await prisma.adminUser.findUnique({ where: { id } })) as DbUser | null;
  if (!u || !u.passwordHash) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const ok = await bcrypt.compare(parsed.data.current_password, u.passwordHash);
  if (!ok) return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.new_password, 10);
  await prisma.adminUser.update({ where: { id: u.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
