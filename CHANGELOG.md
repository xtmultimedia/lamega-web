# Changelog

Todos los cambios notables de este proyecto se documentan aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).  
Versiones siguiendo [Semantic Versioning](https://semver.org/).

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
