import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Publicidad: content roles.
  const denied = await requireRole(["admin", "editor"]);
  if (denied) return denied;
  const rows = await prisma.adCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({
    campaigns: rows.map((r) => ({ ...r, audience: safeParse(r.audience) })),
  });
}

function safeParse(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
