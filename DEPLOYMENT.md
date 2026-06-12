# Guía de despliegue — La Mega 99.9 FM

## Opciones de hosting

| Opción | SSE persistente | Costo | Recomendado para |
|---|---|---|---|
| **Railway / Render / Fly.io** | ✅ Sí | Desde $5/mes | Producción principal |
| **FastComet (cPanel + Node.js)** | ✅ Sí | Ya contratado | Producción actual |
| **Vercel** | ⚠️ Limitado | Gratis / $20 | Solo si no se usa SSE en tiempo real |
| **VPS propio** | ✅ Sí | Variable | Control total |

> **Nota sobre SSE:** El bus de eventos en memoria (`lib/events.ts`) requiere un proceso Node.js persistente. En Vercel serverless, cada petición puede ejecutarse en una instancia diferente, por lo que los eventos de la app Python pueden no llegar a todos los navegadores. Para tiempo real completo, usa un host con servidor Node persistente.

---

## Railway (recomendado)

### 1. Preparar el repo

```bash
# Asegúrate de que el build pasa limpio
npm run build
```

### 2. Crear el proyecto en Railway

1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Seleccionar `xtmultimedia/lamega-web`
3. Railway detecta automáticamente Next.js

### 3. Base de datos PostgreSQL

En Railway: Add → Database → PostgreSQL  
Railway inyecta `DATABASE_URL` automáticamente.

Actualiza `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Variables de entorno (Railway → Variables)

```
NEXT_PUBLIC_STREAM_URL=https://usa3.fastcast4u.com/proxy/lamega?mp=/stream
STREAM_URL=https://usa3.fastcast4u.com/proxy/lamega?mp=/stream
RADIO_API_KEY=<genera con: openssl rand -hex 32>
ADMIN_USER=admin
ADMIN_PASSWORD=<contraseña segura>
EMAIL_FROM=noreply@lamegaecuador.com
EMAIL_TO_COMERCIAL=comercial@lamegaecuador.com
RESEND_API_KEY=<tu key de resend.com>
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=https://tu-proyecto.up.railway.app
```

### 5. Primer deploy

```bash
git push origin main  # Railway hace deploy automático
```

Luego en Railway Shell o en el build command:
```bash
npx prisma db push
```

### 6. Dominio personalizado

Railway → Settings → Networking → Custom Domain → `lamegaecuador.com`

---

## FastComet (cPanel + Node.js Passenger)

FastComet usa **Phusion Passenger** para ejecutar apps Node.js bajo Apache/Nginx. El proceso es persistente — SSE funciona correctamente.

### 1. Preparar el build localmente

```bash
npm run build
```

### 2. Subir los archivos

Sube **todo el proyecto** excepto `node_modules/` y `prisma/dev.db`:

```
.next/          (build output)
app/
components/
lib/
prisma/
public/
package.json
package-lock.json
next.config.mjs
tsconfig.json
```

Puedes usar el File Manager de cPanel o rsync/SFTP:

```bash
rsync -avz --exclude='node_modules' --exclude='prisma/dev.db' \
  ./ usuario@servidor.fastcomet.com:~/lamegaecuador.com/
```

### 3. Crear el entry point para Passenger

Crea `server.js` en la raíz del proyecto:

```javascript
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log("> La Mega web lista en puerto", process.env.PORT || 3000);
  });
});
```

### 4. Configurar la app Node.js en cPanel

1. cPanel → **Setup Node.js App**
2. Crear nueva aplicación:
   - **Node.js version:** 18.x o 20.x
   - **Application mode:** Production
   - **Application root:** `/home/usuario/lamegaecuador.com`
   - **Application URL:** `lamegaecuador.com`
   - **Application startup file:** `server.js`
3. Guardar → **Run NPM Install**

### 5. Variables de entorno

En cPanel → Node.js App → Edit → Environment Variables:

```
NODE_ENV=production
NEXT_PUBLIC_STREAM_URL=https://usa3.fastcast4u.com/proxy/lamega?mp=/stream
STREAM_URL=https://usa3.fastcast4u.com/proxy/lamega?mp=/stream
RADIO_API_KEY=...
DATABASE_URL=mysql://usuario:pass@localhost/lamega_db
ADMIN_USER=admin
ADMIN_PASSWORD=...
EMAIL_FROM=noreply@lamegaecuador.com
EMAIL_TO_COMERCIAL=comercial@lamegaecuador.com
RESEND_API_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://lamegaecuador.com
```

### 6. Base de datos en FastComet

FastComet ofrece MySQL. Actualiza `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Crea la base de datos en cPanel → MySQL Databases, luego:

```bash
npx prisma db push
```

### 7. Inicializar la base de datos

En la terminal SSH de FastComet:

```bash
cd ~/lamegaecuador.com
npm install --production
npx prisma generate
npx prisma db push
```

### 8. Reiniciar la app

cPanel → Node.js App → Restart.

---

## Vercel

> ⚠️ **Advertencia SSE:** En Vercel Edge/Serverless, el bus de eventos en memoria no se comparte entre instancias. Los eventos de la app Python pueden no propagarse a todos los clientes. Úsalo solo si la actualización en tiempo real no es crítica o si implementas un pub/sub externo (Redis, Pusher, Ably).

### Deploy básico

1. Importar repo en [vercel.com](https://vercel.com)
2. Framework preset: **Next.js** (autodetectado)
3. Definir todas las variables de entorno
4. PostgreSQL: usa Vercel Postgres, Neon o Supabase en `DATABASE_URL`
5. Actualizar `prisma/schema.prisma` a `provider = "postgresql"`
6. Build command (ya en `package.json`): `prisma generate && next build`

---

## Actualizaciones en producción

```bash
# Local: hacer los cambios, commit y push
git add -A && git commit -m "descripción del cambio"
git push origin main

# Railway / Render: deploy automático en cada push a main

# FastComet: rsync + reiniciar en cPanel
rsync -avz --exclude='node_modules' --exclude='prisma/dev.db' \
  ./ usuario@servidor:~/lamegaecuador.com/
# Luego en cPanel → Node.js App → Restart
```

Si hay cambios en el schema de Prisma:

```bash
npx prisma db push  # dev/staging
npx prisma migrate deploy  # producción (con migraciones)
```

---

## Checklist de despliegue

- [ ] `npm run build` pasa sin errores
- [ ] Variables de entorno configuradas (todas las de `.env.example`)
- [ ] `NEXTAUTH_SECRET` generado con `openssl rand -hex 32`
- [ ] `NEXTAUTH_URL` apunta a la URL pública real (con `https://`)
- [ ] Base de datos inicializada con `npx prisma db push`
- [ ] Login en `/admin/login` funciona con las credenciales del `.env`
- [ ] Player de audio carga y reproduce el stream
- [ ] Now playing se actualiza automáticamente cada 15 s
- [ ] Formulario `/pide` envía y crea registros en la DB
- [ ] SSE: abrir `/api/radio/events` en el navegador devuelve `event: snapshot`
- [ ] App Python conecta y el dashboard refleja los cambios en tiempo real
