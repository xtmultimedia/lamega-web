# EL MEGÁFONO (blog) — diseño

**Versión:** v1.3 · **Fecha:** 2026-07-16 · **Estado:** implementado

Fase 2 del plan "Perfiles, STAFF y EL MEGÁFONO". La Fase 1 (perfiles + vínculo
locutor↔programa + `/staff`) salió en v1.2.

## Contexto

La Mega necesita publicar noticias diarias "estilo WordPress". Hasta ahora el
sitio no tenía ninguna superficie editorial: todo el contenido (programas,
locutores, playlists) es catálogo de estructura fija que el panel **borra y
recrea entero** en cada guardado.

Un blog rompe ese patrón por dos razones que definen casi todo el diseño:

1. **La tabla crece sin techo.** No se puede reenviar entera en cada guardado.
2. **Cada fila es una URL pública** (`/megafono/<slug>`). Borrar y recrear
   rompería enlaces ya compartidos, indexados y citados.

## Decisiones del producto

| Tema | Decisión |
|---|---|
| Borradores | **Sí** — cada nota es `draft` o `published` |
| Quién escribe | **Admin y Editor** (los locutores no) |
| Firma | **"Por El Megáfono"** — la marca, no la persona. **No** hay autor individual |
| Portada | **Franja con las 3 últimas** + "Ver todas" |
| Fuera de alcance | Categorías/etiquetas, buscador, comentarios, publicación programada |

La firma de marca elimina la idea de `authorHostId` que traía el esbozo original:
no hace falta vincular notas con locutores.

## Modelo

```prisma
model Post {
  id          String    @id @default(uuid())
  slug        String    @unique
  title       String
  excerpt     String?
  contentHtml String?   @db.MediumText
  coverUrl    String?
  status      String    @default("draft")
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([status, publishedAt])
}
```

Creada con `CREATE TABLE IF NOT EXISTS` en `pool()` (`lib/prisma.ts`), el patrón
idempotente de la casa, + entrada `post` en el mapa `MODELS`.

**`contentHtml` es `MEDIUMTEXT`, no `TEXT`.** `TEXT` topa a 65.535 **bytes**
(no caracteres: un emoji cuesta 4), y MySQL trunca en silencio — cortando el HTML
a la mitad de una etiqueta. Una nota larga con formato es un candidato realista a
pasarse.

**`publishedAt` se estampa sólo en la primera publicación.** El índice ordena por
esa fecha; si se refrescara en cada guardado, corregir una errata saltaría la nota
al tope. Despublicar tampoco la borra, así que republicar no la reordena.

## Seguridad: la sanitización del HTML

El punto delicado del feature. El cuerpo se escribe como HTML y se renderiza con
`dangerouslySetInnerHTML` — el único punto del sitio donde entra marcado de
terceros (hasta ahora sólo se usaba para JSON-LD, que generamos nosotros).

**Se sanitiza en el servidor y al ESCRIBIR** (`lib/sanitize.ts`, `sanitize-html`):

- La base sólo contiene HTML limpio. Sanitizar al leer significaría que cualquier
  vista futura que olvide llamarlo abre un agujero, y que cada render lo paga.
- Lista blanca estricta; fuera `script`/`iframe`/`object`/`embed`/`form`, los
  atributos `style`/`class`/`id` y los `on*`.
- Esquemas: sólo `http`/`https`/`mailto`/`tel`. **Sin `data:`** (puede llevar un
  SVG con `<script>`) y sin protocol-relative (`//host`).
- **Imágenes sólo `/uploads/...`** (`isSafeUploadUrl`): una URL externa metería un
  rastreador de terceros en la web pública, y moriría si ese host desaparece. El
  chequeo de esquema de `sanitize-html` deja pasar cualquier URL relativa, así que
  esto lo impone un `exclusiveFilter`.
- Enlaces salientes con `rel="noopener noreferrer"` obligatorio.
- `import "server-only"`: `sanitize-html` nunca debe llegar al navegador — ahí
  sería peso muerto y, sobre todo, evitable.

Editores y admins son cuentas de confianza, pero **"de confianza" no es un límite
de seguridad**: una cuenta se puede phishear, y un pegado desde Word o una web
puede traer marcado que su autor jamás miró. Quien paga el XSS es el oyente.

**El toolbar del editor se limita a lo que el sanitizador permite.** Si el editor
pudiera producir algo que el sanitizador borra, el autor lo vería, guardaría, y lo
vería desaparecer: por eso `codeBlock` y `code` se desactivan en el `StarterKit`,
en vez de sólo omitirlos del toolbar.

**Verificado con 22 pruebas de inyección** (todas bloqueadas): `<script>`,
`<scr<script>ipt>` ofuscado, `javascript:` con mayúsculas mezcladas,
`onerror`/`onclick`, `<iframe>`, `<svg onload>`, `data:` con SVG+script,
`<form>`, `style=`, `class=`/`id=`, `<object>`/`<embed>`, imagen externa,
protocol-relative, path traversal — y el formato legítimo sobrevive intacto.

## API — CRUD real por fila

| Ruta | Método | Rol | Notas |
|---|---|---|---|
| `/api/admin/posts` | `GET` | admin, editor | Incluye borradores |
| `/api/admin/posts` | `POST` | admin, editor | Crea |
| `/api/admin/posts/[id]` | `PATCH` | admin, editor | Edita |
| `/api/admin/posts/[id]` | `DELETE` | admin, editor | Borra |
| `/api/posts` | `GET` | público | Sólo publicadas, sin `contentHtml` |

**Slug.** Se deriva del título (NFD + sin diacríticos, minúsculas, guiones) y es
editable. `uniqueSlug()` prueba `base`, `base-2`, `base-3`… por igualdad (el shim
no tiene `LIKE`/`contains`; el índice `UNIQUE` hace que cada intento sea un hit de
índice).

**`uniqueSlug()` recibe el id de la nota que se está editando.** Sin eso, guardar
sin tocar el título vería su **propio** slug como ocupado y lo renombraría a `-2`
en cada guardado, rompiendo la URL publicada. Es el bug más fácil de introducir
acá.

Aun con el chequeo previo, dos creaciones simultáneas pueden competir por el mismo
slug: el índice `UNIQUE` es la garantía real, y `ER_DUP_ENTRY` se reporta como
**409**, no como 500.

## Público

- **`/megafono`** — índice paginado (9 por página).
- **`/megafono/[slug]`** — la nota. Primera ruta dinámica del proyecto.
  `generateMetadata` por nota (OG/Twitter con la imagen destacada) y JSON-LD
  `BlogPosting`. **Borradores y slugs inexistentes comparten el 404**: una URL
  despublicada no debe distinguirse de una inexistente.
- **Franja en la portada** — las 3 últimas. Como `app/page.tsx` es cliente, se
  alimenta de `/api/posts` (mismo patrón que `useStationData`). Si no hay notas,
  **la sección no se renderiza**: una franja de "noticias" vacía parece rota.
- **Sitemap** — pasa a `async` e incluye cada nota; si la DB falla, devuelve las
  rutas estáticas en vez de un 500 al crawler.

## Trampas del código (verificadas)

1. **`force-dynamic` es obligatorio** en `/megafono`, `/megafono/[slug]` y
   `sitemap.ts`. Sin eso Next prerenderiza en build → MySQL → **el build de CI se
   rompe** (el runner no tiene DB). Misma trampa que `/staff` en v1.2.
   Comprobado: `env -u DATABASE_URL npx next build` pasa y las tres salen `ƒ`.
2. **Los borradores se filtran por `status`, no por `publishedAt`.** El shim
   compila `{ not: null }` a `col <> NULL`, que en SQL nunca es cierto → devolvería
   cero filas. El descarte por `publishedAt` nulo se hace **en memoria**.
3. **`update()` devuelve `null` con `affectedRows === 0`** — guardar sin cambios.
   No es un error: se re-lee con `findUnique`.
4. **MySQL no acepta `OFFSET` suelto**, sólo dentro de `LIMIT`. El `skip` nuevo del
   shim emite `LIMIT 18446744073709551615 OFFSET n` (el idioma documentado) cuando
   no hay `take`.
5. **`sanitize-html` NO aparece en `node_modules` del standalone** — webpack lo
   incrusta en el chunk de la ruta. Verificado que el código está y que no queda
   ningún `require` externo colgando. Al revés que `mysql2`, no necesita
   `serverComponentsExternalPackages`.
6. **TipTap necesita `immediatelyRender: false`**: Next server-renderiza también
   los componentes cliente, y el editor produciría un hydration mismatch.

## Bug corregido de paso (preexistente)

Al medir el menú con el link nuevo apareció que **la fila de links ocupaba 1017 px
en 1017 px disponibles: cero margen**. O sea que el link "MEGA TV" —que sólo
aparece cuando la TV está al aire— **ya la desbordaba**; no se notaba porque la TV
está apagada. EL MEGÁFONO lo habría vuelto permanente.

Arreglo: los links se compactan (`--nav-pad`) antes de quedarse sin sitio, y el
menú hamburguesa entra a 1150 px. Los breakpoints salen de la medición, no de
números redondos. Verificado con todos los links visibles (MEGA TV forzado al
aire) a 1149 / 1151 / 1280 / 1361 / 1440 px.

## Dependencias nuevas

`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link`,
`@tiptap/extension-image`, `@tiptap/extension-placeholder`, `sanitize-html`
(+ `@types/sanitize-html`). TipTap sólo pesa en el panel; `sanitize-html` sólo en
el servidor.

## Pendiente

- **Tests automatizados del sanitizador.** Las 22 pruebas se corrieron a mano: el
  proyecto no tiene runner. Blocker para vitest: `lib/sanitize.ts` importa
  `server-only`, que revienta fuera de un React Server Component → hace falta un
  alias a un stub vacío en `vitest.config.ts`. **No quitar** ese import: es lo que
  hace fallar el build si `sanitize-html` se filtra al navegador.
