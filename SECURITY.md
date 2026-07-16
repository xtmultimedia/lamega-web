# Política de seguridad — La Mega 99.9 FM

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad de seguridad en este proyecto, por favor **no la publiques en Issues públicos**. Repórtala directamente a:

📧 **megacontacto@yahoo.com** con el asunto `[SEGURIDAD] descripción breve`

Responderemos en un plazo máximo de 72 horas.

## Versiones con soporte

| Versión | Soporte |
|---|---|
| 1.3.x | ✅ Activo |
| 1.2.x | ⚠️ Solo parches críticos |
| ≤ 1.1.x | ❌ Sin soporte |

## Buenas prácticas implementadas

### Autenticación
- Dashboard `/admin` protegido con NextAuth.js (sesión `httpOnly`)
- `NEXTAUTH_SECRET` debe generarse con `openssl rand -hex 32` — nunca reusar entre entornos
- API de automatización protegida con `X-Radio-API-Key` usando `crypto.timingSafeEqual` (resistente a timing attacks)

### Variables de entorno
- Secretos en `.env` — nunca en el código
- `.env` está en `.gitignore` — nunca se commitea
- `.env.example` solo contiene placeholders, sin secretos reales

### Contenido publicado (EL MEGÁFONO) — XSS
El cuerpo de las notas se escribe como HTML en un editor visual y se renderiza en
la web pública con `dangerouslySetInnerHTML`. Ese es el único punto del sitio
donde entra HTML de terceros, y se trata así:

- **Se sanitiza en el SERVIDOR y al GUARDAR** (`lib/sanitize.ts`), nunca al
  renderizar: la base de datos sólo contiene marcado limpio, y ninguna vista
  futura puede olvidarse de sanitizar.
- **Lista blanca estricta**: sólo `p, br, hr, h2-h4, strong, em, u, s, ul, ol, li,
  blockquote, a[href], img[src,alt]`. Se descarta todo lo demás —
  `script`/`iframe`/`object`/`embed`/`form`, los atributos `style`/`class`/`id` y
  cualquier manejador `on*`.
- **Esquemas permitidos**: sólo `http`, `https`, `mailto`, `tel`. Sin `data:` (un
  `data:` puede transportar un SVG con `<script>` adentro) y sin URLs
  protocol-relative (`//host`).
- **Imágenes**: sólo `/uploads/...` propias. Una URL externa permitiría incrustar
  un rastreador de terceros en la web pública.
- **Enlaces salientes**: con `rel="noopener noreferrer"` obligatorio.
- Editores y admins son cuentas de confianza, pero **"de confianza" no es un
  límite de seguridad**: una cuenta se puede phishear y un pegado puede traer
  marcado que su autor nunca miró.
- `lib/sanitize.ts` lleva `import "server-only"`: si `sanitize-html` llegara al
  bundle del navegador sería peso muerto y, sobre todo, evitable por el atacante.

### Datos de usuario
- Formularios validados con `zod` en el servidor
- Sin datos sensibles en parámetros de URL
- Emails de leads gestionados por Resend (no almacena contraseñas ni datos de pago)

### API
- Todos los endpoints de automatización requieren `X-Radio-API-Key`
- El SSE (`/api/radio/events`) es público de solo lectura — no expone datos sensibles
- Cuerpos de request limitados por Next.js (protección básica contra payloads gigantes)

## Checklist de seguridad antes de desplegar

- [ ] `NEXTAUTH_SECRET` es único y generado con `openssl rand -hex 32`
- [ ] `ADMIN_PASSWORD` no es la del `.env.example` (`lamega999`)
- [ ] `RADIO_API_KEY` es una cadena aleatoria segura (mínimo 32 caracteres)
- [ ] `RESEND_API_KEY` solo tiene permisos para el dominio `lamegaecuador.com`
- [ ] `NEXTAUTH_URL` apunta a la URL real con `https://`
- [ ] El archivo `.env` no está en el repositorio (`git status` no lo muestra)
- [ ] La base de datos de producción no es accesible públicamente (solo desde el servidor)
- [ ] HTTPS activo en el dominio (FastComet incluye Let's Encrypt)
