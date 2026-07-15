import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";

export const dynamic = "force-dynamic";

const schema = z.object({ active: z.boolean(), message: z.string().optional() });

// Same effect as POST /api/radio/emergency but authenticated with the
// admin session (used by the dashboard's quick action).
export async function POST(req: Request) {
  // Site-wide emergency banner: content roles, not locutores.
  const denied = await requireRole(["admin", "editor"]);
  if (denied) return denied;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const { active, message } = parsed.data;

  await prisma.stationState.upsert({
    where: { id: 1 },
    create: { id: 1, emergencyActive: active, emergencyMessage: message ?? null },
    update: { emergencyActive: active, emergencyMessage: message ?? null },
  });

  emit("emergency", { active, message: message ?? null });
  return NextResponse.json({ ok: true, active });
}
