import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  frequency: "99.9 FM",
  city: "Ibarra",
  coverage: "Imbabura",
  slogan: "Solo La Mega",
  streamOn: true,
  tvOn: true,
  pushOn: true,
  autoOn: true,
  maintenance: false,
};

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  const config = await prisma.stationConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({ config: config ?? { id: 1, ...DEFAULTS } });
}

const schema = z.object({
  frequency: z.string().min(1).max(40),
  city: z.string().min(1).max(60),
  coverage: z.string().min(1).max(60),
  slogan: z.string().min(1).max(120),
  streamOn: z.boolean(),
  tvOn: z.boolean(),
  pushOn: z.boolean(),
  autoOn: z.boolean(),
  maintenance: z.boolean(),
});

export async function PUT(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const config = await prisma.stationConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  });

  // the public site (ticker, footer) listens for this
  emit("config_update", {
    frequency: config.frequency,
    city: config.city,
    coverage: config.coverage,
    slogan: config.slogan,
  });

  return NextResponse.json({ ok: true, config });
}
