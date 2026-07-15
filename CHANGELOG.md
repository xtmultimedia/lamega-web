# Changelog

Todos los cambios notables de este proyecto se documentan aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).  
Versiones siguiendo [Semantic Versioning](https://semver.org/).

La versión mostrada en la web y el panel sale de [`lib/version.ts`](lib/version.ts) (`APP_VERSION`).

---

## [1.1.0] — 2026-07-15

### Añadido
- **Multi-admin con roles e invitaciones.** El panel deja de tener una única credencial
  compartida: ahora hay **cuentas individuales con email y contraseña** (hash **bcryptjs**) y
  tres roles:
  - **Admin** — acceso total, incluida Configuración y la gestión de usuarios.
  - **Editor** — contenido (Programación, Locutores, Playlists, Galería, Publicidad) y
    Solicitudes; sin Configuración ni usuarios.
  - **Locutor** — solo Dashboard y Solicitudes (poner temas al aire).
- Nueva sección **Usuarios** en el panel (solo Admin): invitar por email, cambiar rol,
  activar/desactivar, eliminar y reenviar invitación.
- **Invitación por email** (Resend) con link para que la persona cree su contraseña
  (`/admin/invite`, token hasheado, vence en 7 días, un solo uso). **El panel siempre muestra el
  link copiable**, así el alta no depende de que el email esté configurado.
- El login ahora pide **email** en lugar de usuario.

### Seguridad
- Los permisos se aplican **en el servidor** (`requireRole` → **403**), no solo ocultando el nav.
- **Escape hatch anti-lockout:** las credenciales del `.env` (`ADMIN_USER`/`ADMIN_PASSWORD`)
  siguen funcionando siempre con rol Admin, incluso si la DB no responde.
- Barandas: no podés cambiar tu propio rol, desactivarte ni eliminarte; siempre debe quedar al
  menos un Admin activo; contraseña mínima de 8 caracteres; `/admin/invite` va `noindex`.

### Técnico
- Tabla `AdminUser` creada por **migración idempotente** (`CREATE TABLE IF NOT EXISTS`) al
  arrancar, igual que `tvLive` y `footer`; agregada al mapa `MODELS` del shim mysql2.
- `lib/roles.ts` es **puro** (constantes/permisos, apto para cliente) y `lib/auth-guard.ts`
  concentra los guards de servidor (con `server-only`), para no arrastrar next-auth/bcrypt/mysql2
  al bundle del navegador.

---

## [1.0.0] — 2026-06-14 — 🚀 Lanzamiento oficial

Primera versión pública de la web de **La Mega 99.9 FM** (Ibarra, Imbabura), en vivo en
[lamegaecuador.com](https://lamegaecuador.com). Reemplaza el sitio WordPress anterior.

### Sitio y experiencia
- **Landing completa** (diseño dark glassmorphism): Hero con reproductor de audio real del
  stream 99.9 FM, Ticker en vivo, **Mega TV**, Programación (cards + grilla semanal + acordeón
  móvil), Playlists de Spotify, MegaApp, Redes, Footer y MiniPlayer sticky.
- **Now playing automático**: `/api/nowplaying` lee metadatos ICY del stream cada 15 s.
- **Mega TV en vivo**: embebe el Universal Embed Player de **OneStream Live** (poster offline,
  se conecta solo al entrar en vivo) y la sección **se muestra/oculta automáticamente** según la
  señal (la app de automatización empuja `POST /api/radio/tv {live}`; estado `StationState.tvLive`,
  evento SSE `tv_status`).
- **Footer editable** desde `/admin` → Configuración: columnas y enlaces (con URL opcional),
  estructura flexible, validación de URL anti-`javascript:`.
- **Formulario `/pide`**: pedir canción + publicitar, con animación de éxito; `/pide/print` para
  impresión.
- **Panel `/admin`** (NextAuth): dashboard en tiempo real (oyentes, solicitudes, aprobación,
  modo emergencia), Programación, Locutores, Playlists, Configuración, Galería.

### API de automatización (app Python) + tiempo real
- Endpoints `/api/radio/*` con header `X-Radio-API-Key`: now-playing, program, queue (+dequeue),
  stats (+listeners), emergency, **tv**.
- **SSE** `/api/radio/events`: snapshot al conectar + updates (`now_playing_update`,
  `program_update`, `queue_update`, `listener_count`, `emergency`, `tv_status`, `config_update`).
- Cliente de referencia `radio_client_example.py` + documentación en `API.md`.

### SEO (buscadores tradicionales + IA)
- Metadata rica (Open Graph, Twitter cards, canonical, keywords), **JSON-LD** `RadioStation` +
  `WebSite`, `robots.txt` que **permite crawlers de IA** (GPTBot, ClaudeBot, PerplexityBot,
  Google-Extended, etc.) y bloquea `/admin`/`/api`, `sitemap.xml`, web manifest, **imagen Open
  Graph de marca** (generada en build) y `public/llms.txt`. Fuente única en `lib/seo.ts`.

### Infraestructura
- **Capa de datos: mysql2.** `lib/prisma.ts` es un shim con API compatible con Prisma respaldado
  por **MySQL** (el query engine de Prisma no corre en el hosting compartido de FastComet por los
  límites NPROC). `prisma/schema.prisma` queda como fuente de verdad de tablas/columnas; los
  cambios de columna se aplican con una migración idempotente en el arranque.
- **Despliegue: standalone en FastComet** (Phusion Passenger / LiteSpeed), build local en modo
  `output: "standalone"`. Ver [DEPLOYMENT.md](DEPLOYMENT.md).
- **Auto-deploy (CI/CD)**: cada `push` a `main` compila en GitHub Actions, sincroniza por
  **rsync/SSH** a FastComet, reinicia Passenger y verifica. `.github/workflows/deploy.yml`.

### Datos reales de la estación
- 99.9 FM · Ibarra, Imbabura · eslogan "Solo La Mega · Supera a La Mega".
- Programación, locutores, playlists, redes (`@lamega99.9ecuador`) y contacto
  (096 13 14 999 · megacontacto@yahoo.com) reales.
- Stream HTTPS de FastCast4U; apps Android/iOS y skill de Amazon Alexa enlazadas.

### Corregido (hotfix del día de lanzamiento)
- **El audio no sonaba en producción** tras activar el auto-deploy: las variables
  `NEXT_PUBLIC_*` se incrustan en build-time y el runner de CI compila sin el `.env` de
  producción, así que el player caía a un fallback `http://…:2250` que el navegador bloqueaba
  por *mixed-content* en el sitio HTTPS. Solución: fallback del player a la URL **HTTPS**
  (`usa3.fastcast4u.com/proxy/lamega`), el build de CI pasa `NEXT_PUBLIC_STREAM_URL`, y un
  guard en el workflow falla el deploy si se cuela una URL de stream insegura.

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
