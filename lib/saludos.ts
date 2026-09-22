// XT Saludos — saludos y pedidos de canciones que salen al aire en XT Radio.
//
// Módulo PURO (lo importan componentes cliente). Los dos valores son públicos
// —van en el HTML del sitio igual—, por eso viven acá y no en un
// NEXT_PUBLIC_*: esas se incrustan en build-time y el CI compila sin el .env
// de producción (ver CLAUDE.md).
//
// Mientras `url` esté vacío, la sección de la home no se muestra y /pide
// sigue usando el formulario viejo: se puede desplegar el sitio antes que el
// buzón sin dejar nada roto a la vista.
export const SALUDOS = {
  url: "https://xt-saludos.xt-saludos.workers.dev",   // buzón XT Saludos en producción (sin barra final)
  estacion: "lamega",
} as const;

export function saludosActivo(): boolean {
  // http:// solo para el buzón local de desarrollo (wrangler dev).
  const urlOk = SALUDOS.url.startsWith("https://") || SALUDOS.url.startsWith("http://localhost:");
  return urlOk && SALUDOS.estacion.length > 0;
}
