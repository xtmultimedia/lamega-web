import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { requireRadioKey } from "@/lib/radio-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  program_name: z.string().min(1),
  host: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  is_live: z.boolean(),
});

export async function POST(req: Request) {
  const unauthorized = requireRadioKey(req);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const data = {
    programName: d.program_name,
    host: d.host,
    startTime: d.start_time,
    endTime: d.end_time,
    isLive: d.is_live,
  };
  await prisma.currentProgram.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });

  emit("program_update", d);
  return NextResponse.json({ ok: true, program: d });
}
