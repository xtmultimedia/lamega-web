import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { isSafeFooterUrl, parseFooter } from "@/lib/footer";
import { extractTvEmbedUrl, isSafeTvEmbedUrl } from "@/lib/tv-embed";

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
  tvEmbedUrl: null as string | null,
};

// Configuración is admin-only (editors/locutores get 403).
const requireSession = () => requireRole(["admin"]);

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

// OneStream player embed: accepts the bare URL or the whole <iframe> snippet, stores
// only the validated URL. Empty string clears it. `undefined` = field not sent
// (older panel build) and must leave the stored value untouched.
const tvEmbedSchema = z
  .string()
  .max(1500)
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? undefined : extractTvEmbedUrl(v)))
  .refine((v) => v === undefined || v === "" || isSafeTvEmbedUrl(v), {
    message: "Pega la URL del reproductor de OneStream (https://player.onestream.live/embed?token=…) o su código iframe",
  });

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
  tvEmbedUrl: tvEmbedSchema,
});

export async function PUT(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { footer, tvEmbedUrl, ...rest } = parsed.data;
  // serialize footer to a JSON string (null clears it → public site uses defaults)
  const data: Record<string, unknown> = { ...rest, footer: footer == null ? null : JSON.stringify(footer) };
  // only touch the embed column when the client sent it ("" clears → null)
  if (tvEmbedUrl !== undefined) data.tvEmbedUrl = tvEmbedUrl === "" ? null : tvEmbedUrl;

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
    tv_embed_url: isSafeTvEmbedUrl(config.tvEmbedUrl) ? config.tvEmbedUrl : null,
  });

  return NextResponse.json({ ok: true, config: { ...config, footer: parseFooter(config.footer) } });
}
