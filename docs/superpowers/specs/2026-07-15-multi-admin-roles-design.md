# Multi-admin con roles e invitaciones — Diseño

**Fecha:** 2026-07-15
**Estado:** Aprobado

## Objetivo

Hoy el panel `/admin` tiene **una sola credencial compartida** (`ADMIN_USER`/`ADMIN_PASSWORD`
del `.env`): sin cuentas individuales, sin email, sin roles, sin pantalla de gestión.
Se necesita sumar a **Alexis (vilanezalexis@gmail.com)** y, en general, poder dar acceso al
equipo con permisos diferenciados.

## Decisiones (confirmadas)

- Roles: **Admin + Editor + Locutor**.
- Alta: **invitación por email** (Resend), con link copiable como respaldo.
- Login: **email + contraseña**.

## Modelo de datos

Nueva tabla **`AdminUser`**:

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `email` | string | **único**, se guarda en minúsculas |
| `name` | string | nombre visible |
| `role` | string | `admin` \| `editor` \| `locutor` |
| `passwordHash` | string? | null hasta que acepta la invitación |
| `inviteTokenHash` | string? | sha256 del token; null tras aceptar |
| `inviteExpiresAt` | datetime? | 7 días |
| `active` | bool | default true |
| `lastLoginAt` | datetime? | |
| `createdAt` / `updatedAt` | datetime | |

Se crea con **`CREATE TABLE IF NOT EXISTS` idempotente en el arranque** del pool
(`lib/prisma.ts`), igual que `StationState.tvLive` y `StationConfig.footer` — no se puede
correr `prisma db push` contra la MySQL de FastComet. `prisma/schema.prisma` se actualiza como
fuente de verdad. Se agrega `adminUser` al mapa `MODELS` del shim.

## Roles y permisos

Aplicados **en el servidor** (no solo ocultando UI):

| Sección / API | Admin | Editor | Locutor |
|---|:--:|:--:|:--:|
| Dashboard + stats | ✅ | ✅ | ✅ |
| Solicitudes (`/api/admin/requests`) | ✅ | ✅ | ✅ |
| Programación · Locutores · Playlists (`/api/admin/station`) | ✅ | ✅ | ❌ |
| Galería (`/api/admin/media`, `/api/admin/upload`) | ✅ | ✅ | ❌ |
| Publicidad (`/api/admin/campaigns`) | ✅ | ✅ | ❌ |
| Modo emergencia (`/api/admin/emergency`) | ✅ | ✅ | ❌ |
| **Configuración (`/api/admin/config`)** | ✅ | ❌ | ❌ |
| **Usuarios (`/api/admin/users`)** | ✅ | ❌ | ❌ |

`lib/roles.ts` define los roles, el mapa de permisos y `requireRole(...)`, que devuelve
**403** si el rol no alcanza. La UI además filtra el nav según el rol (defensa en profundidad).

## Autenticación

- `lib/auth.ts`: CredentialsProvider con **email + password**.
  - Busca `AdminUser` por email (lowercase), verifica **bcryptjs**, exige `active` y
    `passwordHash` no nulo. Actualiza `lastLoginAt`.
  - Devuelve `{ id, name, email, role }`; callbacks `jwt`/`session` propagan `role` e `id`.
- **Escape hatch anti-lockout:** las credenciales del `.env` (`ADMIN_USER`/`ADMIN_PASSWORD`)
  **siguen funcionando siempre** con rol `admin` (se ingresan en el campo de email). Garantiza
  que el dueño nunca quede afuera aunque falle la tabla/DB. Documentado.
- Hash: **bcryptjs** (JS puro — el `bcrypt` nativo no compila en el hosting).

## Invitaciones

1. Admin → **Usuarios** → invitar (email + nombre + rol).
2. Se crea el `AdminUser` sin `passwordHash`, con `inviteTokenHash` (sha256 de un token
   aleatorio de 32 bytes) y `inviteExpiresAt` = +7 días.
3. Se envía email con **Resend** con el link `/admin/invite?token=<token>`.
4. **Sin dependencia dura del email:** la respuesta del API devuelve el link y **la UI lo
   muestra para copiar** (WhatsApp) — si `RESEND_API_KEY` falta o falla, el alta igual funciona.
5. `/admin/invite` (público, **noindex**): valida token + expiración, pide contraseña
   (mín. 8), setea `passwordHash`, limpia el token (**un solo uso**).
6. "Reenviar invitación" regenera token y expiración.

## Endpoints

- `GET /api/admin/users` — lista (admin).
- `POST /api/admin/users` — invita (admin). Body: `{ email, name, role }`. Devuelve `inviteUrl`.
- `PATCH /api/admin/users/[id]` — cambia `role` / `active` (admin).
- `DELETE /api/admin/users/[id]` — elimina (admin).
- `POST /api/admin/invite/accept` — público. Body: `{ token, password }`.

## UI

- Nuevo item **Usuarios** en el nav del admin (**solo visible para admin**).
- `components/admin/UsuariosView.tsx`: tabla (nombre, email, rol, estado: Activo /
  Invitación pendiente), acciones (cambiar rol, activar/desactivar, eliminar, reenviar
  invitación) y formulario de invitación que muestra el link copiable.
- `app/admin/login`: el campo "Usuario" pasa a **"Email"**.
- El nav se filtra por rol; las vistas no permitidas no se renderizan.

## Barandas de seguridad

- No podés **eliminarte ni desactivarte a vos mismo**.
- No se puede eliminar/desactivar/degradar **el último Admin activo**.
- Contraseña **mínimo 8** caracteres.
- Token de invitación: aleatorio 32 bytes, **hasheado en la DB**, expira 7 días, un solo uso.
- Email siempre normalizado a minúsculas; unicidad validada.
- `/admin/invite` con `robots: noindex`.

## Fuera de alcance

"Olvidé mi contraseña" (auto-servicio), 2FA, log de auditoría, rate limiting del login.

## Verificación

- `npm run build` + `tsc --noEmit` limpios.
- La tabla `AdminUser` se crea sola al arrancar (verificar en prod con `SHOW TABLES`).
- Probar los 3 roles: un **Locutor** recibe **403 del servidor** en `/api/admin/config`
  (no solo que no vea el botón).
- Invitar a Alexis → recibe/copia el link → crea su contraseña → entra con su email.
- Confirmar que el **escape hatch del `.env` sigue funcionando**.
