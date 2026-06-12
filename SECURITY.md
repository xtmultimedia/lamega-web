# Política de seguridad — La Mega 99.9 FM

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad de seguridad en este proyecto, por favor **no la publiques en Issues públicos**. Repórtala directamente a:

📧 **megacontacto@yahoo.com** con el asunto `[SEGURIDAD] descripción breve`

Responderemos en un plazo máximo de 72 horas.

## Versiones con soporte

| Versión | Soporte |
|---|---|
| 1.1.x | ✅ Activo |
| 1.0.x | ⚠️ Solo parches críticos |

## Buenas prácticas implementadas

### Autenticación
- Dashboard `/admin` protegido con NextAuth.js (sesión `httpOnly`)
- `NEXTAUTH_SECRET` debe generarse con `openssl rand -hex 32` — nunca reusar entre entornos
- API de automatización protegida con `X-Radio-API-Key` usando `crypto.timingSafeEqual` (resistente a timing attacks)

### Variables de entorno
- Secretos en `.env` — nunca en el código
- `.env` está en `.gitignore` — nunca se commitea
- `.env.example` solo contiene placeholders, sin secretos reales

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
