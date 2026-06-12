# La Mega 99.9 FM — Sitio web oficial

Aplicación web de producción para **La Mega 99.9 FM**, la radio líder de Imbabura, Ecuador. Emite desde Ibarra las 24 horas con pop, urbano y los hits que mueven la provincia.

- **Frontend:** Next.js 14 (App Router, TypeScript) + diseño dark-stage glassmorphism (Saira / Sora / Space Mono)
- **Tiempo real:** Server-Sent Events (`/api/radio/events`) + lectura automática de metadatos ICY del stream
- **Base de datos:** Prisma ORM — SQLite en dev, PostgreSQL en producción
- **Auth:** NextAuth.js (credenciales desde `.env`) para `/admin`
- **Email:** Resend (notificación al equipo comercial)
- **API:** endpoints `/api/radio/*` para la app de automatización Python
- **Alexa:** Skill "La Mega Ecuador" gestionada por FastCast4U (invocación: *"Alexa, abre radio mega ecuador"*)

## Páginas

| Ruta | Descripción |
|---|---|
| `/` | Landing: hero con player en vivo, ticker, Mega TV, programación, playlists, app, redes, mini-player sticky |
| `/pide` | Formulario público: pide tu canción · publicita en La Mega |
| `/pide/print` | Versión imprimible del formulario |
| `/admin` | Dashboard en tiempo real (login requerido) |
| `/admin/login` | Acceso al panel de administración |

## Instalación rápida

```bash
git clone https://github.com/xtmultimedia/lamega-web.git
cd lamega-web
npm install
cp .env.example .env          # edita los valores (ver tabla abajo)
npm run setup                 # prisma generate + db push
npm run dev                   # http://localhost:3000
```

Credenciales del dashboard (dev): `ADMIN_USER` / `ADMIN_PASSWORD` del `.env`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `STREAM_URL` | URL del stream (server-side, para leer metadatos ICY) | `https://usa3.fastcast4u.com/proxy/lamega?mp=/stream` |
| `NEXT_PUBLIC_STREAM_URL` | URL del stream (browser, para el player de audio) | igual que arriba |
| `RADIO_API_KEY` | Clave del header `X-Radio-API-Key` para la app Python | cadena aleatoria segura |
| `DATABASE_URL` | SQLite en dev, PostgreSQL en prod | `file:./dev.db` |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Credenciales del dashboard | `admin` / `…` |
| `EMAIL_FROM` | Remitente de emails | `noreply@lamegaecuador.com` |
| `EMAIL_TO_COMERCIAL` | Destinatario de leads comerciales | `comercial@lamegaecuador.com` |
| `RESEND_API_KEY` | API key de Resend (si está vacío, el email se omite) | `re_…` |
| `NEXTAUTH_SECRET` | Secreto de sesión — generalo con `openssl rand -hex 32` | cadena hex |
| `NEXTAUTH_URL` | URL pública del sitio | `https://lamegaecuador.com` |

## Scripts disponibles

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo (localhost:3000) |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción (tras build) |
| `npm run setup` | `prisma generate` + `prisma db push` |
| `npm run db:studio` | Prisma Studio para ver/editar datos |

## Conectar la app Python

```bash
pip install requests sseclient-py
export LAMEGA_BASE_URL=http://localhost:3000
export LAMEGA_API_KEY=<RADIO_API_KEY>
python3 radio_client_example.py
```

Documentación completa de endpoints, eventos SSE y ejemplos curl en [API.md](API.md).

## Alexa Skill

La skill está gestionada por FastCast4U y ya está activa en la tienda de Amazon.

| Campo | Valor |
|---|---|
| Nombre público | La Mega Ecuador |
| Invocación | `radio mega ecuador` |
| Comando de voz | *"Alexa, abre radio mega ecuador"* |
| Skill ID | `amzn1.ask.skill.58dbb174-5c01-4120-b01b-da5feeb1f87e` |
| Tienda | [amazon.com/dp/amzn1.ask.skill.58dbb174-5c01-4120-b01b-da5feeb1f87e](https://www.amazon.com/dp/amzn1.ask.skill.58dbb174-5c01-4120-b01b-da5feeb1f87e) |

El endpoint independiente `/api/alexa` (disponible en el repo) puede usarse para crear una skill custom alternativa si se decide migrar fuera de FastCast4U.

## Arquitectura

```
Browser ──SSE──► /api/radio/events ◄── Python app (push)
                       │
                  EventEmitter (lib/events.ts)
                       │
         ┌─────────────┴──────────────┐
     Prisma DB              ICY metadata poller
  (SQLite / PG)          /api/nowplaying (15s)
                        usa3.fastcast4u.com
```

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para el diagrama completo del sistema.

## Cambiar a PostgreSQL (producción)

1. En `prisma/schema.prisma` cambia `provider = "sqlite"` por `"postgresql"`.
2. Pon la URL en `DATABASE_URL`.
3. `npx prisma db push` (o `prisma migrate deploy`).

El schema no usa funciones exclusivas de SQLite — el cambio es directo.

## Despliegue

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para guías detalladas de:
- **FastComet** (hosting actual con cPanel + Node.js Passenger)
- **Railway / Render / Fly.io** (recomendado para SSE persistente)
- **Vercel** (con nota importante sobre SSE en serverless)

## Estructura del proyecto

```
app/
  api/
    radio/          API de automatización (X-Radio-API-Key) + SSE events
    nowplaying/     Lector automático de metadatos ICY del stream
    alexa/          Endpoint alternativo de Alexa AudioPlayer skill
    requests/       Formulario "pide tu canción"
    campaigns/      Formulario "publicita" (+ email Resend)
    admin/          Endpoints del dashboard (sesión NextAuth)
  admin/            Dashboard + login
  pide/             Formulario público
components/
  landing/          Secciones de la landing (Hero, Ticker, MegaApp, etc.)
  admin/            Componentes del dashboard
  radio/            RadioProvider (contexto global del player + SSE)
  ui.tsx            Primitivas de diseño (Icon, Section, Bloom, etc.)
  data.ts           Datos estáticos de fallback
lib/
  prisma.ts         Singleton del cliente Prisma
  events.ts         Bus SSE en memoria (globalThis)
  radio-auth.ts     Middleware de autenticación por API key
  auth.ts           Opciones de NextAuth
  station.ts        Seed de datos reales de la estación
prisma/
  schema.prisma     Modelos: SongRequest, AdCampaign, NowPlaying, etc.
public/assets/      Logo y assets estáticos
radio_client_example.py  Cliente Python 3 de ejemplo
```

## Licencia

Código propietario — © 2026 La Mega 99.9 FM / XTMultimedia. Todos los derechos reservados.
