import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const schema = z.object({
  business_name: z.string().min(1).max(120),
  contact_name: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  ad_type: z.string().min(1).max(60),
  duration: z.string().max(40).optional().or(z.literal("")),
  budget: z.string().max(40).optional().or(z.literal("")),
  audience: z.array(z.string().max(40)).default([]),
  brief: z.string().max(2000).optional().or(z.literal("")),
  file_name: z.string().max(200).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const row = await prisma.adCampaign.create({
    data: {
      businessName: d.business_name,
      contactName: d.contact_name,
      email: d.email,
      phone: d.phone || null,
      adType: d.ad_type,
      duration: d.duration || null,
      budget: d.budget || null,
      audience: JSON.stringify(d.audience),
      brief: d.brief || null,
      fileName: d.file_name || null,
    },
  });

  await notifyComercial(row.id, d).catch((err) =>
    console.warn("[campaigns] email notification failed:", err?.message ?? err)
  );

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}

async function notifyComercial(id: string, d: z.infer<typeof schema>) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_TO_COMERCIAL;
  if (!apiKey || !to) {
    console.warn("[campaigns] RESEND_API_KEY/EMAIL_TO_COMERCIAL not set — skipping email for", id);
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@lamegaecuador.com",
    to,
    subject: `Nueva solicitud de publicidad: ${d.business_name}`,
    html: `
      <h2>Nueva solicitud de publicidad — La Mega 99.9</h2>
      <table cellpadding="6">
        <tr><td><b>Negocio</b></td><td>${esc(d.business_name)}</td></tr>
        <tr><td><b>Contacto</b></td><td>${esc(d.contact_name)}</td></tr>
        <tr><td><b>Email</b></td><td>${esc(d.email)}</td></tr>
        <tr><td><b>Teléfono</b></td><td>${esc(d.phone || "—")}</td></tr>
        <tr><td><b>Tipo de anuncio</b></td><td>${esc(d.ad_type)}</td></tr>
        <tr><td><b>Duración</b></td><td>${esc(d.duration || "—")}</td></tr>
        <tr><td><b>Presupuesto</b></td><td>${esc(d.budget || "—")}</td></tr>
        <tr><td><b>Público</b></td><td>${esc(d.audience.join(", ") || "—")}</td></tr>
        <tr><td><b>Brief</b></td><td>${esc(d.brief || "—")}</td></tr>
      </table>
      <p>ID interno: ${id}</p>
    `,
  });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
