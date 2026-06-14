# Changelog

Todos los cambios notables de este proyecto se documentan aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).  
Versiones siguiendo [Semantic Versioning](https://semver.org/).

---

## [1.4.0] — 2026-06-14

### Añadido
- **Fundación SEO (buscadores tradicionales + IA)**: metadata rica en `app/layout.tsx` (Open Graph, Twitter cards, canonical, `metadataBase`, keywords, robots), datos estructurados **JSON-LD** (`RadioStation` + `WebSite`), `robots.txt` que **permite explícitamente crawlers de IA** (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) y bloquea `/admin` y `/api`, `sitemap.xml`, web manifest, **imagen Open Graph de marca** (1200×630, generada en build → estática) y `public/llms.txt` para asistentes de IA.
- Posicionamiento de marca recalcado en descripción/JSON-LD/llms.txt/OG: una de las radios más escuchadas de Imbabura y por ecuatorianos en el mundo; primera emisora con su propio sistema creado con IA.

### Cambiado
- Metadata corregida: ahora dice **Ibarra, Imbabura** (antes "Guayaquil/Ecuador", dato viejo).
- `/admin`, `/admin/login` y `/pide/print` marcados `noindex`; `/pide` con título y descripción propios.
- `alt` descriptivos en los logos del Nav y el Footer.

### Técnico
- `lib/seo.ts`: fuente de verdad única (datos de la estación, redes, helpers de JSON-LD) consumida por metadata, robots, sitemap, manifest y la imagen OG.
- Rutas de metadata de Next: `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `app/opengraph-image.tsx` (runtime nodejs, gradiente lineal compatible con satori).

---

## [1.3.0] — 2026-06-14

### Añadido
- **Footer editable desde el panel**: nueva sección "Footer del sitio" en `/admin` → Configuración para editar las columnas y enlaces del pie de página. Estructura flexible (agregar/quitar columnas y enlaces). Cada enlace tiene etiqueta y una **URL opcional**: con URL es clickeable (externos abren en pestaña nueva), sin URL queda como texto. Las URLs se validan (solo `http(s)`, `mailto:`, `tel:` o rutas relativas) para evitar inyección de `javascript:`.

### Técnico
- `StationConfig.footer` (`TEXT`, JSON) — `null` usa el footer por defecto. Migración idempotente en el arranque (`lib/prisma.ts`), igual que `tvLive`.
- `lib/footer.ts`: tipos compartidos (`FooterColumn`/`FooterLink`), `DEFAULT_FOOTER`, `isSafeFooterUrl`, `parseFooter`.
- `/api/admin/config`: el `zod` schema acepta `footer` (máx. 8 columnas, 12 enlaces c/u); se incluye en `config_update` (SSE) y en el snapshot (`lib/radio-state.ts`). `RadioProvider`/`Footer` consumen `config.footer`.

---

## [1.2.0] — 2026-06-12

### Añadido
- **Mega TV en vivo**: la sección Mega TV ahora embebe el **Universal Embed Player de OneStream Live** (iframe responsive 16:9 dentro del marco de marca), reemplazando el reproductor decorativo/falso. Muestra el poster offline cuando no se transmite y se conecta automáticamente al entrar en vivo. Poster offline personalizado con la identidad de La Mega.
- **Auto mostrar/ocultar Mega TV**: nuevo endpoint `POST /api/radio/tv {"live": bool}` (header `X-Radio-API-Key`). La app de automatización lo llama con `true` al iniciar la transmisión en OneStream y `false` al detenerla. La web muestra la sección Mega TV (y el enlace "MEGA TV" del nav) solo mientras está en vivo. Estado en `StationState.tvLive`, evento SSE `tv_status`, incluido en el `snapshot`. Documentado en `API.md` y `radio_client_example.py` (`set_tv_live`).

### Cambiado
- **Base de datos → MySQL**: la app ahora usa **MySQL** en producción (FastComet), no SQLite/PostgreSQL.
- **Capa de datos → mysql2**: `lib/prisma.ts` dejó de usar el query engine de Prisma y pasó a ser un **shim respaldado por mysql2** con API compatible con Prisma (`findUnique`, `findMany`, `count`, `create`, `createMany`, `update`, `upsert`, `deleteMany`, `$transaction`). Los call sites no cambiaron. Motivo: el engine de Prisma (library y binary) no corre en el hosting compartido de FastComet (panic del runtime Tokio / fork-bomb del límite NPROC). `prisma/schema.prisma` queda como fuente de verdad de tablas/columnas.
- **Build/deploy → standalone en FastComet**: `next.config.mjs` con `output: "standalone"` + `serverComponentsExternalPackages: ["mysql2"]`; despliegue como bundle autocontenido vía Phusion Passenger (Application Manager). Ver [DEPLOYMENT.md](DEPLOYMENT.md).

### Técnico
- `next.config.mjs`: `serverComponentsExternalPackages: ["mysql2"]` para que el tracer del standalone copie mysql2 y sus deps.
- `lib/prisma.ts`: pool mysql2 chico (`connectionLimit: 3`, `maxIdle: 1`, `idleTimeout: 30s`); `TINYINT(1)`→boolean vía `typeCast`; ids uuid con `randomUUID()`; `localhost`→`127.0.0.1`; migración idempotente en arranque que agrega `StationState.tvLive`.
- `package.json`: el `build` ya no corre `prisma generate` (no se usa el cliente en runtime).
- `RadioProvider`/`MegaTV`/`Nav`: consumo de `tv_live` desde el snapshot + evento `tv_status`.

---

## [1.1.0] — 2026-06-11

### Añadido
- **Now playing automático**: `/api/nowplaying` lee metadatos ICY del stream cada 15 segundos directamente desde `usa3.fastcast4u.com`. Usa `https.get()` de Node.js para streaming real de chunks; resultados cacheados 15 s con invalidación por cambio de track.
- **Amazon Alexa**: botón "Disponible en Amazon Alexa" en la sección MegaApp con enlace a la skill activa (`amzn1.ask.skill.58dbb174-5c01-4120-b01b-da5feeb1f87e`). Instrucción de voz visible: *"Alexa, abre radio mega ecuador"*.
- **Endpoint `/api/alexa`**: implementación alternativa de Alexa AudioPlayer skill (independiente de FastCast4U), lista para conectar si se necesita migrar.
- **Ticker**: nuevo item `ALEXA, ABRE RADIO MEGA ECUADOR` en la rotación del ticker.

### Cambiado
- **Stream URL**: actualizado de `http://usa3.fastcast4u.com:2250/stream` (HTTP, sin TLS) a `https://usa3.fastcast4u.com/proxy/lamega?mp=/stream` (HTTPS proxy de FastCast4U) — elimina el bloqueo de *mixed content* en HTTPS.
- **Datos de la estación**: ciudad `Ibarra`, cobertura `Imbabura`, slogan `Solo La Mega`.
- **Programación real**: 20 programas reales (9 Lunes-Viernes, 5 Sábado, 6 Domingo) según cuestionario oficial. Programas destacados: Mega Click (Paulina Puga), Megapolis (Joselyn Hernández & Marcos Cruz), Los de las 6 (Daniel Andrade & Verónica Villegas).
- **12 locutores reales** con sus nombres, alias y programas.
- **4 playlists de Spotify reales**: Pop Hits, Urbano, House & Dance, Alternativo con URLs reales.
- **Redes sociales**: Instagram, TikTok, Facebook, YouTube y Spotify con URLs y handles reales de `@lamega99.9ecuador`.
- **Contacto**: teléfono/WhatsApp real `096 13 14 999`, email `megacontacto@yahoo.com`, ciudad `Ibarra, Imbabura`.
- **Footer**: sección Programación con los 4 programas principales; sección Contacto con datos reales.
- **Hero**: badge `Imbabura` (antes `Ecuador`), descripción actualizada a radio líder de Imbabura.
- **Apps**: links reales a Google Play (`com.lamega999.radio`) y App Store (`id1639162123`).
- **Ticker**: número de teléfono corregido de `099 999 99 99` a `096 13 14 999`.
- **`RadioProvider`**: polling de `/api/nowplaying` cada 15 s como fallback al SSE de la app Python.

### Técnico
- `parseMeta()` en `/api/nowplaying`: elimina prefijo `Now On Air:` de FastCast4U; filtra mensajes de error del stream (`sorry`, `service not available`, etc.).
- Cache de módulo (15 s) en `/api/nowplaying` con emisión SSE `now_playing_update` solo cuando cambia el track.
- `lib/station.ts` `seedStationIfEmpty()`: seed con datos reales de la estación al arrancar.

---

## [1.0.0] — 2026-06-10

### Añadido
- **Sitio web completo** portado desde diseño Claude Design (`design-reference/`).
- Landing con Hero (player de audio real), Ticker animado, Mega TV, Programación (cards + grid semanal + acordeón móvil), Playlists, MegaApp, Redes Sociales, Footer, MiniPlayer sticky.
- Formulario `/pide`: dos tabs — "Pide tu canción" y "Publicita en La Mega".
- Panel `/admin` con dashboard en tiempo real: estadísticas de oyentes, cola de solicitudes, aprobación/rechazo, modo emergencia.
- **API de automatización** para app Python:
  - `POST /api/radio/now-playing` — actualiza el track en curso
  - `POST /api/radio/program` — actualiza el programa
  - `GET /api/radio/queue` — lee la cola de solicitudes aprobadas
  - `POST /api/radio/queue/dequeue` — marca una solicitud como puesta al aire
  - `GET /api/radio/stats` — estadísticas en vivo
  - `POST /api/radio/stats/listeners` — actualiza el contador de oyentes
  - `POST /api/radio/emergency` — activa/desactiva modo emergencia
  - `GET /api/radio/events` — stream SSE para el sitio, dashboard y app Python
- Prisma ORM con modelos: `SongRequest`, `AdCampaign`, `NowPlaying`, `CurrentProgram`, `RadioStats`, `StationState`, `StationConfig`, `Show`, `Host`, `Playlist`.
- NextAuth.js con proveedor de credenciales (`ADMIN_USER` / `ADMIN_PASSWORD`).
- Integración Resend para email de leads comerciales.
- `radio_client_example.py` — cliente Python 3 completo con `requests` y `sseclient-py`.
- `API.md` — documentación completa de todos los endpoints.
- `.env.example` con todas las variables necesarias.

---

## Tipos de cambio

| Tipo | Descripción |
|---|---|
| `Añadido` | Nuevas funcionalidades |
| `Cambiado` | Cambios en funcionalidades existentes |
| `Obsoleto` | Funcionalidades que se eliminarán en la próxima versión |
| `Eliminado` | Funcionalidades eliminadas |
| `Corregido` | Corrección de bugs |
| `Seguridad` | Parches de seguridad |
