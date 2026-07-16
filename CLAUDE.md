# La Mega 99.9 FM — notas para trabajar en este repo

Next.js 14 (App Router, TS) para una radio en vivo. Producción: **FastComet, hosting
compartido, cPanel + Passenger/LiteSpeed, MySQL**. Ese hosting es la razón de casi
todas las rarezas de abajo — no son gustos, son restricciones.

Docs: [README](README.md) · [ARCHITECTURE](ARCHITECTURE.md) · [API](API.md) ·
[DEPLOYMENT](DEPLOYMENT.md) · [CHANGELOG](CHANGELOG.md) · diseños en `docs/superpowers/specs/`.

## Lo que más rápido te rompe

**No hay Prisma en runtime.** `lib/prisma.ts` es un **shim propio sobre mysql2** con API
parecida a Prisma. El engine de Prisma no arranca en este hosting. El shim **no tiene
joins, ni `include`/`select`, ni `contains`, ni `OR`** — resolvé en memoria (`getStationData()`
ya carga shows y hosts juntos). `where` solo admite igualdad escalar y
`{equals, not, gte, gt, lte, lt, in}`.

**Dos trampas verificadas del shim, ambas nos costaron un bug:**
- `where: { x: null }` compila a `x = NULL` → **nunca matchea**. Filtrá nulos en memoria.
- `update()` devuelve `null` si `affectedRows === 0`, y MySQL reporta 0 al guardar valores
  idénticos. **No es un error** — re-leé con `findUnique` (guardar sin cambios debe dar 200).

**Cambios de tablas/columnas = migración idempotente** en `pool()` de `lib/prisma.ts`
(`ALTER TABLE … ADD COLUMN` / `CREATE TABLE IF NOT EXISTS`, cada una con `.catch(() => {})`).
`prisma/schema.prisma` es **solo documentación**; el CLI de Prisma no corre contra producción.
Modelo nuevo → sumalo también al mapa `MODELS`.

**Toda página que lea la DB necesita `export const dynamic = "force-dynamic"`.** Si no, Next
prerenderiza en build y **el runner de CI no tiene base de datos → el build se rompe**. Aplica a
`/staff`, `/megafono`, `/megafono/[slug]` y `app/sitemap.ts`.
Verificalo así antes de pushear: `env -u DATABASE_URL npx next build`.

**Las `NEXT_PUBLIC_*` se incrustan en build-time** y el CI compila **sin** el `.env` de
producción → hay que pasarlas en el workflow. Ya nos dejó la radio muda una vez (el player cayó
a un fallback `http://` y el navegador lo bloqueó por mixed-content). Hay un guard en el
workflow que ahora lo previene.

## Presupuesto de despliegues (importante)

La cuenta tiene **NPROC=80 compartido** y cada instancia de `next-server` cuesta **~14**
(NPROC cuenta *threads*). O sea: **la cuenta se bloquea a las ~5-6 instancias** y el sitio
entero se cae. Pasó tres veces el 2026-07-16.

La causa era nuestra y **ya está arreglada** (`MAX_STREAM_MS` en `/api/radio/events`, v1.3): el
stream SSE no terminaba nunca, y Passenger apaga la instancia vieja *esperando* a que terminen
las peticiones en curso → la vieja quedaba viva para siempre. **No le quites la vida máxima al
SSE.** Si vuelve a acumularse, leé ahí primero.

Aun así: **agrupá cambios y desplegá una vez.** Cada deploy es un reinicio.

## Reglas del código

**Módulos puros vs server-only.** `lib/roles.ts`, `lib/footer.ts`, `lib/hosts.ts` y
`lib/megafono.ts` son **puros** (cero imports server) porque los importan componentes cliente.
`lib/auth-guard.ts`, `lib/posts.ts` y `lib/sanitize.ts` llevan `import "server-only"`. Meter
next-auth/bcrypt/mysql2 en un módulo puro arrastra el servidor al bundle del navegador.

**La autorización es del servidor.** `requireRole([...])` → 401/403 en toda ruta `/api/admin/*`.
El filtro del nav es cosmético.

**El HTML de las notas se sanitiza al GUARDAR** (`lib/sanitize.ts`), nunca al renderizar: así la
base solo guarda marcado limpio y ninguna vista futura puede olvidarse. Si ampliás la lista
blanca, ampliá también el toolbar de `PostEditor.tsx` — y al revés (que el editor produzca algo
que el sanitizador borra es mentirle al autor).

**No "arregles" el login a `type="email"`.** El campo dice "Email" pero es `type="text"` a
propósito: la credencial del `.env` (`ADMIN_USER`, que no es un email) es el **escape hatch
anti-lockout** y funciona aunque la DB esté caída.

**Contenido que crece ≠ catálogo.** Programación/Playlists usan borrar-y-recrear. `Post` y `Host`
**no**: sus filas tienen URLs públicas o son referenciadas (`AdminUser.hostId`, `Show.hostIds`).
Ahí va CRUD por fila o sync incremental.

**El bus SSE (`lib/events.ts`) vive en memoria del proceso.** Con más de una instancia, los
eventos no se propagan entre ellas. Es un límite real, no teórico.

## Despliegue

`git push origin main` → GitHub Actions compila, hace rsync a FastComet, reinicia Passenger y
verifica. **No compiles en el servidor** (no puede). Detalle en [DEPLOYMENT.md](DEPLOYMENT.md).

⚠️ `app.js` está en el repo pero **el CI no lo sube** — el rsync solo sincroniza
`.next/standalone/`. Cambiarlo requiere subirlo a mano por el File Manager.

⚠️ **No corras `next build` con el dev server prendido**: se pisan en `.next` y el build falla
con errores que no tienen nada que ver (`Cannot find module for page: …`).

## Convenciones

- **La web y el panel están en español** (es-EC, voseo). El código y los comentarios, en inglés.
- Versión en `lib/version.ts` (`APP_VERSION`) → footer público + sidebar del panel. Subila con
  cada release y anotá el CHANGELOG.
- Estilos **inline** con CSS vars (`var(--red)`, `var(--fg-2)`, `var(--r-md)`); las primitivas
  están en `components/ui.tsx` (público) y `components/admin/primitives.tsx` (panel).
- Los íconos son de lucide en kebab-case (`<Icon name="key-round" />`) y **si el nombre no existe
  renderizan `null` en silencio** — verificalos.
- Páginas públicas fuera de la portada necesitan `<RadioProvider>`: `Nav`, `Footer` y
  `MiniPlayer` llaman `useRadio()` y explotan sin él.
