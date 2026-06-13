# Guía de despliegue — La Mega 99.9 FM

El sitio corre en **FastComet** (hosting compartido cPanel) con **Phusion Passenger**,
Node.js 22 y MySQL. El build de Next.js se hace en modo **standalone** (`output: "standalone"`
en `next.config.mjs`) y se despliega como un bundle autocontenido.

> **Importante:** el build se hace **localmente** (`npm run build` en tu Mac), no en el servidor.
> El servidor compartido no tiene recursos para compilar (SWC/rayon).

---

## Arquitectura de runtime en el servidor

```
~/lamegaecuador.com/
  app.js                         ← entry point de Passenger (wrapper)
  .htaccess                      ← directivas CloudLinux Passenger (NO reglas WordPress)
  .env                           ← variables de prod (mysql://, RADIO_API_KEY, etc.)
  .next/standalone/
    server.js                    ← servidor Next.js standalone (lo invoca app.js)
    .env                         ← copia de .env que el server lee en runtime
    .next/static/                ← assets cliente (copiados manualmente)
    public/                      ← assets públicos (copiados manualmente)
    node_modules/                ← deps mínimas + mysql2 (traceadas por el build)
  tmp/restart.txt                ← tocar este archivo reinicia Passenger
```

- **`app.js`** (en la raíz): `process.chdir(__dirname); require('./.next/standalone/server.js')`
- **Passenger** lo maneja vía **Application Manager** de cPanel (NO el "Setup Node.js App" /
  Node.js Selector — su URL devuelve 404 en este servidor).
- **Node.js** está en el virtualenv de CloudLinux: `/home/producci/nodevenv/lamegaecuador.com/22/bin/node`.

### `.htaccess` (bloque CloudLinux Passenger)

El `.htaccess` de la raíz **debe** ser exactamente esto (cualquier regla de WordPress ahí
manda todo a `index.php` → 404):

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/producci/lamegaecuador.com"
PassengerBaseURI "/"
PassengerNodejs "/home/producci/nodevenv/lamegaecuador.com/22/bin/node"
PassengerAppType node
PassengerStartupFile app.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```

Sin `PassengerAppRoot` + `PassengerBaseURI`, LiteSpeed sirve estáticos → 404.

---

## Capa de datos: mysql2 (no Prisma en runtime)

La app **no usa el query engine de Prisma** (no corre en este hosting). `lib/prisma.ts` es un
shim sobre **mysql2** con API compatible con Prisma. `next.config.mjs` incluye
`serverComponentsExternalPackages: ["mysql2"]` para que el tracer del standalone copie mysql2
y su árbol de dependencias al bundle.

- La base de datos es **MySQL** (`producci_lamega` en cPanel → MySQL Databases).
- El schema (`prisma/schema.prisma`) es la fuente de verdad de tablas/columnas. Para crear las
  tablas la primera vez, apuntá `DATABASE_URL` a la MySQL de FastComet y corré `npx prisma db push`
  (o creálas a mano). La columna `StationState.tvLive` se agrega sola al arrancar (migración
  idempotente en `lib/prisma.ts`).
- `DATABASE_URL` usa `mysql://user:pass@localhost:3306/db`. El shim mapea `localhost` → `127.0.0.1`
  para evitar que resuelva a IPv6 (donde MySQL no escucha).

---

## Procedimiento de re-deploy (el que se usa)

### 1. Build local

```bash
npm run build          # next build, salida en .next/standalone
```

### 2. Ensamblar el standalone (Next no copia estos solo)

```bash
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public
```

### 3. Empaquetar (excluyendo el .env para NO pisar el de producción)

```bash
tar -czf /tmp/lamega.tar.gz --exclude='.env' --exclude='._*' -C .next standalone
```

### 4. Subir por FTP

```bash
curl --user "ftpupload@lamegaecuador.com:<pass>" \
  -T /tmp/lamega.tar.gz \
  "ftp://ftp.produccionesmega.com/lamega.tar.gz"
```

(FTP server: `ftp.produccionesmega.com` · home = `/home/producci/lamegaecuador.com/`.)

### 5. Extraer + reiniciar (cPanel → Terminal)

```bash
cd ~/lamegaecuador.com
tar -xzf lamega.tar.gz -C .next      # extrae sobre standalone; preserva .env (no está en el tar)
rm -f lamega.tar.gz
touch tmp/restart.txt                # reinicia Passenger en la próxima petición
```

### 6. Habilitar / verificar

- cPanel → **Application Manager** → "La Mega Ecuador" debe estar **Enabled**.
- Verificar: `curl -s -o /dev/null -w "%{http_code}\n" https://lamegaecuador.com` → `200`.
- DB: `curl https://lamegaecuador.com/api/station` → `200` con JSON real.

---

## ⚠️ Cuidado: NO reiniciar el app en exceso

Este hosting tiene límites por cuenta bajos. Reiniciar/redesplegar muchas veces seguidas en una
sesión **acumula recursos zombie**:

- **Procesos (NPROC = 80):** cada reinicio fallido deja procesos node colgados → `cagefs_enter:
  Unable to fork` (la terminal y el panel dejan de funcionar).
- **Conexiones MySQL (`max_user_connections`):** cada reinicio deja conexiones "dormidas" →
  `ER_TOO_MANY_USER_CONNECTIONS` y la DB se cae para todo el sitio.

Mitigación ya en el código: pool mysql2 chico (`connectionLimit: 3, maxIdle: 1, idleTimeout: 30s`).
**Aun así:** agrupá cambios, desplegá una sola vez, y evitá toggear el app repetidamente. Si la
cuenta se traba, **soporte de FastComet (live chat)** puede matar los procesos/conexiones colgados
(lo hacen rápido).

---

## Endpoints de la app de automatización (Python)

La app Python empuja estado vía `/api/radio/*` con el header `X-Radio-API-Key`. Incluye, además
de now-playing/programa/stats/emergency:

- `POST /api/radio/tv {"live": true|false}` — muestra/oculta la sección **Mega TV** según la señal
  (llamar `true` al iniciar la transmisión en OneStream, `false` al detenerla).

Ver [API.md](API.md) y `radio_client_example.py`.

---

## Otros hosts (si algún día se migra)

Cualquier host con **Node.js persistente** (Railway, Render, Fly.io, un VPS) sirve — el bus SSE
en memoria (`lib/events.ts`) necesita un solo proceso Node. En esos hosts no hay el problema de
Prisma (se podría volver a Prisma si el plan lo permite). **Vercel/serverless no es ideal**: el bus
SSE no se comparte entre instancias.

---

## Checklist de despliegue

- [ ] `npm run build` pasa sin errores (salida `standalone`)
- [ ] `.next/static` y `public` copiados dentro de `.next/standalone/`
- [ ] Tarball creado **excluyendo `.env`**
- [ ] Extraído en el servidor; `.env` de prod intacto (`grep DATABASE_URL` → `mysql://`)
- [ ] `tmp/restart.txt` tocado y app **Enabled** en Application Manager
- [ ] `https://lamegaecuador.com` → 200 · `/api/station` → 200 con datos
- [ ] `/api/radio/events` devuelve `event: snapshot` con `tv_live`
- [ ] Login en `/admin/login` funciona
- [ ] Now playing se actualiza (metadatos ICY cada 15 s)
- [ ] Formulario `/pide` crea registros en la DB
