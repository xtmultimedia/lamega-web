import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/roles";
import { currentUserId, requireRole } from "@/lib/auth-guard";
import { generateInviteToken, hashInviteToken, inviteExpiry, inviteUrl, sendInviteEmail } from "@/lib/invites";

export const dynamic = "force-dynamic";

type DbUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string | null;
  active: boolean;
};

/** Guard: never let the panel end up with zero usable admins. */
async function wouldOrphanAdmins(target: DbUser): Promise<boolean> {
  if (target.role !== "admin" || !target.active) return false;
  const activeAdmins = await prisma.adminUser.count({ where: { role: "admin", active: true } });
  return activeAdmins <= 1;
}

const patchSchema = z.object({
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
  resend_invite: z.boolean().optional(),
  // links this account to its locutor profile; null unlinks
  hostId: z.string().max(191).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireRole(["admin"]);
  if (denied) return denied;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const user = (await prisma.adminUser.findUnique({ where: { id: params.id } })) as DbUser | null;
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const me = await currentUserId();
  if (me === user.id && (parsed.data.active === false || parsed.data.role)) {
    return NextResponse.json({ error: "No podés cambiar tu propio rol ni desactivarte" }, { status: 400 });
  }

  // Re-issue an invite link for someone who hasn't set a password yet.
  if (parsed.data.resend_invite) {
    if (user.passwordHash) {
      return NextResponse.json({ error: "Ese usuario ya tiene contraseña" }, { status: 400 });
    }
    const token = generateInviteToken();
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { inviteTokenHash: hashInviteToken(token), inviteExpiresAt: inviteExpiry() },
    });
    const url = inviteUrl(token, new URL(req.url).origin);
    const emailed = await sendInviteEmail({
      to: user.email,
      name: user.name,
      role: user.role as "admin" | "editor" | "locutor",
      url,
    });
    return NextResponse.json({ ok: true, invite_url: url, emailed });
  }

  const losingAdmin = parsed.data.active === false || (parsed.data.role && parsed.data.role !== "admin");
  if (losingAdmin && (await wouldOrphanAdmins(user))) {
    return NextResponse.json({ error: "Debe quedar al menos un Admin activo" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.role) data.role = parsed.data.role;
  if (typeof parsed.data.active === "boolean") data.active = parsed.data.active;
  if ("hostId" in parsed.data) {
    const hostId = parsed.data.hostId || null;
    if (hostId) {
      // don't let an admin link an account to a locutor that doesn't exist
      const host = await prisma.host.findUnique({ where: { id: hostId } });
      if (!host) return NextResponse.json({ error: "Ese locutor no existe" }, { status: 400 });
    }
    data.hostId = hostId;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  await prisma.adminUser.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireRole(["admin"]);
  if (denied) return denied;

  const user = (await prisma.adminUser.findUnique({ where: { id: params.id } })) as DbUser | null;
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const me = await currentUserId();
  if (me === user.id) {
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 400 });
  }
  if (await wouldOrphanAdmins(user)) {
    return NextResponse.json({ error: "Debe quedar al menos un Admin activo" }, { status: 400 });
  }

  await prisma.adminUser.deleteMany({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
