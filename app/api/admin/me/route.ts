import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUserId, requireRole } from "@/lib/auth-guard";
import { ENV_ADMIN_ID } from "@/lib/auth";
import {
  BIO_MAX,
  HOST_NETWORKS,
  isSafeHostPhoto,
  isSafeHostUrl,
  parseHostSocials,
  SOCIALS_MAX,
} from "@/lib/hosts";

export const dynamic = "force-dynamic";

// Self-service profile for ANY signed-in panel user (including locutores, who
// can't touch /api/admin/station).
//
// SECURITY: the row written is ALWAYS resolved from the session
// (currentUserId() → AdminUser.hostId). Nothing identifying — id, email, role,
// active, hostId, name — is ever read from the request body. That is the whole
// point of this endpoint: a locutor can edit their own profile and nothing else.
const anyPanelUser = () => requireRole(["admin", "editor", "locutor"]);

type DbUser = { id: string; email: string; name: string; role: string; hostId: string | null };
type DbHost = {
  id: string; name: string; alias: string; show: string; hue: string;
  photoUrl: string | null; bio: string | null; socials: string | null;
};

const NO_PROFILE = "Tu cuenta todavía no está enlazada a un locutor. Pedile a un administrador que la enlace desde Usuarios.";
const ENV_ADMIN_MSG = "La cuenta de emergencia (.env) no tiene perfil editable. Iniciá sesión con tu cuenta de email.";

export async function GET() {
  const denied = await anyPanelUser();
  if (denied) return denied;

  const id = await currentUserId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The .env escape hatch has no AdminUser row — never try to create one
  // (ADMIN_USER may not be an email and would collide with the unique index).
  if (id === ENV_ADMIN_ID) {
    return NextResponse.json({ user: { id, name: id, email: null, role: "admin", envAdmin: true }, host: null, linked: false });
  }

  const u = (await prisma.adminUser.findUnique({ where: { id } })) as DbUser | null;
  if (!u) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const host = u.hostId ? ((await prisma.host.findUnique({ where: { id: u.hostId } })) as DbHost | null) : null;

  return NextResponse.json({
    user: { id: u.id, email: u.email, name: u.name, role: u.role, envAdmin: false },
    // a dangling hostId (admin deleted the Host) reads exactly like unlinked
    host: host
      ? {
          id: host.id, name: host.name, alias: host.alias, show: host.show, hue: host.hue,
          photoUrl: host.photoUrl, bio: host.bio, socials: parseHostSocials(host.socials),
        }
      : null,
    linked: !!host,
  });
}

// Only the fields a person owns about themselves. Name/alias/programs stay
// admin-controlled (Locutores), so nobody can rename themselves on air.
const schema = z.object({
  bio: z.string().max(BIO_MAX).nullable().optional(),
  photoUrl: z.string().max(300).refine(isSafeHostPhoto, "Foto no permitida").nullable().optional(),
  socials: z
    .array(
      z.object({
        network: z.enum(HOST_NETWORKS),
        url: z.string().max(300).refine(isSafeHostUrl, "URL no permitida"),
      }),
    )
    .max(SOCIALS_MAX)
    .nullable()
    .optional(),
});

export async function PUT(req: Request) {
  const denied = await anyPanelUser();
  if (denied) return denied;

  const id = await currentUserId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (id === ENV_ADMIN_ID) return NextResponse.json({ error: ENV_ADMIN_MSG }, { status: 409 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const u = (await prisma.adminUser.findUnique({ where: { id } })) as DbUser | null;
  if (!u) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!u.hostId) return NextResponse.json({ error: NO_PROFILE }, { status: 409 });

  const host = (await prisma.host.findUnique({ where: { id: u.hostId } })) as DbHost | null;
  if (!host) return NextResponse.json({ error: NO_PROFILE }, { status: 409 });

  const data: Record<string, unknown> = {};
  if ("bio" in parsed.data) data.bio = parsed.data.bio || null;
  if ("photoUrl" in parsed.data) data.photoUrl = parsed.data.photoUrl || null;
  if ("socials" in parsed.data) {
    data.socials = parsed.data.socials && parsed.data.socials.length ? JSON.stringify(parsed.data.socials) : null;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  // NOTE: the update targets u.hostId — never an id from the body.
  await prisma.host.update({ where: { id: u.hostId }, data });

  // Re-read instead of trusting update()'s return: the shim returns null when
  // affectedRows === 0, which is what MySQL reports when a save writes the same
  // values. Treating that as an error would break "save with no changes".
  const fresh = (await prisma.host.findUnique({ where: { id: u.hostId } })) as DbHost | null;
  return NextResponse.json({
    ok: true,
    host: fresh && {
      id: fresh.id, name: fresh.name, alias: fresh.alias, show: fresh.show, hue: fresh.hue,
      photoUrl: fresh.photoUrl, bio: fresh.bio, socials: parseHostSocials(fresh.socials),
    },
  });
}
