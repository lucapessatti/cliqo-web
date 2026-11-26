# Cliqo — Web

Web de Cliqo: análisis de datos, marketing digital y mejora de procesos para negocios locales.
Astro + Tailwind v4. Una sola página y una sola acción: pedir el diagnóstico gratis, que lleva al formulario de contacto.

Antes de tocar nada lee `WEB-BRIEF.md` (en `MEMORIA PROYECTO/08-web-brief.md`): objetivo, identidad, textos definitivos y pendientes.

## Desarrollo

```bash
npm install      # instalar dependencias
npm run dev      # servidor local en http://localhost:4321
npm run build    # generar la web en /dist
npm run preview  # previsualizar el build
```

`npm run dev` sirve solo la web. El envío del formulario necesita el Worker (ver más abajo); en local, si el envío falla, la página ofrece el enlace de respaldo que abre el correo.

## Despliegue (Cloudflare)

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** 20 (`.nvmrc`)
- Dominio: `cliqo.es` (Cloudflare).
- `wrangler.toml` declara el Worker (`worker/index.ts`): sirve la web estática y atiende solo `POST /api/contacto`.

## Formulario de contacto (nombre, correo y mensaje)

Todos los botones de acción llevan a `/contacto`. El formulario envía el mensaje por correo con el Worker y el binding `send_email` de Cloudflare (Email Routing). **Hay que hacer esto una vez en Cloudflare, o el envío mostrará el aviso de error con el enlace de respaldo:**

1. Email Routing de `cliqo.es` debe estar activo (ya lo está) y el buzón de destino debe figurar como **dirección de destino verificada**.
2. En Cloudflare: *Workers y Pages → cliqo-web → Configuración → Variables y secretos* → añadir el **secreto `CONTACT_TO`** con ese buzón verificado. No se guarda en el repositorio a propósito.
3. Opcional: `CONTACT_FROM` (remitente). Por defecto `contacto@cliqo.es`, que es una dirección del dominio con Email Routing.
4. Desplegar. El binding `EMAIL` ya está en `wrangler.toml`.

Qué hace el Worker: comprueba que la petición viene de la propia web, valida nombre (máx. 100), correo y mensaje (10 a 3000 caracteres), exige la casilla de privacidad, descarta bots con un campo trampa, evita la inyección de cabeceras y responde en JSON (con JavaScript) o redirige a `/contacto/?ok=1` o `?error=1` (sin JavaScript).

Pruebas de la lógica (fuera de Cloudflare): `worker/contact.ts` y `worker/mime.ts` no dependen de Cloudflare.

## Pendiente tras publicar

- Secreto `CONTACT_TO` en Cloudflare (ver arriba) y un envío de prueba desde `/contacto`.
- Revisión de `/aviso-legal` y `/privacidad` por un gestor. Los datos del titular están en `src/config.ts` (`TITULAR`).

Decisiones ya tomadas (26/11/2026):
- WhatsApp **no se muestra** en la web; solo lo usa Luca cuando contacta primero.
- Instagram: `@cliqo.es`.
- Plazo del diagnóstico: máximo 3 días laborables (FAQ y formulario).

## Estructura

- `src/pages/` — `index.astro`, `contacto`, `aviso-legal`, `privacidad`, `404`
- `src/components/` — secciones de la página (Hero, TresCosas, QueHacemos, ComoTrabajamos, EjemploDiagnostico, Servicios, QuienesSomos, FAQ, Cierre…) y `FlowButton.astro` (botón de acción)
- `src/config.ts` — constantes: contacto (`CTA_URL`, `EMAIL`), titular legal (`TITULAR`), flags (`SHOW_PRICES`, `SHOW_PEOPLE_PHOTOS`)
- `src/styles/global.css` — tokens de marca y de movimiento
- `worker/` — Worker de Cloudflare del formulario de contacto
- `public/` — favicon, `robots.txt`, `sitemap.xml`
