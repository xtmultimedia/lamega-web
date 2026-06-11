import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { requireRadioKey } from "@/lib/radio-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  active: z.boolean(),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  const unauthorized = requireRadioKey(req);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { active, message } = parsed.data;

  await prisma.stationState.upsert({
    where: { id: 1 },
    create: { id: 1, emergencyActive: active, emergencyMessage: message ?? null },
    update: { emergencyActive: active, emergencyMessage: message ?? null },
  });

  emit("emergency", { active, message: message ?? null });
  return NextResponse.json({ ok: true, active, message: message ?? null });
}
