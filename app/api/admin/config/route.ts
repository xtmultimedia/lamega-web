import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { isSafeFooterUrl, parseFooter } from "@/lib/footer";

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
  footer: null as string | null,
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
  const base = config ?? { id: 1, ...DEFAULTS };
  // hand the editor a parsed footer array (or null) instead of the raw JSON string
  return NextResponse.json({ config: { ...base, footer: parseFooter(base.footer) } });
}

const footerSchema = z
  .array(
    z.object({
      title: z.string().max(60),
      links: z
        .array(
          z.object({
            label: z.string().max(60),
            url: z.string().max(300).refine(isSafeFooterUrl, "URL no permitida").optional(),
          }),
        )
        .max(12),
    }),
  )
  .max(8)
  .nullable()
  .optional();

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
  footer: footerSchema,
});

export async function PUT(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { footer, ...rest } = parsed.data;
  // serialize footer to a JSON string (null clears it → public site uses defaults)
  const data = { ...rest, footer: footer == null ? null : JSON.stringify(footer) };

  const config = await prisma.stationConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  // the public site (ticker, footer) listens for this
  emit("config_update", {
    frequency: config.frequency,
    city: config.city,
    coverage: config.coverage,
    slogan: config.slogan,
    footer: parseFooter(config.footer),
  });

  return NextResponse.json({ ok: true, config: { ...config, footer: parseFooter(config.footer) } });
}
