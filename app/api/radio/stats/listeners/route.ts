import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { requireRadioKey } from "@/lib/radio-auth";

export const dynamic = "force-dynamic";

const schema = z.object({ count: z.number().int().min(0) });

export async function POST(req: Request) {
  const unauthorized = requireRadioKey(req);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.radioStats.upsert({
    where: { id: 1 },
    create: { id: 1, listeners: parsed.data.count },
    update: { listeners: parsed.data.count },
  });

  emit("listener_count", { count: parsed.data.count });
  return NextResponse.json({ ok: true, listeners: parsed.data.count });
}
