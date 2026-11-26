# Planes de movimiento — web de Cliqo

Auditoría del 26/11/2026 sobre el commit `e9f6739` (con los cambios sin commitear de ese día). Cada plan es autónomo: se puede ejecutar con `/animate` o con cualquier agente.

| # | Plan | Severidad | Estado |
| --- | --- | --- | --- |
| 001 | [Intro una vez por sesión y más corta + tokens de movimiento](001-intro-una-vez-y-mas-corta.md) | HIGH | DONE |
| 002 | [«CLIQO» con opacity + transform en vez de letter-spacing](002-intro-palabra-sin-layout.md) | MEDIUM | DONE |
| 003 | [Feedback al pulsar en los 6 botones](003-botones-feedback-al-pulsar.md) | MEDIUM | DONE |
| 004 | [Entrada escalonada del hero](004-hero-entrada-escalonada.md) | MEDIUM | DONE |

## Orden recomendado

1. **001** primero: crea los tokens (`--ease-out`, `--duration-*`) y el script de «una vez por sesión».
2. **002** después (mismo archivo, `Intro.astro`; no ejecutar en paralelo con 001).
3. **003** (solo clases de botones; necesita los tokens de 001).
4. **004** el último: amplía el script de 001 y toca `Hero.astro`. Es el que conviene pulir con `/frontend-design`.

## Dependencias

- 002 → 001 (mismo archivo)
- 003 → 001 (la utilidad `ease-out` pasa a ser la curva fuerte)
- 004 → 001 (script y tokens)

## Hallazgos de la auditoría que no tienen plan (por decisión)

- Diana con giro de 200° y rebote (`cubic-bezier(0.18, 1.1, 0.3, 1)`): es gusto de marca; se deja como está. Si se quiere sobriedad, plan nuevo.
- Tokens de movimiento: se crean dentro del plan 001.
- Teclado durante la intro (`inert`): pierde importancia con 001.
- FAQ con altura animada y botón móvil que entra al salir el del hero: oportunidades B y C, pendientes.
