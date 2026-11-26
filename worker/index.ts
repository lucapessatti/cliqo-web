// Worker de Cloudflare: sirve la web estática (dist) y atiende solo POST /api/contacto.
// Envía el mensaje del formulario por correo con el binding `send_email` (Email Routing).
// Configuración (ver README): wrangler.toml declara el binding EMAIL; el secreto CONTACT_TO
// (el buzón verificado en Email Routing) se añade en el panel de Cloudflare, no en el código.
import { EmailMessage } from "cloudflare:email";
import { procesaContacto, type Entorno } from "./contact";

interface Env extends Entorno {
  EMAIL: { send(mensaje: EmailMessage): Promise<void> };
}

const json = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/api/contacto") return new Response("No encontrado", { status: 404 });
    if (request.method !== "POST") {
      return new Response("Método no permitido", { status: 405, headers: { Allow: "POST" } });
    }

    const resultado = await procesaContacto(request, env, async (de, para, mime) => {
      await env.EMAIL.send(new EmailMessage(de, para, mime));
    });

    const quiereJson = (request.headers.get("accept") ?? "").includes("application/json");
    if (quiereJson) {
      return resultado.ok ? json({ ok: true }) : json({ ok: false, error: resultado.error }, resultado.estado);
    }
    // Envío sin JavaScript: se vuelve a la página con el resultado.
    return Response.redirect(`${url.origin}/contacto/?${resultado.ok ? "ok" : "error"}=1`, 303);
  },
};
