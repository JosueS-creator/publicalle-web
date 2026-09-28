import type { Point } from "@/types";
import { smoothPath } from "@/lib/geometry";

/**
 * Base cartográfica ESTILIZADA (no es un mapa real): calles, avenidas, río y curvas de nivel.
 * Determinista para que servidor/cliente y cada render produzcan lo mismo.
 */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const W = 1000;
const H = 620;

function buildStreets(): string {
  const r = rng(7);
  let d = "";
  // retícula de calles con ligera deformación (tejido urbano)
  for (let x = 20; x < W; x += 38 + Math.round(r() * 14)) {
    const skew = (r() - 0.5) * 30;
    d += `M${x} 0 L${(x + skew).toFixed(0)} ${H} `;
  }
  for (let y = 18; y < H; y += 34 + Math.round(r() * 12)) {
    const skew = (r() - 0.5) * 24;
    d += `M0 ${y} L${W} ${(y + skew).toFixed(0)} `;
  }
  return d;
}

const avenues: Point[][] = [
  [[0, 560], [180, 500], [330, 470], [470, 480], [640, 430], [820, 380], [1000, 330]],
  [[120, 0], [180, 140], [260, 250], [330, 330], [420, 420], [470, 620]],
  [[560, 0], [590, 120], [630, 240], [700, 360], [760, 480], [800, 620]],
  [[0, 250], [140, 230], [300, 200], [520, 190], [760, 150], [1000, 90]],
];

const river: Point[] = [[0, 360], [120, 390], [240, 372], [360, 402], [470, 450], [560, 540], [620, 620]];

function contours(cx: number, cy: number, rx: number, ry: number, rings: number, seed: number): string {
  const r = rng(seed);
  let d = "";
  for (let k = 1; k <= rings; k++) {
    const pts: Point[] = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const j = 0.85 + r() * 0.3;
      pts.push([cx + Math.cos(a) * rx * (k / rings) * j, cy + Math.sin(a) * ry * (k / rings) * j]);
    }
    pts.push(pts[0], pts[1]);
    d += smoothPath(pts, 0.9) + " ";
  }
  return d;
}

export const MAP_VIEWBOX = { width: W, height: H };
export const MAP_STREETS = buildStreets();
export const MAP_AVENUES = avenues.map((a) => smoothPath(a));
export const MAP_RIVER = smoothPath(river);
export const MAP_CONTOURS = contours(90, 80, 180, 120, 6, 3) + contours(930, 560, 200, 140, 6, 11) + contours(980, 40, 120, 90, 4, 5);
