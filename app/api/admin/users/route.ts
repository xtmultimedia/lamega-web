import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/roles";
import { requireRole } from "@/lib/auth-guard";
import { generateInviteToken, hashInviteToken, inviteExpiry, inviteUrl, sendInviteEmail } from "@/lib/invites";

export const dynamic = "force-dynamic";

type DbUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string | null;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

// Never leak hashes/tokens to the client.
function toPublic(u: DbUser) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    pending: !u.passwordHash, // invited but hasn't set a password yet
    last_login_at: u.lastLoginAt?.toISOString() ?? null,
    created_at: u.createdAt?.toISOString() ?? null,
  };
}

export async function GET() {
  const denied = await requireRole(["admin"]);
  if (denied) return denied;

  const users = (await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } })) as DbUser[];
  return NextResponse.json({ users: users.map(toPublic) });
}

const inviteSchema = z.object({
  email: z.string().email().max(191),
  name: z.string().min(1).max(120),
  role: z.enum(ROLES),
});

export async function POST(req: Request) {
  const denied = await requireRole(["admin"]);
  if (denied) return denied;

  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  const token = generateInviteToken();
  const user = (await prisma.adminUser.create({
    data: {
      email,
      name: parsed.data.name.trim(),
      role: parsed.data.role as Role,
      inviteTokenHash: hashInviteToken(token),
      inviteExpiresAt: inviteExpiry(),
      active: true,
    },
  })) as DbUser;

  const url = inviteUrl(token, new URL(req.url).origin);
  const emailed = await sendInviteEmail({ to: email, name: user.name, role: parsed.data.role, url });

  // The link is always returned so the admin can share it manually when email
  // isn't configured — the invite must not depend on Resend.
  return NextResponse.json({ ok: true, user: toPublic(user), invite_url: url, emailed }, { status: 201 });
}
