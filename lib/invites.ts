// Admin invite tokens + invite email.
//
// The raw token is only ever shown once (returned to the inviting admin and
// emailed); the DB stores a sha256 hash, so a DB leak can't be used to accept
// invites. Email is best-effort: if Resend isn't configured the invite still
// works — the admin copies the link from the panel.

import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { SITE } from "./seo";
import { ROLE_LABELS, type Role } from "./roles";

export const INVITE_TTL_DAYS = 7;

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteExpiry(): Date {
  return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * The token link. `reset` only changes the wording on the landing page — the
 * accept endpoint treats both the same (it sets a password against a valid
 * token), so nothing security-relevant hangs on this flag.
 */
export function inviteUrl(token: string, origin?: string, opts?: { reset?: boolean }): string {
  const base = origin || process.env.NEXTAUTH_URL || SITE.url;
  return `${base.replace(/\/$/, "")}/admin/invite?token=${token}${opts?.reset ? "&reset=1" : ""}`;
}

/**
 * Sends the invite email. Returns true if sent, false if skipped/failed —
 * callers must NOT treat false as an error (the link is shown in the panel).
 */
export async function sendInviteEmail(opts: {
  to: string;
  name: string;
  role: Role;
  url: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[invites] RESEND_API_KEY not set — skipping email for", opts.to);
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@lamegaecuador.com",
      to: opts.to,
      subject: "Te invitaron al panel de La Mega 99.9 FM",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px">
          <h2 style="color:#E31E24">La Mega 99.9 FM</h2>
          <p>Hola ${escapeHtml(opts.name)},</p>
          <p>Te dieron acceso al panel de administración de <strong>La Mega 99.9 FM</strong>
             con el rol <strong>${ROLE_LABELS[opts.role]}</strong>.</p>
          <p>Para empezar, creá tu contraseña:</p>
          <p>
            <a href="${opts.url}"
               style="display:inline-block;background:#E31E24;color:#fff;text-decoration:none;
                      padding:12px 22px;border-radius:8px;font-weight:600">
              Crear mi contraseña
            </a>
          </p>
          <p style="color:#666;font-size:13px">
            El enlace vence en ${INVITE_TTL_DAYS} días y se puede usar una sola vez.<br>
            Si el botón no funciona, copiá este enlace:<br>
            <span style="word-break:break-all">${opts.url}</span>
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.warn("[invites] email send failed for", opts.to, err);
    return false;
  }
}

/**
 * Sends the password-reset email. Same best-effort contract as sendInviteEmail:
 * false means "not sent", NOT "failed" — the admin always gets the link in the
 * panel, so a reset works with Resend unconfigured.
 */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  url: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[invites] RESEND_API_KEY not set — skipping reset email for", opts.to);
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@lamegaecuador.com",
      to: opts.to,
      subject: "Restablecé tu contraseña — La Mega 99.9 FM",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px">
          <h2 style="color:#E31E24">La Mega 99.9 FM</h2>
          <p>Hola ${escapeHtml(opts.name)},</p>
          <p>Un administrador generó un enlace para que elijas una
             <strong>contraseña nueva</strong> del panel de La Mega 99.9 FM.</p>
          <p>
            <a href="${opts.url}"
               style="display:inline-block;background:#E31E24;color:#fff;text-decoration:none;
                      padding:12px 22px;border-radius:8px;font-weight:600">
              Elegir contraseña nueva
            </a>
          </p>
          <p style="color:#666;font-size:13px">
            El enlace vence en ${INVITE_TTL_DAYS} días y se puede usar una sola vez.
            Tu contraseña actual sigue funcionando hasta que uses el enlace.<br>
            Si el botón no funciona, copiá este enlace:<br>
            <span style="word-break:break-all">${opts.url}</span>
          </p>
          <p style="color:#666;font-size:13px">
            Si no esperabas este correo, avisale al equipo de La Mega.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.warn("[invites] reset email send failed for", opts.to, err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
