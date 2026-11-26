# 003 — Feedback al pulsar en los botones de acción

- **Status**: DONE (aplicado y verificado por Luca en Chrome el 26/11/2026)
- **Commit**: e9f6739 (con cambios sin commitear del 26/11; ejecutar **después** del plan 001, que crea los tokens)
- **Severity**: MEDIUM
- **Category**: Physicality & feedback
- **Estimated scope**: 6 archivos, 1 línea de clases en cada uno

## Problem

Los botones de acción tienen hover (`hover:scale-[1.03]`) pero **ninguno responde al pulsar**. El botón fijo de móvil, el más tocado porque el tráfico es móvil, no tiene ni transición. (El hover ya está bien: Tailwind 4 lo compila dentro de `@media (hover:hover)`, así que no se dispara en táctil; no hay nada que arreglar ahí.)

Clases actuales (localiza por contenido, los números de línea pueden variar):

```html
<!-- src/components/Navbar.astro:33 -->
class="titulo hidden rounded-lg bg-verde px-5 py-3 text-xs text-aubergine transition-transform hover:scale-[1.03] sm:inline-block"

<!-- src/components/Hero.astro:22 -->
class="titulo rounded-lg bg-verde px-7 py-4 text-sm text-aubergine transition-transform hover:scale-[1.03]"

<!-- src/components/TresCosas.astro:36 -->
class="titulo inline-block shrink-0 rounded-lg bg-verde px-7 py-4 text-sm text-aubergine transition-transform hover:scale-[1.03]"

<!-- src/components/EjemploAuditoria.astro:135 -->
class="titulo mt-10 inline-block rounded-lg bg-verde px-7 py-4 text-sm text-aubergine transition-transform hover:scale-[1.03]"

<!-- src/components/Cierre.astro:20 -->
class="titulo mt-9 inline-block rounded-lg bg-verde px-8 py-5 text-base text-aubergine transition-transform hover:scale-[1.03]"

<!-- src/components/BotonMovil.astro:9 — sin transición -->
class="titulo block rounded-lg bg-verde py-4 text-center text-sm text-aubergine"
```

## Target

Pulsar encoge el botón a `scale(0.97)` en 150 ms con la curva fuerte `cubic-bezier(0.23, 1, 0.32, 1)` (la utilidad `ease-out` de Tailwind pasa a ser esa curva gracias al plan 001). Mismo tratamiento en los 6 botones.

```html
<!-- target: sustituir "transition-transform hover:scale-[1.03]" por -->
transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.97]

<!-- target BotonMovil (no tiene hover; solo prensa) -->
transition-transform duration-150 ease-out active:scale-[0.97]
```

`active:` va después de `hover:` en el orden de variantes de Tailwind, así que al pulsar con ratón gana `0.97` sobre `1.03`.

## Repo conventions to follow

- Toda la web usa clases utilitarias de Tailwind directamente en el markup, sin CSS aparte para botones. Sigue igual.
- Exemplar de botón correcto tras el cambio: `src/components/Hero.astro` (botón «Pedir mini-auditoría gratis»).
- `duration-150` equivale a `--duration-press: 150ms` (token del plan 001); Tailwind no tiene espacio de nombres para duraciones, por eso se usa la utilidad.

## Steps

1. En `Navbar.astro`, `Hero.astro`, `TresCosas.astro`, `EjemploAuditoria.astro` y `Cierre.astro`: dentro del atributo `class` del enlace de acción, reemplaza exactamente `transition-transform hover:scale-[1.03]` por `transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.97]`. Un solo reemplazo por archivo (comprueba que solo hay uno con `grep -n "hover:scale" src/components/*.astro`: deben ser 5 resultados antes y 5 después).
2. En `BotonMovil.astro`, al final de las clases del `<a>` añade `transition-transform duration-150 ease-out active:scale-[0.97]` → `class="titulo block rounded-lg bg-verde py-4 text-center text-sm text-aubergine transition-transform duration-150 ease-out active:scale-[0.97]"`.

## Boundaries

- Do NOT cambiar `hover:scale-[1.03]` ni los colores, tamaños o textos.
- Do NOT tocar los enlaces de texto (Navbar, pie, «Cómo trabajamos ↓»): solo los 6 botones verdes.
- Do NOT cambiar la estructura HTML ni añadir JavaScript.
- Do NOT añadir dependencias.
- Si algún botón no coincide con lo descrito (deriva), PARA y avisa.

## Verification

- **Mecánica**: `npm run build` → sin errores, 4 páginas. `grep -c "active:scale-\[0.97\]" dist/index.html` → `1` o más y `grep -o "duration-150" dist/index.html` presente.
- **Feel check** (`npm run dev`):
  - Escritorio: mantener pulsado un botón → se encoge ligeramente (se nota, pero no «salta»); al soltar vuelve rápido, sin rebote.
  - Spamear clics en el botón del hero: nunca se reinicia desde cero (son transiciones, se reorientan).
  - Móvil real o emulación táctil: pulsar el botón fijo inferior da feedback visible. Si en iOS Safari no se aprecia, es una limitación de `:active` en ese navegador; anótalo, no añadas JS.
  - DevTools → Animations 10 %: la escala va de 1 a 0,97 sin sobrepasar.
  - Reduced motion: el feedback de escala se mantiene (es pequeño y aporta comprensión); no hace falta ocultarlo.
- **Done when**: los 6 botones tienen `active:scale-[0.97]` con `duration-150 ease-out`, y el botón móvil tiene transición.
