# La Mega 99.9 FM — Sitio web + API de automatización

Aplicación web de producción para **La Mega 99.9 FM** (Guayaquil, Ecuador),
implementada desde el diseño de Claude Design (`design-reference/`).

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS · diseño dark-stage
  glassmorphism con Saira / Sora / Space Mono
- **Tiempo real:** Server-Sent Events (`/api/radio/events`)
- **Base de datos:** Prisma ORM — SQLite en dev, PostgreSQL en producción
- **Auth:** NextAuth.js (credenciales desde `.env`) para `/admin`
- **Email:** Resend (notificación al equipo comercial)
- **API:** endpoints `/api/radio/*` para la app de automatización en Python
  (ver [API.md](API.md) y [radio_client_example.py](radio_client_example.py))

## Páginas

| Ruta | Descripción |
|---|---|
| `/` | Landing: hero con player del stream en vivo, ticker, Mega TV, programación, playlists, app, redes, mini-player sticky |
| `/pide` | Formulario público: pide tu canción · publicita en La Mega |
| `/pide/print` | Versión imprimible del formulario (auto-`print()`) |
| `/admin` | Dashboard en tiempo real (login requerido) |
| `/admin/login` | Acceso al panel |

## Instalación

```bash
npm install
cp .env.example .env        # edita los valores (ver abajo)
# dev usa SQLite: en .env pon  DATABASE_URL=file:./dev.db
npm run setup               # prisma generate + db push
npm run dev                 # http://localhost:3000
```

Credenciales del dashboard en dev: las de `ADMIN_USER` / `ADMIN_PASSWORD` del `.env`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `STREAM_URL` / `NEXT_PUBLIC_STREAM_URL` | URL MP3 del stream (`http://usa3.fastcast4u.com:2250/stream`) |
| `RADIO_API_KEY` | Clave del header `X-Radio-API-Key` para la app Python |
| `DATABASE_URL` | `file:./dev.db` (dev) o `postgresql://…` (prod) |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Credenciales del dashboard |
| `EMAIL_FROM` / `EMAIL_TO_COMERCIAL` | Remitente y destinatario de leads comerciales |
| `RESEND_API_KEY` | API key de Resend (si está vacío, el email se omite con un warn) |
| `NEXTAUTH_SECRET` | Secreto de sesión (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | URL pública del sitio |

> Nota: el stream es `http://` (no TLS). Si el sitio se sirve por HTTPS, el
> navegador puede bloquearlo como *mixed content*; pide a tu proveedor de
> streaming la URL `https://` equivalente y ponla en `NEXT_PUBLIC_STREAM_URL`.

## Conectar la app Python

```bash
pip install requests sseclient-py
export LAMEGA_BASE_URL=http://localhost:3000
export LAMEGA_API_KEY=<RADIO_API_KEY>
python3 radio_client_example.py
```

Documentación completa de endpoints y eventos SSE en [API.md](API.md).

## Cambiar a PostgreSQL (producción)

1. En `prisma/schema.prisma` cambia `provider = "sqlite"` por `"postgresql"`.
2. Pon la URL de Postgres en `DATABASE_URL`.
3. `npx prisma db push` (o `prisma migrate deploy` si usas migraciones).

El schema no usa funciones exclusivas de SQLite, así que el cambio es directo.

## Despliegue

### Vercel

1. Importa el repo en Vercel y define todas las variables de entorno
   (usa PostgreSQL — p. ej. Vercel Postgres o Neon — en `DATABASE_URL`).
2. El `build` ya ejecuta `prisma generate`.
3. Ejecuta `npx prisma db push` contra la base de producción una vez.

**Limitación importante (SSE en serverless):** `/api/radio/events` mantiene
conexiones abiertas y usa un bus de eventos *en memoria del proceso*. En
Vercel serverless cada función corre en instancias separadas, por lo que un
POST de la app Python puede no llegar a los navegadores conectados a otra
instancia, y las conexiones SSE se cortan al límite de duración de la función.

**Recomendación para el tiempo real:** despliega en un host Node persistente
(Railway, Render, Fly.io o un VPS con `npm run build && npm run start`).
Ahí el SSE funciona tal cual. El cliente del navegador se reconecta solo y
rehidrata el estado con el evento `snapshot`, así que cortes breves no
rompen la experiencia.

## Estructura

```
app/                  páginas + API routes (App Router)
  api/radio/*         API de automatización (X-Radio-API-Key) + SSE
  api/requests        formulario "pide tu canción"
  api/campaigns       formulario "publicita" (+ email Resend)
  api/admin/*         endpoints del dashboard (sesión NextAuth)
components/           UI portada del diseño (landing, form, admin, radio)
lib/                  prisma, bus SSE, auth, helpers de estado
prisma/schema.prisma  SongRequest · AdCampaign · NowPlaying · CurrentProgram · RadioStats · StationState
design-reference/     diseño original de Claude Design (HTML/JSX)
radio_client_example.py  cliente Python 3 de ejemplo
```

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run setup` | `prisma generate` + `prisma db push` |
| `npm run db:studio` | Prisma Studio (ver/editar datos) |
