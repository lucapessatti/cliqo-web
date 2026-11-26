// Lógica del formulario de contacto: validación, protección básica contra abuso y envío.
// El envío real se inyecta (`enviar`), así se puede probar sin Cloudflare.
import { construyeCorreo } from "./mime";

export const LIMITES = { nombre: 100, correo: 200, mensaje: 3000, mensajeMin: 10 } as const;

export interface Entorno {
  /** Dirección de destino, verificada en Email Routing. Va como secreto: NO se guarda en el repositorio. */
  CONTACT_TO?: string;
  /** Remitente. Por defecto contacto@cliqo.es (dirección del dominio con Email Routing). */
  CONTACT_FROM?: string;
}

export type Resultado =
  | { ok: true }
  | { ok: false; estado: number; error: "origen" | "datos" | "config" | "envio" };

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function procesaContacto(
  peticion: Request,
  env: Entorno,
  enviar: (de: string, para: string, mime: string) => Promise<void>,
): Promise<Resultado> {
  const url = new URL(peticion.url);

  // Solo se acepta desde la propia web (frena envíos desde otros sitios).
  const origen = peticion.headers.get("origin");
  if (origen && origen !== url.origin) return { ok: false, estado: 403, error: "origen" };

  let datos: FormData;
  try {
    datos = await peticion.formData();
  } catch {
    return { ok: false, estado: 400, error: "datos" };
  }

  // Campo trampa: si lo rellena un bot, se responde "ok" sin enviar nada.
  if (String(datos.get("web") ?? "").trim() !== "") return { ok: true };

  const nombre = String(datos.get("nombre") ?? "").trim();
  const correo = String(datos.get("correo") ?? "").trim();
  const mensaje = String(datos.get("mensaje") ?? "").trim();
  const acepta = datos.get("privacidad") !== null && String(datos.get("privacidad")) !== "";

  if (
    !nombre || nombre.length > LIMITES.nombre ||
    !correo || correo.length > LIMITES.correo || !REGEX_CORREO.test(correo) ||
    mensaje.length < LIMITES.mensajeMin || mensaje.length > LIMITES.mensaje ||
    !acepta
  ) {
    return { ok: false, estado: 400, error: "datos" };
  }

  const para = env.CONTACT_TO?.trim();
  if (!para) return { ok: false, estado: 500, error: "config" };
  const de = env.CONTACT_FROM?.trim() || "contacto@cliqo.es";

  try {
    await enviar(de, para, construyeCorreo({ de, para, nombre, correo, mensaje, origen: url.origin + "/contacto/" }));
    return { ok: true };
  } catch {
    return { ok: false, estado: 502, error: "envio" };
  }
}
