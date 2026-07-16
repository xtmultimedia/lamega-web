# Changelog

Todos los cambios notables de este proyecto se documentan aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).  
Versiones siguiendo [Semantic Versioning](https://semver.org/).

La versión mostrada en la web y el panel sale de [`lib/version.ts`](lib/version.ts) (`APP_VERSION`).

---

## [1.3.0] — 2026-07-16

### Añadido
- **EL MEGÁFONO**: el blog de noticias de La Mega, en `/megafono` (índice paginado) y `/megafono/<enlace>` (la nota). Se administra desde el panel → **El Megáfono** (Admin y Editor).
- **Editor visual** estilo WordPress (TipTap): títulos, negrita, itálica, tachado, listas, cita, separador, enlaces e **imágenes dentro del cuerpo**, con deshacer/rehacer.
- **Borradores**: cada nota es *Borrador* o *Publicada*. Los borradores no aparecen en ningún lado público — ni en la portada, ni en `/megafono`, ni en el sitemap, y su URL directa devuelve **404** (indistinguible de una nota inexistente).
- **Imagen destacada** por nota: se usa en la portada, en el índice y al compartir en redes (Open Graph).
- **Franja en la portada** con las **3 últimas** notas + "Ver todas". Si no hay notas publicadas, la sección simplemente no aparece.
- **Firma**: las notas se publican como **"Por El Megáfono"** — la marca, no la persona.
- Nuevo link **MEGÁFONO** en el menú y "El Megáfono" en el footer por defecto.
- **SEO**: `generateMetadata` por nota (con su imagen en Open Graph/Twitter), JSON-LD `BlogPosting` por nota y `Blog` en el índice, y el **sitemap ahora incluye cada nota publicada**.
- **Restablecer contraseña** (Usuarios → 🔑). Hasta ahora, si alguien olvidaba su contraseña **no había salida**: "Reenviar invitación" solo funciona para cuentas que todavía no tienen una, así que la única opción era eliminar la cuenta y recrearla — perdiendo su vínculo con el perfil de locutor. Ahora un Admin genera un enlace de un solo uso (mismo mecanismo que las invitaciones: token aleatorio, guardado hasheado, vence en 7 días). Se envía por email y **el panel siempre muestra el enlace copiable**, así funciona aunque Resend no esté configurado.

### Corregido
- **🔴 La causa raíz de las caídas del sitio: el SSE impedía que murieran las instancias viejas.** `/api/radio/events` abre un stream que **nunca termina**, con un heartbeat cada 25 s que impide que expire. Al desplegar, Passenger levanta una instancia nueva y apaga la vieja **con elegancia: esperando a que terminen las peticiones en curso**. Una petición SSE no termina jamás — así que la instancia vieja quedaba viva para siempre, sostenida por su propio heartbeat, ocupando ~14 procesos del límite de 80 de la cuenta. **Cuatro o cinco despliegues y el sitio entero se caía** (pasó tres veces el 2026-07-16, y hubo procesos de más de 22 horas). Ahora el stream tiene vida máxima (~10 min + azar) y el cliente reconecta solo, rehidratándose con el `snapshot` de siempre: nadie nota nada, pero las instancias viejas por fin drenan y Passenger las recicla.
- **El ticker se congelaba a quien no recargara después de un despliegue.** Consecuencia de lo anterior: el bus de eventos vive **en memoria de cada instancia**, así que un oyente atado a una instancia superada no volvía a recibir el "ahora suena". El límite de vida del stream lo acota.
- **El menú se desbordaba cuando Mega TV estaba al aire.** Medido: la fila de links ocupaba **1017 px en 1017 px disponibles** — cero margen —, así que el link "MEGA TV" (que solo aparece en vivo) ya la rompía; no se notaba porque la TV estaba apagada. Ahora los links se compactan antes de quedarse sin sitio y el menú hamburguesa entra donde de verdad hace falta. Verificado con todos los links visibles a 1149 / 1151 / 1280 / 1361 / 1440 px.

### Seguridad
- **El HTML de las notas se sanitiza en el servidor al GUARDAR** (`lib/sanitize.ts`), así la base sólo contiene marcado limpio: una lista blanca estricta de etiquetas, sin `script`/`iframe`/`object`/`style`/`class`/`on*`, sin URIs `data:` y sin URLs protocol-relative. Se sanitiza al escribir y no al leer, para que ninguna vista futura pueda olvidarse de hacerlo.
- Las **imágenes** (portada y cuerpo) sólo pueden ser `/uploads/...`: una URL externa permitiría incrustar un rastreador de terceros en la web pública.
- Los **enlaces salientes** salen con `rel="noopener noreferrer"` (sin eso, la página abierta puede redirigir la pestaña original).
- Verificado con 22 pruebas de inyección: `<script>`, `<scr<script>ipt>` ofuscado, `javascript:` con mayúsculas mezcladas, `onerror`/`onclick`, `<iframe>`, `<svg onload>`, `data:` con SVG+script, `<form>`, imágenes externas, protocol-relative y path traversal.
- **Restablecer contraseña no revive cuentas desactivadas**: aceptar un enlace marca la cuenta como activa, así que restablecer una cuenta desactivada la habría dejado entrar por la puerta de atrás. Ahora hay que activarla explícitamente primero.
- **La contraseña actual sigue valiendo hasta que se usa el enlace**: si se borrara al generarlo, un restablecimiento que la persona nunca completa la dejaría afuera.

### Técnico
- Tabla `Post` creada por **migración idempotente** (`CREATE TABLE IF NOT EXISTS`), con `slug` único e índice `(status, publishedAt)`; entrada `post` en el mapa `MODELS` del shim.
- **CRUD real por fila** (`POST`/`PATCH`/`DELETE`), a diferencia del patrón borrar-y-recrear de Programación/Playlists: la tabla crece y sus filas son URLs públicas estables.
- `publishedAt` se estampa **sólo en la primera publicación**: reeditar una nota viva no la reordena, y despublicar y volver a publicar no la salta al tope.
- El shim mysql2 gana soporte de **`skip`** (`findMany`), necesario para paginar. MySQL no acepta `OFFSET` suelto, así que sin `take` se emite el idioma documentado `LIMIT 18446744073709551615 OFFSET n`.
- Al editar, el slug se compara **excluyendo la propia nota**; si no, guardar sin tocar el título la renombraría a `-2` en cada guardado y rompería su URL publicada.
- `lib/megafono.ts` es **puro** (cero imports) — lo comparten cliente y servidor; `lib/posts.ts` y `lib/sanitize.ts` son `server-only`.
- `/megafono`, `/megafono/[slug]` y `sitemap.xml` van con `force-dynamic`: sin eso, el build de CI (que no tiene base de datos) se rompe. Misma trampa que `/staff`.
- Los borradores se filtran **por `status`**, no por `publishedAt`: el shim compila `{ not: null }` a `col <> NULL`, que en SQL nunca es cierto.

---

## [1.2.0] — 2026-07-15

### Añadido
- **Mi Perfil**: cualquier usuario del panel (incluidos los locutores) edita **su propia** foto, mini-bio (280 caracteres) y redes, y **cambia su contraseña**. El nombre, alias y programas los sigue controlando un Admin.
- **Página pública `/staff`**: tarjetas con foto, alias, bio, redes y **los programas que conduce cada locutor**. Server-rendered (los buscadores la leen) con JSON-LD `ItemList` de `Person`.
- Los Admin **enlazan una cuenta a su perfil de locutor** desde Usuarios; eso habilita Mi Perfil y su aparición en `/staff`.
- Nuevo link **STAFF** en el menú y "Nuestro equipo" en el footer por defecto.

### Corregido
- **Los programas con varios conductores ahora muestran a todos.** `Show.host` era texto libre (ej. `"Joselyn Hernández & Marcos Cruz"`) y la web hacía un *match difuso por substring* que solo encontraba al primero. Ahora existe un vínculo real (`Show.hostIds`) y la tarjeta muestra los avatares de **todos** los conductores. Los programas sin locutor (`"Automático"`) siguen con el ícono de micrófono.
- Los enlaces del menú pasaron de anclas puras (`#programacion`) a **root-relative** (`/#programacion`) para que funcionen desde sub-páginas como `/staff`.

### Seguridad
- `/api/admin/me` resuelve la fila **siempre desde la sesión**; nunca lee `id`, `role`, `active` ni `hostId` del body. Un locutor solo puede editarse a sí mismo.
- Las fotos de perfil deben ser `/uploads/...` (no se aceptan URLs externas) y las redes solo `https://`.
- Los locutores ahora pueden subir foto, pero **solo imágenes y máx. 8 MB** (la Galería mantiene 80 MB y video para admin/editor).
- **El guardado de Locutores ya no borra y recrea la tabla**: sincroniza incrementalmente. `Host.id` es referenciado por `AdminUser.hostId` y `Show.hostIds`, y el borrado masivo también hubiera eliminado las bios que el cliente no reenviara.

### Técnico
- Migraciones idempotentes: `Host.bio`, `Host.socials` (JSON), `Show.hostIds` (JSON), `AdminUser.hostId`.
- `lib/hosts.ts`: módulo **puro** (cero imports) con tipos, parsers tolerantes y validación de URLs — lo comparten cliente y servidor.
- Backfill one-shot de `Show.hostIds` a partir del texto libre, **filtrando en memoria** (el shim compila `where: { x: null }` a `x = NULL`, que nunca matchea).

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
