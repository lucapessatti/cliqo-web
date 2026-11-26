# 001 — Mostrar la intro una sola vez por sesión y acortarla a ~1,75 s

- **Status**: DONE (aplicado y verificado por Luca en Chrome el 26/11/2026)
- **Commit**: e9f6739 (el árbol de trabajo tiene cambios sin commitear del 26/11: `config.ts`, `FAQ.astro`, `Cierre.astro`, `Intro.astro` con el salvavidas CSS, etc. Este plan parte de ese estado)
- **Severity**: HIGH
- **Category**: Purpose & frequency (+ Cohesion & tokens)
- **Estimated scope**: 2 archivos (`src/styles/global.css`, `src/components/Intro.astro`), ~40 líneas

## Problem

La intro de carga (espiral + diana + «CLIQO») tapa la página entera en **cada carga** de `/`, también a quien vuelve o recarga. Dura 2750 ms más 650 ms de fundido de salida = **~3,4 s** hasta que se ve el hero. El tráfico viene sobre todo de Instagram en móvil y el brief (`MEMORIA PROYECTO/08-web-brief.md`) pide «como mucho una entrada suave» y que la página se entienda en 10 segundos.

Además la web no tiene tokens de movimiento: cada animación escribe su propia curva y duración.

```css
/* src/components/Intro.astro:43-45 — actual */
    transition: opacity 0.6s ease;
    /* Salvavidas sin JS: si el script no corre, el intro se retira solo. */
    animation: intro-failsafe 0.6s ease 3.4s forwards;
```

```css
/* src/components/Intro.astro:68-70 — actual */
    animation:
      intro-draw 1.3s ease-out forwards,
      intro-spiral-fade 0.5s ease 1.25s forwards;
```

```css
/* src/components/Intro.astro:84 — actual */
    animation: intro-pop 0.75s cubic-bezier(0.18, 1.1, 0.3, 1) 1.1s forwards;
```

```css
/* src/components/Intro.astro:97 — actual */
    animation: intro-word 0.8s ease 1.75s forwards;
```

```js
/* src/components/Intro.astro:112-130 (script) — actual */
  const intro = document.getElementById("intro");
  if (intro) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";
    const finish = () => {
      intro.classList.add("done");
      document.body.style.overflow = "";
      setTimeout(() => intro.remove(), 650);
    };
    if (reduce) {
      setTimeout(finish, 600);
    } else {
      const t = setTimeout(finish, 2750);
      intro.addEventListener("click", () => {
        clearTimeout(t);
        finish();
      });
    }
  }
```

## Target

Línea de tiempo de la **primera visita de la sesión** (ms):

| Elemento | Antes | Después |
| --- | --- | --- |
| Espiral dibuja | 0–1300 | 0–700, `var(--ease-out)` |
| Espiral se desvanece | 1250–1750 | 600–900 |
| Diana aparece (misma curva con rebote, no se toca) | 1100–1850 | 550–1050 |
| Palabra «CLIQO» | 1750–2550 | 900–1300, `var(--ease-out)` |
| Inicio del fundido de salida | 2750 | 1500 |
| Fin del fundido (hero visible) | 3400 | 1750 (fundido 250 ms, `var(--ease-out)`) |

En visitas posteriores de la misma sesión (recarga, volver desde `/aviso-legal`) la intro **no se muestra**. Con movimiento reducido el comportamiento sigue siendo `finish` a los 600 ms.

Tokens nuevos en `src/styles/global.css` (valores exactos, no aproximar):

```css
@theme static {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

:root {
  --duration-press: 150ms;
  --duration-enter: 450ms;
}
```

## Repo conventions to follow

- No existe ningún token de movimiento todavía; se crean aquí. Los colores y fuentes ya viven en un bloque `@theme` al principio de `src/styles/global.css:3-16`: añade el bloque nuevo justo debajo, con el mismo estilo (variables con prefijo `--`).
- Se usa `@theme static` (no `@theme`) para que Tailwind emita siempre las variables, porque `Intro.astro` las usa en CSS escrito a mano que Tailwind no escanea.
- Definir `--ease-out` en `@theme` sustituye la utilidad `ease-out` de Tailwind por la curva fuerte. Hoy ningún componente usa `ease-out`, así que no cambia nada existente.

## Steps

1. `src/styles/global.css`: añade, justo después del bloque `@theme { ... }` existente, el bloque `@theme static { --ease-out…; --ease-in-out…; }` y el bloque `:root { --duration-press: 150ms; --duration-enter: 450ms; }` del apartado Target.
2. `src/components/Intro.astro`, regla `.intro`: cambia `transition: opacity 0.6s ease;` por `transition: opacity 250ms var(--ease-out);` y `animation: intro-failsafe 0.6s ease 3.4s forwards;` por `animation: intro-failsafe 250ms var(--ease-out) 2.2s forwards;`. El salvavidas debe quedar claramente por detrás del `finish` de 1500 ms.
3. `src/components/Intro.astro`, regla `.spiral`: sustituye las dos animaciones por
   ```css
       animation:
         intro-draw 700ms var(--ease-out) forwards,
         intro-spiral-fade 300ms var(--ease-out) 600ms forwards;
   ```
4. `src/components/Intro.astro`, regla `.diana`: cambia solo duración y retraso → `animation: intro-pop 500ms cubic-bezier(0.18, 1.1, 0.3, 1) 550ms forwards;` (la curva con rebote **no se toca** en este plan).
5. `src/components/Intro.astro`, regla `.intro-word`: cambia solo la línea `animation` → `animation: intro-word 400ms var(--ease-out) 900ms forwards;` (los `@keyframes intro-word` y los valores iniciales de `letter-spacing`/`filter` se tocan en el plan 002, no aquí).
6. `src/components/Intro.astro`, añade al final del bloque `<style>` (antes de `@media (prefers-reduced-motion…)`):
   ```css
     :global(html.intro-skip) .intro {
       display: none;
     }
   ```
7. `src/components/Intro.astro`, inserta **justo antes** de `<div id="intro" class="intro" role="presentation">` este script (se ejecuta antes del primer pintado, así no hay parpadeo):
   ```astro
   <script is:inline>
     // Una sola vez por sesión: en visitas repetidas no se muestra la intro.
     try {
       if (sessionStorage.getItem("cliqo-intro")) {
         document.documentElement.classList.add("intro-skip");
       } else {
         sessionStorage.setItem("cliqo-intro", "1");
       }
     } catch (e) {}
   </script>
   ```
8. `src/components/Intro.astro`, sustituye el contenido del `<script>` final (el de módulo) por:
   ```js
     const intro = document.getElementById("intro");
     if (intro) {
       if (document.documentElement.classList.contains("intro-skip")) {
         intro.remove();
       } else {
         const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
         document.body.style.overflow = "hidden";
         const finish = () => {
           intro.classList.add("done");
           document.body.style.overflow = "";
           setTimeout(() => intro.remove(), 300);
         };
         if (reduce) {
           setTimeout(finish, 600);
         } else {
           const t = setTimeout(finish, 1500);
           intro.addEventListener("click", () => {
             clearTimeout(t);
             finish();
           });
         }
       }
     }
   ```
9. Actualiza el comentario de cabecera de `Intro.astro` para que diga que se muestra una vez por sesión y dura ~1,75 s.

## Boundaries

- Do NOT cambiar la curva con rebote de la diana ni su giro (`rotate(-200deg) scale(0.25)`): no está en este plan.
- Do NOT tocar `@keyframes intro-word`, `letter-spacing`, `padding-left` ni `filter` de `.intro-word` (plan 002).
- Do NOT tocar el bloque `@media (prefers-reduced-motion: reduce)` de `Intro.astro`.
- Do NOT cambiar `index.astro`, `Hero.astro` ni ningún otro componente.
- Do NOT añadir dependencias ni `localStorage` (debe ser `sessionStorage`, una vez por sesión).
- Si algún paso no coincide con el código que encuentras (deriva desde el commit), PARA y avisa en vez de improvisar.

## Verification

- **Mecánica**: `npm run build` desde `web-github/cliqo-web` → termina sin errores y genera 4 páginas. `grep -c "cliqo-intro" dist/index.html` → `1` o más.
- **Feel check** (`npm run dev`, http://localhost:4321):
  - Consola: `sessionStorage.clear()` y recarga → se ve la intro completa. El hero es visible del todo en ~1,75 s (antes ~3,4 s).
  - Recarga de nuevo → **no** aparece la intro y no hay parpadeo del fondo berenjena.
  - Abre `/aviso-legal` y vuelve a `/` → sin intro.
  - Clic durante la intro → se salta y se desvanece en ~250 ms.
  - DevTools → Animations → velocidad 10 %: la espiral se dibuja de dentro hacia fuera, la diana entra cuando la espiral ya casi está completa y «CLIQO» llega cuando la diana se asienta; nada se solapa de forma fea.
  - Rendering → «Emulate CSS prefers-reduced-motion: reduce» y `sessionStorage.clear()` + recarga → diana y palabra visibles sin movimiento y la intro desaparece a ~0,6 s + fundido.
  - Desactiva JavaScript (DevTools → Command menu → «Disable JavaScript») y recarga → la intro se retira sola a ~2,2 s.
- **Done when**: la intro solo aparece en la primera carga de la sesión, el hero queda visible a ~1,75 s, ninguna animación de la intro usa ya `ease` suelto ni duraciones de 0,6 s o más, y los tokens `--ease-out`, `--ease-in-out`, `--duration-press`, `--duration-enter` existen en `global.css`.
