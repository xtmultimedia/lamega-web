import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { getQueue } from "@/lib/radio-state";

export const dynamic = "force-dynamic";

// Solicitudes: every role (locutores put songs on air).
async function requireSession() {
  return requireRole(["admin", "editor", "locutor"]);
}

export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const rows = await prisma.songRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ requests: rows });
}

const patchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { id, action } = parsed.data;

  const row = await prisma.songRequest.update({
    where: { id },
    data:
      action === "approve"
        ? { status: "approved", approvedAt: new Date() }
        : { status: "rejected" },
  }).catch(() => null);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  emit("queue_update", await getQueue());
  return NextResponse.json({ ok: true, request: row });
}
