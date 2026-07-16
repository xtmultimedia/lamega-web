# Arquitectura del sistema — La Mega 99.9 FM

## Visión general

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                 │
│                                                                 │
│   Navegador web          App Python          Echo / Alexa       │
│  (oyentes / admin)      (automatización)    (radio mega ec.)    │
└────────┬────────────────────┬───────────────────────┬───────────┘
         │  HTTP/SSE          │  REST + SSE            │  HTTPS
         ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 14 App Router                        │
│                                                                 │
│  /             Landing pública (+ franja de El Megáfono)         │
│  /megafono     Blog: índice paginado           (force-dynamic)  │
│  /megafono/*   Nota individual por slug        (force-dynamic)  │
│  /staff        El equipo de locutores          (force-dynamic)  │
│  /pide         Formulario (pide canción + publicidad)           │
│  /admin        Dashboard (protegido por NextAuth)               │
│  /admin/invite Crear/restablecer contraseña (público, noindex)  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes                            │   │
│  │                                                          │   │
│  │  /api/radio/events      SSE público (snapshot + updates) │   │
│  │  /api/radio/now-playing  POST — actualiza track          │   │
│  │  /api/radio/program      POST — actualiza programa       │   │
│  │  /api/radio/queue        GET / POST (dequeue)            │   │
│  │  /api/radio/stats        GET / POST (listeners)          │   │
│  │  /api/radio/emergency    POST — modo emergencia          │   │
│  │  /api/radio/tv           POST — Mega TV al aire          │   │
│  │  /api/nowplaying         GET — ICY metadata poller       │   │
│  │  /api/station            GET — programación + locutores  │   │
│  │  /api/posts              GET — notas publicadas          │   │
│  │  /api/requests           POST — nueva solicitud pública  │   │
│  │  /api/campaigns          POST — lead publicitario        │   │
│  │  /api/admin/posts[/id]   CRUD del blog (admin/editor)    │   │
│  │  /api/admin/me           GET/PUT — perfil propio         │   │
│  │  /api/admin/users[/id]   Alta / rol / reset (solo admin) │   │
│  │  /api/admin/requests     PATCH — aprobar / rechazar      │   │
│  │  /api/admin/config       GET / PATCH — configuración     │   │
│  │  /api/alexa              POST — Alexa AudioPlayer skill  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────┬──────────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────────────┐
│   lib/events.ts  │   │              lib/prisma.ts               │
│                  │   │                                          │
│  EventEmitter    │   │  Capa de datos mysql2 (shim Prisma-like) │
│  globalThis bus  │   │                                          │
│                  │   │  SongRequest    AdCampaign               │
│  emit()          │   │  NowPlaying     CurrentProgram           │
│  subscribe()     │   │  RadioStats     StationState             │
│                  │   │  StationConfig  Show  Host  Playlist     │
│                  │   │  MediaItem      AdminUser       Post     │
└──────────────────┘   └──────────────────────────────────────────┘
```

## Flujo de now playing

```
                    Cada 15 segundos
                         │
         ┌───────────────▼───────────────┐
         │     /api/nowplaying (GET)      │
         │                               │
         │  1. ¿Caché válido (< 15s)?    │
         │     Sí → devuelve caché       │
         │     No → leer stream ICY      │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │  https.get(STREAM_URL)        │
         │  header: Icy-MetaData: 1      │
         │                               │
         │  Lee metaint + bloque meta    │
         │  (~20 KB de audio + metadata) │
         │  Timeout: 10 s                │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │  parseMeta()                  │
         │  - Extrae StreamTitle         │
         │  - Elimina prefijo "Now On    │
         │    Air:" de FastCast4U        │
         │  - Filtra errores del stream  │
         │  - Divide en "Artista - Tema" │
         └───────────────┬───────────────┘
                         │
              ¿Cambió el track?
               /        \
             Sí          No
              │           │
  ┌───────────▼──────┐   └──► devuelve caché
  │  mysql2 upsert   │
  │  NowPlaying id=1 │
  └───────────┬──────┘
              │
  ┌───────────▼──────┐
  │  emit()          │
  │  now_playing_    │
  │  update → SSE    │──► Todos los navegadores conectados
  └──────────────────┘    (MiniPlayer, Hero card, Ticker)
```

## Flujo de una solicitud de canción

```
Oyente en /pide
     │
     │ POST /api/requests
     ▼
SongRequest { status: "pending" }
     │
     │ emit("new_request")
     ▼
Dashboard admin recibe SSE
     │
     │ PATCH /api/admin/requests { action: "approve" }
     ▼
SongRequest { status: "approved", approvedAt: now }
     │
     │ emit("queue_update")
     ▼
App Python: GET /api/radio/queue
     │
     │ (locutora pone la canción al aire)
     │
     │ POST /api/radio/queue/dequeue { song_request_id }
     ▼
SongRequest { status: "on_air", airedAt: now }
     │
     │ emit("queue_update") — cola actualizada en dashboard
     ▼
POST /api/radio/now-playing { title, artist, duration }
     │
     │ emit("now_playing_update") → MiniPlayer + Hero + Ticker
     ▼
Oyentes ven el nuevo track en tiempo real
```

## Bus de eventos SSE (lib/events.ts)

El bus es un `Set` de callbacks guardado en `globalThis` para sobrevivir hot-reloads de Next.js en desarrollo.

```typescript
// Emitir desde cualquier API route
emit("now_playing_update", { title, artist, ... })

// Suscribirse (en /api/radio/events)
const unsub = subscribe((event, data) => {
  controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
})
```

**Limitación:** el bus vive **en memoria de cada proceso**. Funciona mientras haya **una sola**
instancia Node.js. Con varias, un evento emitido en una instancia no llega a los clientes
conectados a las otras. Para escalar horizontalmente hay que reemplazarlo por Redis Pub/Sub o un
servicio tipo Ably/Pusher.

### ⚠️ Vida máxima del stream (no la quites)

`/api/radio/events` **cierra cada conexión a los ~10 min** (más hasta 90 s de azar) y el cliente
reconecta solo, rehidratándose con el `snapshot` que la ruta manda al conectar. No es una
prolijidad: **es lo que mantiene el sitio en pie.**

El stream SSE no termina nunca por sí mismo, y el heartbeat de 25 s impide activamente que
expire. Al desplegar (`touch tmp/restart.txt`), Passenger levanta una instancia nueva y **apaga
la vieja con elegancia: esperando a que terminen las peticiones en curso**. Una petición SSE no
termina jamás → la instancia vieja quedaba viva **para siempre**, sostenida por su propio
heartbeat, ocupando ~14 procesos del límite de **NPROC=80** de la cuenta. Cuatro o cinco
despliegues y **se caía el sitio entero** (pasó tres veces el 2026-07-16; había procesos de más
de 22 horas).

El azar del cierre importa: sin él, todos los clientes de una misma oleada reconectarían en el
mismo instante.

Esto además acota el problema del párrafo anterior: un oyente atado a una instancia superada
**nunca volvía a recibir el "ahora suena"** — se le congelaba el ticker hasta recargar.

## Autenticación

```
/admin/* ──► middleware.ts ──► ¿Sesión NextAuth válida?
                                    │           │
                                   Sí           No
                                    │           │
                              Acceso OK    Redirect /admin/login
```

La sesión se guarda en una cookie `httpOnly` firmada con `NEXTAUTH_SECRET`.

**Cuentas y roles (desde v1.1):** los usuarios viven en la tabla `AdminUser` (email único +
`passwordHash` bcrypt + rol). Se entra con **email + contraseña**. Roles:

| Rol | Alcance |
|---|---|
| `admin` | Todo, incluida Configuración y la gestión de usuarios |
| `editor` | Contenido (Programación, Locutores, Playlists, Galería, Publicidad) + Solicitudes |
| `locutor` | Dashboard + Solicitudes |

- `lib/roles.ts` — **puro** (constantes, `SECTION_ROLES`, `canAccessSection`); lo importa el cliente.
- `lib/auth-guard.ts` — **server-only**; `requireRole()` devuelve 401/403 y lo usan todas las
  rutas `/api/admin/*`. La UI filtra el nav, pero **la autorización real es del servidor**.
- **Escape hatch:** `ADMIN_USER`/`ADMIN_PASSWORD` del `.env` siguen siendo válidos con rol
  `admin` (id `env-admin`). Evita quedar bloqueado si la DB o la tabla fallan.
- **Invitaciones:** el Admin invita por email; se guarda `inviteTokenHash` (sha256) con
  vencimiento a 7 días y un solo uso. El invitado crea su contraseña en `/admin/invite`
  (público, `noindex`). El email va por Resend, pero el link también se muestra en el panel.

## EL MEGÁFONO — el blog (desde v1.3)

```
Panel (admin/editor)                      Público
      │                                      │
  MegafonoView                          /megafono          (índice paginado)
      │  PostEditor (TipTap)            /megafono/<slug>   (la nota)
      │                                 /  (franja: 3 últimas → /api/posts)
      ▼                                      ▲
POST/PATCH /api/admin/posts[/id]             │
      │                                      │
      │  ⚠️ lib/sanitize.ts  ← SANITIZA ACÁ, al ESCRIBIR
      ▼                                      │
   Post (MySQL) ──── solo HTML limpio ───────┘
                     status: draft | published
```

**Por qué se sanitiza al escribir y no al renderizar:** así la base **solo contiene marcado
limpio**. Si se sanitizara al leer, cualquier vista futura que se olvide de llamarlo abriría un
agujero de XSS, y cada render pagaría el costo. Detalle de la lista blanca en
[SECURITY.md](SECURITY.md) y en `docs/superpowers/specs/2026-07-16-megafono-blog-design.md`.

**A diferencia de Programación/Playlists, `Post` usa CRUD real por fila**: la tabla crece sin
techo y cada fila **es una URL pública** — borrar y recrear rompería enlaces ya compartidos e
indexados. Lo mismo vale para `Host`, cuyos ids referencian `AdminUser.hostId` y `Show.hostIds`.

`publishedAt` se estampa **solo en la primera publicación**: el índice ordena por esa fecha, así
que refrescarla haría que corregir una errata saltara la nota al tope.

## Autenticación de la API (radio-auth.ts)

```
Request → requireRadioKey(req) → timingSafeEqual(key, RADIO_API_KEY)
                                        │              │
                                      Match          No match
                                        │              │
                                   Continúa        401 Unauthorized
```

El `timingSafeEqual` de `crypto` evita ataques de timing en la comparación.

## Estructura de componentes React

```
RadioProvider (contexto global)
├── Estado: nowPlaying, program, stats, emergency, config
├── Audio: HTMLAudioElement controlado (play/pause/volume)
├── SSE: EventSource → /api/radio/events (auto-reconnect 4s)
└── Poll: /api/nowplaying cada 15s (fallback al SSE)

Layout (app/layout.tsx)
├── RadioProvider
│   ├── Nav
│   ├── {children}  (page content)
│   ├── MiniPlayer  (sticky bottom)
│   └── EmergencyBanner (cuando emergency.active)
```

## Dependencias externas

| Servicio | Uso | Configuración |
|---|---|---|
| FastCast4U | Stream de audio + Alexa skill | `STREAM_URL` en `.env` |
| Resend | Email de leads comerciales | `RESEND_API_KEY` |
| Google Play | App Android de La Mega | Link fijo en MegaApp.tsx |
| App Store | App iOS de La Mega | Link fijo en MegaApp.tsx |
| Amazon Alexa | Skill "La Mega Ecuador" | Gestionada por FastCast4U |
| Spotify | Links de playlists | Links fijos en data.ts |
| OneStream Live | Player de video Mega TV | Universal Embed Player en MegaTV.tsx |
| GitHub Actions | Auto-deploy a FastComet (build → rsync/SSH → restart) | `.github/workflows/deploy.yml` + secrets |

## SEO (buscadores tradicionales + IA)

Fuente única en `lib/seo.ts` (datos de la estación + helpers JSON-LD), consumida por la
metadata de `app/layout.tsx`, los datos estructurados `RadioStation` + `WebSite`, y las rutas
de metadata de Next: `app/robots.ts` (permite crawlers de IA: GPTBot, ClaudeBot, PerplexityBot,
Google-Extended…), `app/sitemap.ts`, `app/manifest.ts` y `app/opengraph-image.tsx` (imagen OG de
marca generada en build). `public/llms.txt` resume la estación para asistentes de IA.

## Escalabilidad futura

Para soportar mayor carga o equipos más grandes, los cambios recomendados son:

1. **Redis Pub/Sub** en lugar del bus en memoria → recién ahí se pueden correr varias instancias
   Node.js sin que se pierdan eventos entre ellas (ver la limitación arriba). Es el requisito
   previo a cualquier escalado horizontal.
2. **Migraciones SQL versionadas** (carpeta `migrations/` + un runner) en lugar de la migración
   idempotente en arranque → historial de schema en git. (Hoy el runtime es mysql2, no Prisma.)
3. **Tests automatizados.** Hoy no hay runner. El candidato más urgente es `lib/sanitize.ts`
   (frontera de seguridad, hoy verificada a mano). Blocker: importa `server-only`, así que hace
   falta un alias a un stub en la config del runner.
4. **CDN para assets** (Cloudflare, CloudFront) → imágenes de locutores, portadas de las notas
5. **Monitoreo** (Sentry para errores, Grafana/Datadog para métricas del stream)
6. **Rate limiting** en `/api/requests` y `/api/campaigns` → evitar spam de formularios
7. **Salir del hosting compartido** (Railway/Render/Fly o un VPS) → sin el techo de NPROC=80, que
   es la restricción que más ha condicionado este diseño.

> **Hecho desde que se escribió esta lista:** cuentas admin en base de datos con roles e
> invitaciones (v1.1) y perfiles de locutor (v1.2).
