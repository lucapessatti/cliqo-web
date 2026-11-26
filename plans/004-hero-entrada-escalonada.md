# 004 — Entrada escalonada del hero (diana, titular, subtítulo, botón)

- **Status**: DONE (aplicado y verificado por Luca en Chrome el 26/11/2026)
- **Commit**: e9f6739 (con cambios sin commitear del 26/11; ejecutar **después** de 001, que crea los tokens y el script de sesión)
- **Severity**: MEDIUM (oportunidad)
- **Category**: Missed opportunities
- **Estimated scope**: 2 archivos (`src/components/Hero.astro`, `src/components/Intro.astro`), ~45 líneas

## Problem

El hero no tiene entrada propia: aparece de golpe cuando la intro se desvanece. Con el plan 001 la intro solo sale en la primera visita de la sesión, así que en el resto de cargas el hero aparecería sin ningún movimiento. El hero es lo primero que ve un visitante que llega desde Instagram: aquí sí compensa una entrada corta.

```astro
<!-- src/components/Hero.astro:7-29 — actual -->
<section id="inicio" class="bg-aubergine text-crema">
  <div class="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14">
    <Diana clase="h-9 w-9 text-verde" />

    <h1 class="titulo mt-8 max-w-5xl text-[clamp(2.5rem,8.5vw,6.25rem)] text-crema">
      Te decimos qué te está costando clientes. Con datos.
    </h1>

    <p class="mt-8 max-w-xl text-lg leading-relaxed text-crema/85">
      Consultoría para negocios locales de Torrent y alrededores. Analizamos tu
      negocio y lo contamos con buena imagen.
    </p>

    <div class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
      <a ...>Pedir mini-auditoría gratis</a>
      <a ...>Cómo trabajamos ↓</a>
    </div>
  </div>
</section>
```

## Target

Cuatro bloques entran con fundido + `translateY(12px)`, curva `cubic-bezier(0.23, 1, 0.32, 1)` (`var(--ease-out)`), duración 450 ms (`var(--duration-enter)`), con retrasos **no uniformes** 0 / 80 / 160 / 260 ms (el botón llega un poco más tarde, que es lo que se quiere que mire el ojo). Solo CSS, sin librerías.

Cuándo arranca:
- **Primera visita de la sesión**: cuando la intro empieza a desvanecerse (en `finish()`).
- **Visitas siguientes**: de inmediato (no hay intro).
- **Movimiento reducido**: solo fundido de 200 ms, sin desplazamiento.
- **Sin JavaScript**: el hero se ve entero desde el principio (la clase `js` solo la pone un script).
- **Red de seguridad**: pase lo que pase, a los 2500 ms el hero se muestra.

## Repo conventions to follow

- Tokens `--ease-out` y `--duration-enter` creados en el plan 001 (`src/styles/global.css`).
- Mismo patrón que `Intro.astro`: CSS escrito a mano en el `<style>` del componente, `@keyframes` con nombre propio, selectores de `<html>` con `:global(...)`.
- El script inline que decide «una vez por sesión» ya existe tras el plan 001 en `Intro.astro`; aquí se **amplía**, no se duplica.

## Steps

1. `src/components/Hero.astro`, sustituye el markup del bloque interior por (clases existentes intactas; solo se añade `hero-in` y `style="--d: …"`):
   ```astro
   <div class="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14">
     <div class="hero-in" style="--d: 0ms">
       <Diana clase="h-9 w-9 text-verde" />
     </div>

     <h1 class="hero-in titulo mt-8 max-w-5xl text-[clamp(2.5rem,8.5vw,6.25rem)] text-crema" style="--d: 80ms">
       Te decimos qué te está costando clientes. Con datos.
     </h1>

     <p class="hero-in mt-8 max-w-xl text-lg leading-relaxed text-crema/85" style="--d: 160ms">
       Consultoría para negocios locales de Torrent y alrededores. Analizamos tu
       negocio y lo contamos con buena imagen.
     </p>

     <div class="hero-in mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style="--d: 260ms">
       <!-- los dos <a> actuales, sin cambios -->
     </div>
   </div>
   ```
2. `src/components/Hero.astro`, añade al final del archivo un bloque `<style>`:
   ```astro
   <style>
     /* Solo se oculta si hay JS (el script pone html.js); sin JS el hero se ve entero. */
     :global(html.js:not(.hero-go)) .hero-in {
       opacity: 0;
     }
     :global(html.hero-go) .hero-in {
       animation: hero-in var(--duration-enter) var(--ease-out) var(--d, 0ms) both;
     }
     @keyframes hero-in {
       from { opacity: 0; transform: translateY(12px); }
     }
     @media (prefers-reduced-motion: reduce) {
       :global(html.hero-go) .hero-in {
         animation-name: hero-fade;
         animation-duration: 200ms;
       }
       @keyframes hero-fade {
         from { opacity: 0; }
       }
     }
   </style>
   ```
3. `src/components/Intro.astro`, **sustituye** el `<script is:inline>` que dejó el plan 001 por esta versión ampliada:
   ```astro
   <script is:inline>
     (function () {
       var root = document.documentElement;
       root.classList.add("js");
       var seen = false;
       try {
         seen = !!sessionStorage.getItem("cliqo-intro");
         if (!seen) sessionStorage.setItem("cliqo-intro", "1");
       } catch (e) {}
       // Visita repetida: sin intro y el hero entra de inmediato.
       if (seen) root.classList.add("intro-skip", "hero-go");
       // Red de seguridad: pase lo que pase, el hero se muestra.
       setTimeout(function () { root.classList.add("hero-go"); }, 2500);
     })();
   </script>
   ```
4. `src/components/Intro.astro`, en el `<script>` de módulo, dentro de `const finish = () => { … }`, añade como **primera línea** `document.documentElement.classList.add("hero-go");`, de modo que quede:
   ```js
         const finish = () => {
           document.documentElement.classList.add("hero-go");
           intro.classList.add("done");
           document.body.style.overflow = "";
           setTimeout(() => intro.remove(), 300);
         };
   ```
   (así el clic para saltar la intro también lanza la entrada del hero al instante).

## Boundaries

- Do NOT animar ninguna otra sección, el Navbar ni el botón fijo de móvil.
- Do NOT usar IntersectionObserver ni animaciones al hacer scroll (el brief permite «como mucho una entrada suave»).
- Do NOT cambiar textos, colores, tamaños ni márgenes del hero.
- Do NOT añadir dependencias ni `will-change`.
- Do NOT usar retrasos uniformes; respeta 0 / 80 / 160 / 260 ms.
- Si el `<script is:inline>` o `finish` de `Intro.astro` no coinciden con lo que dejó el plan 001 (deriva), PARA y avisa.

## Verification

- **Mecánica**: `npm run build` → sin errores, 4 páginas. `grep -c "hero-in" dist/index.html` → al menos 4. Comprueba que `dist/index.html` contiene `classList.add("js")`.
- **Feel check** (`npm run dev`):
  - `sessionStorage.clear()` + recarga: la intro termina y, al empezar a desvanecerse, el hero sube y aparece en cascada (diana → titular → subtítulo → botón). No hay un hueco en blanco entre intro y hero.
  - Recarga otra vez: sin intro, el hero entra en cascada nada más cargar. Sin parpadeo de contenido visible antes de la animación.
  - Clic en la intro para saltarla: el hero entra de inmediato.
  - DevTools → Animations 10 %: cada bloque sube ~12 px y se asienta; el botón llega algo después que el resto; nada se desplaza al terminar (sin saltos de maquetación).
  - Rendering → reduced motion: el hero hace solo fundido corto, sin desplazamiento.
  - Desactivar JavaScript: el hero se ve completo desde el principio.
  - Móvil 375 px: el titular grande no provoca scroll horizontal durante la animación.
- **Done when**: el hero tiene entrada escalonada en primera visita y en visitas repetidas, respeta movimiento reducido, no oculta nada sin JS y el build pasa.
