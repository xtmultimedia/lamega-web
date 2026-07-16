# Guía de contribución — La Mega 99.9 FM

> 🧭 **Antes de escribir código, leé [CLAUDE.md](CLAUDE.md).** Es una página con las
> restricciones del hosting compartido que explican las decisiones raras de este repo: el shim de
> mysql2 (sin joins ni `contains`) y sus dos trampas verificadas, por qué toda página que lee la
> DB necesita `force-dynamic`, el techo de procesos que ya tumbó el sitio, y la vida máxima del
> SSE que lo evita. Esta guía cubre el *cómo* del día a día; CLAUDE.md cubre el *por qué*.

## Requisitos previos

- Node.js 18 o 20 LTS
- npm 9+
- Git

## Configuración del entorno de desarrollo

```bash
git clone https://github.com/xtmultimedia/lamega-web.git
cd lamega-web
npm install
cp .env.example .env    # editar con valores de desarrollo
npm run dev             # http://localhost:3000
```

> **Base de datos:** la app usa **MySQL** vía `mysql2` (`lib/prisma.ts`). Para que funcionen las
> rutas con DB, levantá un MySQL local y poné `DATABASE_URL=mysql://user:pass@127.0.0.1:3306/db`,
> luego `npm run setup` (`prisma db push`) para crear las tablas. El frontend (landing, `/pide`)
> renderiza sin DB. Nota: ya **no** se usa SQLite — el shim de mysql2 no se conecta a `file:`.

Credenciales del dashboard (dev): `admin` / `lamega999` (los del `.env.example`).

## Estructura de ramas

| Rama | Propósito |
|---|---|
| `main` | Producción — **cada push/merge dispara el auto-deploy a FastComet** (GitHub Actions) |
| `feature/nombre` | Nuevas funcionalidades |
| `fix/nombre` | Corrección de bugs |
| `chore/nombre` | Mantenimiento, dependencias, docs |

## Flujo de trabajo

1. Crear una rama desde `main`:
   ```bash
   git checkout -b feature/nueva-seccion
   ```

2. Hacer los cambios y verificar que el build pasa:
   ```bash
   npm run build
   ```

3. Commit con mensaje descriptivo:
   ```bash
   git commit -m "feat: añade sección de concursos a la landing"
   ```

4. Push y crear Pull Request hacia `main`.

5. Al mergear a `main`, el workflow `.github/workflows/deploy.yml` despliega solo a
   producción (build → rsync/SSH → restart). Seguilo en la pestaña **Actions**.
   Si tocás algo visible, **subí `APP_VERSION` en `lib/version.ts`** (v1.0 → v1.1 …) y
   agregá la entrada correspondiente en `CHANGELOG.md`.

## Convención de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `chore:` | Mantenimiento (deps, config, scripts) |
| `docs:` | Solo documentación |
| `style:` | Cambios visuales/CSS sin lógica |
| `refactor:` | Refactorización sin cambios de comportamiento |
| `perf:` | Mejoras de rendimiento |

Ejemplos:
```
feat: añade reproductor de video en Mega TV
fix: corrige número de teléfono en el ticker
docs: actualiza guía de despliegue de FastComet
chore: actualiza next a 14.3
```

## Actualizar datos de la estación

Los datos de programación, locutores y playlists se gestionan en dos lugares:

- **`lib/station.ts`** — seed inicial en la base de datos (se ejecuta al arrancar si la DB está vacía)
- **`components/data.ts`** — datos estáticos de fallback mientras la DB carga

Si cambias programas o locutores:
1. Edita ambos archivos
2. Si hay cambios de tablas/columnas, aplicá el schema a tu MySQL con `npm run setup` (`prisma db push`)

## Cambios en el schema (tablas/columnas)

El runtime es **mysql2**, no Prisma. `prisma/schema.prisma` es **solo documentación** del schema
— nada en producción lo lee.

**En desarrollo**, `npm run setup` (`prisma db push`) crea las tablas en tu MySQL local a partir
del schema. Cómodo, pero es una herramienta de dev.

**En producción NO se corre Prisma.** El CLI no puede tocar la base del hosting compartido. Los
cambios de schema se aplican con una **migración idempotente en el arranque**, dentro de `pool()`
en [lib/prisma.ts](lib/prisma.ts) — el mismo patrón que ya usan `tvLive`, `footer`, `Host.bio`,
`Show.hostIds`, `AdminUser` y `Post`:

```ts
// Columna nueva:
p.query("ALTER TABLE Show ADD COLUMN hostIds TEXT NULL").catch(() => {});
// Tabla nueva (+ agregala también al mapa MODELS del shim):
p.query(`CREATE TABLE IF NOT EXISTS Post ( … )`).catch(() => {});
```

El `.catch(() => {})` es lo que la vuelve idempotente: la segunda vez falla con "duplicate
column" y se ignora. **Escribí siempre las dos cosas: la migración (lo que corre) y el schema
(lo que se lee).**

- El shim de `lib/prisma.ts` mapea **nombre de modelo → tabla** y **campo → columna** tal cual
  (sin `@@map`). Si agregás una columna que el shim debe escribir, asegurate de que exista en la
  tabla (db push, o una migración).
- En **producción** (FastComet) no se puede correr `prisma db push` apuntando a la MySQL del
  servidor desde tu máquina (no es accesible). Para un cambio de columna puntual, agregá una
  migración idempotente en el arranque del pool (`lib/prisma.ts`) como se hizo con `tvLive`, o
  pedí a soporte / usá la terminal del servidor.

## Añadir una nueva sección a la landing

1. Crear `components/landing/NuevaSeccion.tsx`
2. Exportarla desde `components/landing/index.ts` (o importarla directamente en `app/page.tsx`)
3. Añadir el scroll anchor correspondiente en el Nav si es necesario
4. Seguir el patrón de diseño existente: usar `<Section>`, `<Bloom>`, `<SectionHead>` de `components/ui.tsx`

## Añadir un nuevo endpoint de la API

1. Crear `app/api/ruta/route.ts`
2. Si requiere autenticación de la app Python: llamar `requireRadioKey(req)` de `lib/radio-auth.ts`
3. Si emite eventos SSE: usar `emit()` de `lib/events.ts`
4. Documentar el endpoint en `API.md`
5. Añadir un ejemplo en `radio_client_example.py` si aplica

## Variables de entorno secretas

Nunca commitear el archivo `.env`. Si necesitas añadir una nueva variable:
1. Añádela a `.env.example` con un valor de ejemplo (sin secretos reales)
2. Documéntala en la tabla de variables de `README.md`
3. Añade el nombre de la variable al checklist de despliegue en `DEPLOYMENT.md`

## Preguntas frecuentes

**¿Cómo pruebo el now playing sin el stream real?**  
Llama directamente al endpoint de la API Python:
```bash
curl -X POST http://localhost:3000/api/radio/now-playing \
  -H "X-Radio-API-Key: dev_radio_key_lamega999" \
  -H "Content-Type: application/json" \
  -d '{"title":"Provenza","artist":"Karol G","duration":213}'
```

**¿Cómo accedo a la base de datos de dev?**  
```bash
npm run db:studio  # abre Prisma Studio en el navegador
```

**¿Cómo reseteo la base de datos?**  
Borra/recrea el schema en tu MySQL local (ej. `DROP DATABASE` + `CREATE DATABASE`) y volvé a
correr `npm run setup` (`prisma db push`). Ya no hay archivo SQLite que borrar.
