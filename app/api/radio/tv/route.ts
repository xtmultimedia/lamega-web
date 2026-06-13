import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { requireRadioKey } from "@/lib/radio-auth";

export const dynamic = "force-dynamic";

// Mega TV on-air flag. The automation app POSTs { "live": true } when it starts
// the OneStream broadcast and { "live": false } when it stops. The public site
// shows the Mega TV section only while live === true (auto hide/show).
const schema = z.object({ live: z.boolean() });

export async function POST(req: Request) {
  const unauthorized = requireRadioKey(req);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { live } = parsed.data;

  await prisma.stationState.upsert({
    where: { id: 1 },
    create: { id: 1, tvLive: live },
    update: { tvLive: live },
  });

  emit("tv_status", { live });
  return NextResponse.json({ ok: true, live });
}
