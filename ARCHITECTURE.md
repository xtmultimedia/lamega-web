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
│  /        Landing pública                                       │
│  /pide    Formulario (pide canción + publicidad)                │
│  /admin   Dashboard (protegido por NextAuth)                    │
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
│  │  /api/nowplaying         GET — ICY metadata poller       │   │
│  │  /api/requests           POST — nueva solicitud pública  │   │
│  │  /api/campaigns          POST — lead publicitario        │   │
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
│  EventEmitter    │   │  Prisma ORM (SQLite dev / PostgreSQL prod)│
│  globalThis bus  │   │                                          │
│                  │   │  SongRequest    AdCampaign               │
│  emit()          │   │  NowPlaying     CurrentProgram           │
│  subscribe()     │   │  RadioStats     StationState             │
│                  │   │  StationConfig  Show  Host  Playlist     │
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
  │  Prisma upsert   │
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

**Limitación:** el bus es en memoria del proceso. En producción con un único proceso Node.js (Railway, FastComet, VPS) funciona perfectamente. En entornos serverless multi-instancia (Vercel) los eventos pueden no propagarse entre instancias. Para escalar horizontalmente, reemplaza el bus con Redis Pub/Sub o un servicio como Ably/Pusher.

## Autenticación

```
/admin/* ──► middleware.ts ──► ¿Sesión NextAuth válida?
                                    │           │
                                   Sí           No
                                    │           │
                              Acceso OK    Redirect /admin/login
```

La sesión se guarda en una cookie `httpOnly` firmada con `NEXTAUTH_SECRET`. Las credenciales se comparan contra `ADMIN_USER` / `ADMIN_PASSWORD` del entorno (sin usuarios en DB — intencional para simplicidad).

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

## Escalabilidad futura

Para soportar mayor carga o equipos más grandes, los cambios recomendados son:

1. **Redis Pub/Sub** en lugar del bus en memoria → permite múltiples instancias Node.js
2. **NextAuth con base de datos** → soporta múltiples usuarios admin con roles
3. **Migraciones Prisma** (`prisma migrate dev`) en lugar de `db push` → historial de schema en git
4. **CDN para assets** (Cloudflare, CloudFront) → imágenes de locutores, logos
5. **Monitoreo** (Sentry para errores, Grafana/Datadog para métricas del stream)
6. **Rate limiting** en `/api/requests` y `/api/campaigns` → evitar spam de formularios
