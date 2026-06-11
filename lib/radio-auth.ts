import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

// Returns a 401 response if the X-Radio-API-Key header is missing or wrong,
// or null if the request is authorized.
export function requireRadioKey(req: Request): NextResponse | null {
  const expected = process.env.RADIO_API_KEY;
  const provided = req.headers.get("x-radio-api-key");
  if (!expected || !provided) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
