// Configuración central de la web de Cliqo.
// Lo marcado como TODO se rellena cuando haya datos reales. No inventar.

// Dominio y correo públicos (ver MEMORIA PROYECTO/01-datos-de-la-empresa.md).
export const SITE_URL = "https://cliqo.es";
export const EMAIL = "contacto@cliqo.es";

// Acción principal: todos los botones llevan al formulario de contacto (nombre, correo
// y mensaje), que envía el mensaje por correo (ver worker/index.ts y el README).
// Decisión de Luca (26/11/2026): el WhatsApp NO se muestra en la web; solo lo usa Luca
// cuando contacta primero con el negocio.
export const CTA_URL = "/contacto";

// Asunto y texto de respaldo si el envío automático falla (se abre el correo del usuario).
export const ASUNTO_CONTACTO = "Diagnóstico gratis";

// Instagram: @cliqo.es
export const INSTAGRAM_USER = "cliqo.es";
export const INSTAGRAM_URL = INSTAGRAM_USER
  ? `https://instagram.com/${INSTAGRAM_USER}`
  : "";

// Mostrar precios en Servicios. Falso hasta que se decidan.
export const SHOW_PRICES = false;

// Mostrar fotos de personas en "Quiénes somos". Falso por ahora.
export const SHOW_PEOPLE_PHOTOS = false;

// Lema del pie. Sin ciudad a propósito: Cliqo atiende a negocios de cualquier localidad.
export const LEMA = "Consultoría para negocios locales";
