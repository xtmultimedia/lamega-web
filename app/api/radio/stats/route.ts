import { NextResponse } from "next/server";
import { getStats } from "@/lib/radio-state";
import { requireRadioKey } from "@/lib/radio-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauthorized = requireRadioKey(req);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await getStats());
}
