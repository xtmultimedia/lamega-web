import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashInviteToken } from "@/lib/invites";

// Public route (the invitee isn't signed in yet). Security rests on the token:
// random 32 bytes, stored hashed, time-limited and single-use.
export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(200),
});

type DbUser = { id: string; name: string; email: string; inviteExpiresAt: Date | null };

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const tokenHash = hashInviteToken(parsed.data.token);
  const matches = (await prisma.adminUser.findMany({
    where: { inviteTokenHash: tokenHash },
  })) as DbUser[];
  const user = matches[0];

  if (!user) {
    return NextResponse.json({ error: "Invitación inválida o ya utilizada" }, { status: 400 });
  }
  if (user.inviteExpiresAt && new Date(user.inviteExpiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "La invitación venció. Pedí una nueva al administrador." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.adminUser.update({
    where: { id: user.id },
    // Clearing the token makes the invite single-use.
    data: { passwordHash, inviteTokenHash: null, inviteExpiresAt: null, active: true },
  });

  return NextResponse.json({ ok: true, email: user.email });
}
