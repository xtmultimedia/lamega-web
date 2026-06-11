import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { requireRadioKey } from "@/lib/radio-auth";
import { getQueue } from "@/lib/radio-state";

export const dynamic = "force-dynamic";

const schema = z.object({ song_request_id: z.string().min(1) });

export async function POST(req: Request) {
  const unauthorized = requireRadioKey(req);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.songRequest.findUnique({ where: { id: parsed.data.song_request_id } });
  if (!existing || existing.status !== "approved") {
    return NextResponse.json({ error: "Request not found in queue" }, { status: 404 });
  }

  await prisma.songRequest.update({
    where: { id: existing.id },
    data: { status: "on_air", airedAt: new Date() },
  });

  const queue = await getQueue();
  emit("queue_update", queue);
  return NextResponse.json({ ok: true, ...queue });
}
