// Roles + permission map. PURE: no server-only imports, so client components
// (AdminApp, UsuariosView) can import this safely. The server-side guards live
// in lib/auth-guard.ts — importing those here would drag next-auth, bcrypt and
// mysql2 into the browser bundle.

export const ROLES = ["admin", "editor", "locutor"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  locutor: "Locutor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Acceso total, incluida Configuración y la gestión de usuarios.",
  editor: "Contenido y solicitudes. Sin Configuración ni usuarios.",
  locutor: "Solo Dashboard y Solicitudes (poner temas al aire).",
};

// Panel sections each role may open. Keys match the ADM_NAV ids in AdminApp.
export const SECTION_ROLES: Record<string, readonly Role[]> = {
  dashboard: ["admin", "editor", "locutor"],
  solicitudes: ["admin", "editor", "locutor"],
  programacion: ["admin", "editor"],
  locutores: ["admin", "editor"],
  playlists: ["admin", "editor"],
  galeria: ["admin", "editor"],
  publicidad: ["admin", "editor"],
  configuracion: ["admin"],
  usuarios: ["admin"],
};

export function canAccessSection(role: Role, section: string): boolean {
  const allowed = SECTION_ROLES[section];
  return !allowed || allowed.includes(role);
}
