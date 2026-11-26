// Construcción del correo en formato MIME (texto plano, UTF-8). Módulo puro, sin
// dependencias de Cloudflare, para poder probarlo fuera del Worker.

const CRLF = "\r\n";

/** Quita saltos de línea y caracteres de control: evita la inyección de cabeceras. */
export function limpiaCabecera(valor: string): string {
  return valor.replace(/[\r\n\u0000-\u001f\u007f]+/g, " ").trim();
}

export function aBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

/** Cabecera con texto no ASCII codificada (RFC 2047). */
export function cabeceraCodificada(texto: string): string {
  const limpio = limpiaCabecera(texto);
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7e]*$/.test(limpio) ? limpio : `=?UTF-8?B?${aBase64(limpio)}?=`;
}

function envuelve(base64: string, ancho = 76): string {
  const lineas: string[] = [];
  for (let i = 0; i < base64.length; i += ancho) lineas.push(base64.slice(i, i + ancho));
  return lineas.join(CRLF);
}

export interface DatosCorreo {
  de: string; // remitente (dirección del dominio con Email Routing)
  para: string; // destino verificado
  nombre: string;
  correo: string; // correo de quien escribe (va en Reply-To)
  mensaje: string;
  origen?: string; // URL de la página, para el registro
  ahora?: Date;
  idMensaje?: string;
}

export function construyeCorreo(d: DatosCorreo): string {
  const nombre = limpiaCabecera(d.nombre);
  const correo = limpiaCabecera(d.correo);
  const ahora = d.ahora ?? new Date();
  const dominio = d.de.split("@")[1] ?? "cliqo.es";
  const id = d.idMensaje ?? `${crypto.randomUUID()}@${dominio}`;

  const cuerpo = [
    "Nuevo mensaje desde el formulario de la web de Cliqo.",
    "",
    `Nombre: ${nombre}`,
    `Correo: ${correo}`,
    "",
    "Mensaje:",
    d.mensaje.trim(),
    "",
    "---",
    `Recibido: ${ahora.toISOString()}`,
    d.origen ? `Página: ${d.origen}` : "",
  ]
    .filter((l, i, arr) => !(l === "" && i === arr.length - 1))
    .join(CRLF);

  const cabeceras = [
    `From: ${cabeceraCodificada("Cliqo web")} <${limpiaCabecera(d.de)}>`,
    `To: ${limpiaCabecera(d.para)}`,
    `Reply-To: ${cabeceraCodificada(nombre)} <${correo}>`,
    `Subject: ${cabeceraCodificada(`Diagnóstico gratis: mensaje de ${nombre}`)}`,
    `Date: ${ahora.toUTCString()}`,
    `Message-ID: <${id}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "X-Cliqo-Formulario: contacto",
  ].join(CRLF);

  return `${cabeceras}${CRLF}${CRLF}${envuelve(aBase64(cuerpo))}${CRLF}`;
}
