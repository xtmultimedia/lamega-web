# Auto-deploy con GitHub Actions → FastComet (SSH/rsync) — Diseño

**Fecha:** 2026-06-14
**Estado:** Aprobado

## Objetivo

Que cada `git push` a `main` despliegue automáticamente a FastComet, estilo Railway.
Hoy el deploy es manual (build local → subir tarball por File Manager → extraer →
restart). El server no puede compilar (el build de Next crashea por los límites del
host), así que la compilación se hace en un runner de GitHub.

## Decisiones (confirmadas)

- Transporte: **SSH + rsync**.
- Credenciales: **el asistente genera la llave y carga los secrets por `gh`**; el
  **usuario autoriza la llave pública en cPanel** (cambio de control de acceso = dueño).

## Flujo

`push` a `main` → runner `ubuntu-latest`:
1. `actions/checkout`
2. `actions/setup-node` (Node 22, con cache npm)
3. `npm ci`
4. `npm run build` (salida `.next/standalone`)
5. Ensamblar (checkout limpio → sin bug de `public` anidado):
   `cp -r .next/static .next/standalone/.next/static`
   `cp -r public .next/standalone/public`
6. Configurar SSH: escribir `FASTCOMET_SSH_KEY` a `~/.ssh/id_ed25519` (chmod 600),
   `ssh-keyscan -p $PORT $HOST >> known_hosts`.
7. **rsync** (protege `.env` y subidas de usuarios):
   ```
   rsync -az --delete --exclude='.env' --exclude='public/uploads' \
     -e "ssh -p $FASTCOMET_SSH_PORT -o StrictHostKeyChecking=yes" \
     .next/standalone/ \
     $FASTCOMET_SSH_USER@$FASTCOMET_SSH_HOST:/home/producci/lamegaecuador.com/.next/standalone/
   ```
8. Restart: `ssh … "touch /home/producci/lamegaecuador.com/tmp/restart.txt"`.
9. Smoke-test: `curl -fsS -o /dev/null -w '%{http_code}' https://lamegaecuador.com`
   (espera 200; falla el job si no) + chequeo de `/api/station`.

## Workflow

`.github/workflows/deploy.yml`:
- `on: { push: { branches: [main] }, workflow_dispatch: {} }`
- `concurrency: { group: deploy-production, cancel-in-progress: true }` — nunca dos
  deploys/restarts simultáneos (seguridad NPROC).
- Un solo job `deploy`. Path del server **fijo** en el workflow (no secreto):
  `/home/producci/lamegaecuador.com`.

## Secrets (vía `gh secret set`, nunca en chat ni repo)

| Secret | Valor |
|---|---|
| `FASTCOMET_SSH_HOST` | `s12771.usc1.stableserver.net` |
| `FASTCOMET_SSH_PORT` | puerto SSH de FastComet (a confirmar en cPanel → SSH Access) |
| `FASTCOMET_SSH_USER` | `producci` |
| `FASTCOMET_SSH_KEY` | llave privada de deploy (ed25519, sin passphrase) |

## Llave de deploy

- Generar `ssh-keygen -t ed25519 -N "" -C "github-actions-deploy" -f ./deploy_key`.
- Privada (`deploy_key`) → `gh secret set FASTCOMET_SSH_KEY < deploy_key`.
- Pública (`deploy_key.pub`) → usuario la autoriza en **cPanel → SSH Access → Manage SSH
  Keys → Import Key** (pegar la pública) → **Manage → Authorize**.
- Borrar `deploy_key`/`deploy_key.pub` locales tras cargarlos.
- Revocable: borrar la llave autorizada en cPanel.

## Protecciones / seguridad

- `--exclude='.env'` → el `.env` de producción nunca se pisa.
- `--exclude='public/uploads'` → las subidas de usuarios (`/api/admin/upload`) no se borran
  con `--delete`.
- `tmp/` está fuera de `standalone/`, no lo afecta el rsync.
- Llave de deploy dedicada, sin passphrase (necesario en CI), revocable.
- `concurrency` evita restarts solapados.

## A confirmar en cPanel durante el setup (en el navegador, con el usuario)

- Que el plan tenga **SSH Access** habilitado.
- El **puerto SSH** (FastComet suele usar uno custom) → va al secret `FASTCOMET_SSH_PORT`.
- Autorizar la llave pública.

## Fallback

Si el jailed shell de FastComet no tiene `rsync`, el workflow cae a
`tar -czf - -C .next standalone | ssh … "tar -xzf - -C ~/lamegaecuador.com/.next"`
(se documenta; no se implementa salvo que haga falta).

## Verificación

- `gh secret list` muestra los 4 secrets.
- La llave pública aparece **Authorized** en cPanel.
- Disparar deploy manual (`workflow_dispatch`) → job en verde.
- El paso de smoke-test devuelve 200; `https://lamegaecuador.com` sirve el build.
- Confirmar que `.env` y `public/uploads` del server siguen intactos tras el deploy.

## Fuera de alcance

Staging, rollback automático, deploys por rama, notificaciones. Se pueden añadir luego.
