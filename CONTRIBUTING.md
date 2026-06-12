# Guía de contribución — La Mega 99.9 FM

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
npm run setup           # crea la base de datos SQLite
npm run dev             # http://localhost:3000
```

Credenciales del dashboard (dev): `admin` / `lamega999` (los del `.env.example`).

## Estructura de ramas

| Rama | Propósito |
|---|---|
| `main` | Producción — siempre deployable |
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
docs: actualiza guía de despliegue para Railway
chore: actualiza next a 14.3
```

## Actualizar datos de la estación

Los datos de programación, locutores y playlists se gestionan en dos lugares:

- **`lib/station.ts`** — seed inicial en la base de datos (se ejecuta al arrancar si la DB está vacía)
- **`components/data.ts`** — datos estáticos de fallback mientras la DB carga

Si cambias programas o locutores:
1. Edita ambos archivos
2. Si hay cambios en el schema de Prisma, ejecuta `npm run setup`
3. Para resetear la DB de dev: `rm prisma/dev.db && npm run setup`

## Cambios en el schema de Prisma

```bash
# Editar prisma/schema.prisma
# Aplicar en dev (SQLite):
npx prisma db push

# Generar cliente actualizado:
npx prisma generate
```

No uses `prisma migrate dev` en desarrollo a menos que necesites un historial de migraciones. En producción con PostgreSQL, sí se recomienda `prisma migrate deploy`.

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
```bash
rm prisma/dev.db && npm run setup
```
