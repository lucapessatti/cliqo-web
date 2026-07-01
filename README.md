# Cliqo — Web de la agencia

Sitio web de Cliqo, agencia de marketing digital para comercios locales de Torrent (Valencia).
Construido con [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com).

## Desarrollo

```bash
npm install      # instalar dependencias
npm run dev      # servidor local en http://localhost:4321
npm run build    # generar la web en /dist
npm run preview  # previsualizar el build
```

## Despliegue (Cloudflare Pages)

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** 20 (definida en `.nvmrc`)

## Estructura

- `src/pages/` — páginas (`index.astro`, `disenos.astro`)
- `src/components/` — componentes reutilizables (Hero, Navbar, Servicios, etc.)
- `src/layouts/` — plantilla base
- `src/styles/global.css` — estilos y tokens de marca
