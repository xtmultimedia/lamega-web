# Footer editable desde Configuración — Diseño

**Fecha:** 2026-06-14
**Estado:** Aprobado

## Objetivo

Permitir editar el **Footer** del sitio público desde el panel de administración
(`/admin` → Configuración). Hoy el footer está hardcodeado en
`components/landing/Footer.tsx`.

## Alcance

Editable desde el panel:

- **Columnas del footer** (los 4 bloques: Sobre Nosotros, Programación, Legal,
  Contacto): título de cada columna y su lista de enlaces.
- **Estructura flexible:** agregar/quitar columnas y enlaces libremente.
- **Enlaces:** cada enlace tiene una etiqueta (texto) y una URL **opcional**. Con
  URL → clickeable; sin URL → solo texto (como ahora).

Fuera de alcance (siguen hardcodeados):

- Tagline central ("Solo La Mega · Supera a La Mega")
- Línea de copyright
- Badge "SUPERCOM"
- La línea "SEÑAL · 99.9 FM IBARRA" (ya viene de `config`)

## Modelo de datos

El footer es una estructura anidada de longitud variable. Se guarda como **JSON en
una columna nueva** `footer` (`String?`) en el modelo `StationConfig`, siguiendo el
patrón existente (`audience` en `AdCampaign` también es JSON en `String`).

```jsonc
// StationConfig.footer (string JSON) → al parsear:
[
  {
    "title": "Sobre Nosotros",
    "links": [
      { "label": "Quiénes somos", "url": "" },
      { "label": "Historia", "url": "https://..." }
    ]
  }
]
```

- `footer = null` (estado inicial): el sitio usa el contenido hardcodeado actual
  como fallback. Nada se rompe en el primer deploy.

### Migración en FastComet

No se puede correr `prisma db push` contra la MySQL del servidor. Se agrega la
columna con una **migración idempotente en el arranque** del pool en
`lib/prisma.ts` (`ALTER TABLE StationConfig ADD COLUMN footer ...`), igual que se
hizo con `StationState.tvLive`. La sentencia se ejecuta con `.catch(() => {})`
para ser idempotente (ya existe → no falla el arranque).

## Flujo (reusa el pipeline de config existente)

1. **`prisma/schema.prisma`** — agregar `footer String?` a `StationConfig` (fuente
   de verdad de tablas/columnas).
2. **`/api/admin/config`** (`app/api/admin/config/route.ts`):
   - El `zod` schema acepta `footer`: array de columnas
     `{ title: string, links: { label: string, url?: string }[] }`.
   - Límites: máx. 8 columnas, máx. 12 enlaces por columna, `title`/`label` ≤ 60
     chars, `url` ≤ 300 chars.
   - **Validación de URL**: solo se aceptan `http://`, `https://`, `mailto:`,
     `tel:` o rutas relativas (`/...` o `#...`). Cualquier otra (p. ej.
     `javascript:`) se rechaza → evita XSS por inyección.
   - Al guardar: serializar `footer` a JSON string en la columna.
   - Incluir el footer (ya parseado) en `emit("config_update", ...)` y en el GET.
   - `DEFAULTS` gana `footer: null`.
3. **`lib/radio-state.ts`** (`getSnapshot`) — incluir `footer` (parseado desde el
   JSON, o `null`) en el bloque `config` del snapshot SSE.
4. **`RadioProvider`** (`components/radio/RadioProvider.tsx`):
   - `StationConfigInfo` gana `footer?: FooterColumn[] | null`.
   - Tipos exportados: `FooterColumn = { title: string; links: FooterLink[] }`,
     `FooterLink = { label: string; url?: string }`.
   - El handler de `snapshot` y de `config_update` setean `footer` en el estado.
5. **`components/landing/Footer.tsx`**:
   - Renombrar el `FOOT_COLS` actual a `FOOT_COLS_DEFAULT` (fallback).
   - `const cols = config.footer && config.footer.length ? config.footer : FOOT_COLS_DEFAULT;`
   - `FootLink` acepta `url?`: con URL → `<a href={url}>` real (externos →
     `target="_blank" rel="noopener noreferrer"`); sin URL → comportamiento actual
     (`href="#"`, `preventDefault`). Se conserva el hover y el diseño glass.

## Editor en el panel (`ConfiguracionView` en `components/admin/views.tsx`)

Nueva tarjeta **"Footer"** debajo de la de "Datos de la señal":

- `cfg` (form local) gana `footer: FooterColumn[]` (si viene `null` del API, se
  inicializa con `FOOT_COLS_DEFAULT` para que el editor muestre el contenido
  actual y sea editable).
- Por cada **columna**: input de **título** + botón "eliminar columna".
  - Dentro, por cada **enlace**: input **etiqueta** + input **URL (opcional)** +
    botón "eliminar enlace".
  - Botón "+ Agregar enlace".
- Botón "+ Agregar columna".
- Se guarda con el botón "Guardar cambios" ya existente (un solo PUT que ya manda
  todo el config; se le añade `footer`).
- Estilo consistente con los inputs/cards existentes de la vista.

## Verificación

- `npm run build` pasa.
- `npm run dev`: en `/admin` → Configuración, editar títulos/enlaces, agregar y
  quitar columnas/enlaces, guardar → el footer del sitio público (`/`) refleja los
  cambios en vivo vía SSE `config_update` (sin recargar).
- Enlace con URL externa → abre en pestaña nueva; enlace sin URL → texto no
  clickeable.
- Intento de guardar una URL `javascript:...` → rechazado (400).
- Con la columna `footer` ausente / `null` → el footer muestra el contenido por
  defecto (no se rompe).
