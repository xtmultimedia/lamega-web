// SERVER-ONLY role guards for admin API routes and server components.
// Keep these out of lib/roles.ts so client components can import the role
// constants without pulling next-auth/bcrypt/mysql2 into the browser bundle.

import "server-only";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { isRole, type Role } from "./roles";

/**
 * Guard for admin API routes. Returns a NextResponse to return early when the
 * caller is unauthenticated (401) or lacks the role (403); null when allowed.
 *
 *   const denied = await requireRole(["admin"]);
 *   if (denied) return denied;
 */
export async function requireRole(allowed: readonly Role[]): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string } | undefined)?.role;
  if (!isRole(role) || !allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Current session's role, or null if not signed in. */
export async function currentRole(): Promise<Role | null> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  return isRole(role) ? role : null;
}

/** Current session's user id ("env-admin" for the .env escape hatch). */
export async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}
