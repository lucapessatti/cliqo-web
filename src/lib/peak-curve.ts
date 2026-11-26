// Curva del gráfico de ejemplo (PeakChart). Adaptado de un componente de React
// a TypeScript puro para usarlo desde Astro (frontmatter + script de cliente).
// Todos los datos de este archivo son FICTICIOS: se muestran siempre con la
// etiqueta «Ejemplo con datos ficticios».

/* Lienzo del gráfico (unidades del viewBox del SVG). */
export const W = 480;
export const H = 232;
export const X0 = 16;
export const X1 = 464;
export const TOP = 34;
export const BOTTOM = 196;

export interface Curve {
  ys: Float32Array; // un valor y por cada x entera de 0 a W
  peakX: number;
  peakIdx: number;
  n: number;
  lo: number;
  hi: number;
  baseY: number; // y del primer punto = línea base
}

/** Spline cúbico monótono (no se pasa nunca del valor máximo), muestreado una vez por unidad. */
export function buildCurve(data: number[]): Curve {
  const vals = data.length >= 2 ? data : data.length === 1 ? [data[0], data[0]] : [0, 0];
  const n = vals.length;
  let lo = Infinity;
  let hi = -Infinity;
  let pk = 0;
  for (let i = 0; i < n; i++) {
    if (vals[i] < lo) lo = vals[i];
    if (vals[i] > hi) {
      hi = vals[i];
      pk = i;
    }
  }
  const span = hi - lo || 1;
  const yv = vals.map((v) => (hi === lo ? (TOP + BOTTOM) / 2 : TOP + (1 - (v - lo) / span) * (BOTTOM - TOP)));
  const h = (X1 - X0) / (n - 1);
  const sl: number[] = [];
  for (let i = 0; i < n - 1; i++) sl.push((yv[i + 1] - yv[i]) / h);
  const m: number[] = [sl[0]];
  for (let i = 1; i < n - 1; i++) {
    const a = sl[i - 1];
    const b = sl[i];
    m.push((Math.sign(a) + Math.sign(b)) * Math.min(Math.abs(a), Math.abs(b), 0.25 * Math.abs(a + b)));
  }
  m.push(sl[n - 2]);
  const ys = new Float32Array(W + 1);
  for (let x = 0; x <= W; x++) {
    let y: number;
    if (x <= X0) y = yv[0] + (x - X0) * m[0];
    else if (x >= X1) y = yv[n - 1] + (x - X1) * m[n - 1];
    else {
      const t = (x - X0) / h;
      const i = Math.min(n - 2, Math.floor(t));
      const f = t - i;
      const f2 = f * f;
      const f3 = f2 * f;
      y =
        (2 * f3 - 3 * f2 + 1) * yv[i] +
        (f3 - 2 * f2 + f) * h * m[i] +
        (-2 * f3 + 3 * f2) * yv[i + 1] +
        (f3 - f2) * h * m[i + 1];
    }
    ys[x] = y;
  }
  return { ys, peakX: X0 + pk * h, peakIdx: pk, n, lo, hi, baseY: yv[0] };
}

export function curveY(ys: Float32Array, x: number): number {
  const xc = Math.max(0, Math.min(W, x));
  const i = Math.min(W - 1, Math.floor(xc));
  const f = xc - i;
  return ys[i] * (1 - f) + ys[i + 1] * f;
}

/** Trazo SVG de la curva entre x0 y x1. */
export function pathFrom(ys: Float32Array, x0: number, x1: number, step = 2): string {
  if (x1 - x0 < 0.5) return "";
  let d = `M${x0.toFixed(1)} ${curveY(ys, x0).toFixed(1)}`;
  for (let x = Math.ceil(x0 / step) * step; x < x1; x += step) {
    d += `L${x} ${ys[x].toFixed(1)}`;
  }
  d += `L${x1.toFixed(1)} ${curveY(ys, x1).toFixed(1)}`;
  return d;
}

/* Series de ejemplo: llamadas desde la ficha de Google de un negocio FICTICIO. */
export const SERIES = {
  semana: {
    label: "Semana",
    data: [12, 15, 14, 22, 31, 24, 19],
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  },
  mes: {
    label: "Mes",
    data: [54, 60, 57, 69, 66, 81, 93, 87, 78, 84, 75, 72, 81, 78, 75],
    labels: Array.from({ length: 15 }, (_, i) => `Día ${i * 2 + 1}`),
  },
  ano: {
    label: "Año",
    data: [58, 61, 57, 64, 70, 66, 73, 69, 80, 76, 84, 79],
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  },
} as const;

export type SeriesKey = keyof typeof SERIES;
