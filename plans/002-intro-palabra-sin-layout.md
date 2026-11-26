# 002 — Animar «CLIQO» con opacity + transform en vez de letter-spacing

- **Status**: DONE (aplicado y verificado por Luca en Chrome el 26/11/2026)
- **Commit**: e9f6739 (con cambios sin commitear del 26/11; ejecutar **después** del plan 001)
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 archivo (`src/components/Intro.astro`), ~12 líneas

## Problem

La palabra de la intro anima `letter-spacing` y `padding-left` (propiedades que recalculan el diseño en cada fotograma) y además un `filter: blur(8px)`. En móviles modestos eso es trabajo de layout + paint durante la parte más visible de la carga.

```css
/* src/components/Intro.astro:90-101 — actual (antes de aplicar el plan 001) */
  .intro-word {
    color: #fffdb4;
    font-size: clamp(1.6rem, 6vw, 2.75rem);
    opacity: 0;
    filter: blur(8px);
    letter-spacing: 0.4em;
    padding-left: 0.4em;
    animation: intro-word 0.8s ease 1.75s forwards;
  }
  @keyframes intro-word {
    to { opacity: 1; filter: blur(0); letter-spacing: 0.08em; padding-left: 0.08em; }
  }
```

```css
/* src/components/Intro.astro:103-109 — actual */
  @media (prefers-reduced-motion: reduce) {
    .spiral, .diana, .intro-word { animation: none; }
    .diana { opacity: 1; transform: none; }
    .intro-word { opacity: 1; filter: none; letter-spacing: 0.08em; padding-left: 0.08em; }
    .spiral { opacity: 0; }
  }
```

## Target

La palabra entra desde 8 px más abajo, con fundido y un desenfoque pequeño, y ya nace con su `letter-spacing` final (sin animarlo). La línea `animation` ya la dejó el plan 001 como `intro-word 400ms var(--ease-out) 900ms forwards`; **no la cambies**.

```css
/* target */
  .intro-word {
    color: #fffdb4;
    font-size: clamp(1.6rem, 6vw, 2.75rem);
    opacity: 0;
    transform: translateY(8px);
    filter: blur(2px);
    letter-spacing: 0.08em;
    padding-left: 0.08em;
    animation: intro-word 400ms var(--ease-out) 900ms forwards;
  }
  @keyframes intro-word {
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
```

Y en el bloque de movimiento reducido:

```css
    .intro-word { opacity: 1; filter: none; transform: none; }
```

## Repo conventions to follow

- Los tokens `--ease-out` y compañía los creó el plan 001 en `src/styles/global.css`; aquí solo se consumen.
- Mismo estilo que el resto de `Intro.astro`: CSS escrito a mano en el `<style>` del componente, con `@keyframes` de nombre propio (`intro-word`).

## Steps

1. `src/components/Intro.astro`: en `.intro-word`, sustituye `filter: blur(8px); letter-spacing: 0.4em; padding-left: 0.4em;` por `transform: translateY(8px); filter: blur(2px); letter-spacing: 0.08em; padding-left: 0.08em;` (en ese orden, tras `opacity: 0;`). No toques la línea `animation`.
2. En `@keyframes intro-word`, deja solo `to { opacity: 1; transform: translateY(0); filter: blur(0); }`.
3. En el `@media (prefers-reduced-motion: reduce)`, cambia la línea de `.intro-word` por `.intro-word { opacity: 1; filter: none; transform: none; }`.

## Boundaries

- Do NOT cambiar duración, retraso ni curva de la animación de la palabra (los fijó el plan 001).
- Do NOT tocar `.spiral`, `.diana`, `.intro`, el `<script>` ni el markup.
- Do NOT subir el blur por encima de 2 px ni añadir `will-change`.
- Do NOT añadir dependencias.
- Si el código no coincide con lo descrito (deriva), PARA y avisa.

## Verification

- **Mecánica**: `npm run build` → sin errores, 4 páginas. `grep -n "letter-spacing" src/components/Intro.astro` → solo aparecen valores fijos `0.08em` (no hay `0.4em` ni `letter-spacing` dentro de `@keyframes`).
- **Feel check** (`npm run dev`, `sessionStorage.clear()` y recarga):
  - «CLIQO» sube suavemente unos 8 px mientras aparece; las letras **no se abren ni se cierran** como antes.
  - DevTools → Animations → 10 %: no hay salto de posición al terminar (el `padding-left: 0.08em` mantiene la palabra centrada igual que antes).
  - Performance → grabar la carga con CPU 4× slowdown: no aparecen barras largas de *Layout* durante la aparición de la palabra.
  - Si a 100 % se ve plano comparado con la versión anterior, es una decisión de gusto: avisa en lugar de subir el blur.
  - Rendering → reduced motion: la palabra está visible, sin desplazamiento.
- **Done when**: no hay `letter-spacing` ni `padding-left` en los keyframes de la intro, la palabra se ve centrada y el build pasa.
