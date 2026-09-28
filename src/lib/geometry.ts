import type { Point } from "@/types";

/** Convierte puntos en una curva suave (Catmull-Rom → Bézier cúbica) para rutas SVG. */
export function smoothPath(points: Point[], tension = 0.5): string {
  if (points.length < 2) return "";
  const p = points;
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const t = tension / 3;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Polígono cerrado con esquinas suavizadas. */
export function smoothPolygon(points: Point[]): string {
  const n = points.length;
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const cur = points[i];
    const next = points[(i + 1) % n];
    const a = mid(prev, cur);
    const b = mid(cur, next);
    d += `${i === 0 ? `M${a[0]} ${a[1]}` : ""} Q${cur[0]} ${cur[1]} ${b[0]} ${b[1]}`;
  }
  return `${d} Z`;
}

export function centroid(points: Point[]): Point {
  const s = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y] as Point, [0, 0] as Point);
  return [s[0] / points.length, s[1] / points.length];
}
