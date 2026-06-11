import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";

export const dynamic = "force-dynamic";

const schema = z.object({ active: z.boolean(), message: z.string().optional() });

// Same effect as POST /api/radio/emergency but authenticated with the
// admin session (used by the dashboard's quick action).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
