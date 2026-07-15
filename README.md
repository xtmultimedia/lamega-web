# La Mega 99.9 FM — Sitio web oficial

**Versión: v1.1** · en vivo en [lamegaecuador.com](https://lamegaecuador.com)
(la versión mostrada en la web y el panel sale de [`lib/version.ts`](lib/version.ts))

Aplicación web de producción para **La Mega 99.9 FM**, la radio líder de Imbabura, Ecuador. Emite desde Ibarra las 24 horas con pop, urbano y los hits que mueven la provincia.

- **Frontend:** Next.js 14 (App Router, TypeScript) + diseño dark-stage glassmorphism (Saira / Sora / Space Mono)
- **Tiempo real:** Server-Sent Events (`/api/radio/events`) + lectura automática de metadatos ICY del stream
- **Base de datos:** MySQL, accedida vía un cliente liviano **mysql2** (`lib/prisma.ts` — shim con API compatible con Prisma; ver nota abajo)
- **Mega TV:** player de video en vivo embebido de **OneStream Live** (Universal Embed Player), con auto mostrar/ocultar según la señal
- **Footer editable** desde `/admin` → Configuración (columnas y enlaces con URL opcional)
- **SEO (buscadores + IA):** metadata + Open Graph, JSON-LD `RadioStation`, `robots.txt` que permite crawlers de IA, `sitemap.xml`, web manifest, imagen OG de marca y `llms.txt` (fuente única en `lib/seo.ts`)
- **Auth:** NextAuth.js con **cuentas individuales (email + contraseña, bcrypt) y roles** — Admin / Editor / Locutor — e invitaciones por email. Las credenciales del `.env` siguen valiendo como acceso de emergencia
- **Email:** Resend (notificación al equipo comercial)
- **API:** endpoints `/api/radio/*` para la app de automatización Python
- **Alexa:** Skill "La Mega Ecuador" gestionada por FastCast4U (invocación: *"Alexa, abre radio mega ecuador"*)
- **Auto-deploy (CI/CD):** cada `push` a `main` despliega a FastComet vía GitHub Actions

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
npm run dev                   # http://localhost:3000
```

> **Base de datos en desarrollo:** la app habla con MySQL vía `mysql2`, así que para que funcionen las
> rutas que tocan la DB necesitas una instancia MySQL local y `DATABASE_URL=mysql://user:pass@127.0.0.1:3306/db`.
> El frontend (landing, `/pide`) renderiza sin DB. La tabla `StationState` agrega su columna `tvLive`
> automáticamente al arrancar (migración idempotente en `lib/prisma.ts`); el resto de tablas se crean
> según `prisma/schema.prisma` (puedes generarlas con `npx prisma db push` apuntando a tu MySQL).

Credenciales del dashboard (dev): `ADMIN_USER` / `ADMIN_PASSWORD` del `.env`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `STREAM_URL` | URL del stream (server-side, para leer metadatos ICY) | `https://usa3.fastcast4u.com/proxy/lamega?mp=/stream` |
| `NEXT_PUBLIC_STREAM_URL` | URL del stream (browser, para el player de audio) | igual que arriba |
| `RADIO_API_KEY` | Clave del header `X-Radio-API-Key` para la app Python | cadena aleatoria segura |
| `DATABASE_URL` | Conexión MySQL (dev y prod) | `mysql://user:pass@127.0.0.1:3306/db` |
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
| `npm run build` | Build de producción (`next build`, salida `standalone`) |
| `npm start` | Servidor de producción (tras build) |
| `npm run setup` | `prisma db push` — crea las tablas en tu MySQL desde el schema |
| `npm run db:studio` | Prisma Studio para ver/editar datos (solo lectura del schema) |

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
   MySQL (mysql2)          ICY metadata poller
  lib/prisma.ts shim     /api/nowplaying (15s)
                        usa3.fastcast4u.com
```

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para el diagrama completo del sistema.

## Capa de datos (mysql2, no Prisma en runtime)

`lib/prisma.ts` **no usa el cliente de Prisma en runtime**. Es un shim respaldado por
**mysql2** que expone una API compatible con Prisma (`findUnique`, `findMany`, `count`,
`create`, `createMany`, `update`, `upsert`, `deleteMany`, `$transaction`), así que los
call sites (`prisma.modelo.metodo(...)`) no cambian.

**¿Por qué?** El query engine de Prisma (tanto `library` como `binary`) no corre en el
hosting compartido de FastComet: el engine `library` hace panic del runtime Tokio
("timer has gone away") y el `binary` satura el límite de procesos (NPROC) de la cuenta.
mysql2 es un pool de conexiones puro — sin proceso engine aparte, pocos threads — y corre
bien dentro de los límites del plan. `prisma/schema.prisma` se conserva solo como fuente de
verdad de tablas/columnas (mapeo directo: nombre de modelo = tabla, campo = columna).

## Despliegue

Hosting actual: **FastComet** (cPanel + Phusion Passenger / LiteSpeed, Node.js 22, MySQL).

**Auto-deploy (recomendado):** cada `push` a `main` dispara `.github/workflows/deploy.yml`,
que compila en GitHub Actions, sincroniza el `standalone` por **rsync/SSH** a FastComet,
reinicia Passenger y verifica. No hay que compilar en el server (no puede) ni subir a mano.

**Manual (fallback):** build local (`npm run build`) → subir el `standalone` por cPanel File
Manager → extraer y tocar `tmp/restart.txt`.

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para ambos procedimientos en detalle, los secrets de CI,
y notas para otros hosts Node persistentes (Railway/Render/Fly) si algún día se migra.

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
  robots.ts         /robots.txt (permite crawlers de IA, bloquea /admin /api)
  sitemap.ts        /sitemap.xml
  manifest.ts       /manifest.webmanifest
  opengraph-image.tsx  Imagen OG de marca (1200×630, generada en build)
components/
  landing/          Secciones de la landing (Hero, Ticker, MegaApp, etc.)
  admin/            Componentes del dashboard
  radio/            RadioProvider (contexto global del player + SSE)
  ui.tsx            Primitivas de diseño (Icon, Section, Bloom, etc.)
  data.ts           Datos estáticos de fallback
lib/
  prisma.ts         Capa de datos mysql2 (shim con API compatible con Prisma)
  events.ts         Bus SSE en memoria (globalThis)
  radio-auth.ts     Middleware de autenticación por API key
  auth.ts           Opciones de NextAuth
  station.ts        Seed de datos reales de la estación
  radio-state.ts    Snapshot de estado en vivo (now-playing, programa, stats, tv_live)
  seo.ts            Fuente única de SEO (datos + JSON-LD)
  footer.ts         Modelo del footer editable (tipos, default, parser, validación URL)
  version.ts        APP_VERSION (versión mostrada en web + admin)
prisma/
  schema.prisma     Fuente de verdad de tablas/columnas (no se usa el engine en runtime)
public/
  assets/           Logo y assets estáticos
  llms.txt          Resumen de la estación para asistentes de IA
.github/workflows/
  deploy.yml        Auto-deploy a FastComet (build → rsync/SSH → restart)
radio_client_example.py  Cliente Python 3 de ejemplo
```

## Licencia

Código propietario — © 2026 La Mega 99.9 FM / XTMultimedia. Todos los derechos reservados.
