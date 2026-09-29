import { useEffect, useRef, useState, type RefObject } from "react";
import { useAnimationFrame } from "motion/react";
import type { CoveragePointData } from "@/types";

type Options = {
  enabled: boolean;
  /** Segundos por recorrido completo. */
  duration: number;
  delay: number;
  points: CoveragePointData[];
  /** Distancia máx. (unidades del mapa) para considerar que un punto está sobre la ruta. */
  snap?: number;
};

type Travel = {
  markerRef: RefObject<SVGGElement | null>;
  carRef: RefObject<SVGGElement | null>;
  trailRef: RefObject<SVGPathElement | null>;
  traveledRef: RefObject<SVGPathElement | null>;
  activePoints: Set<string>;
  started: boolean;
};

const TRAIL = 150;

/**
 * Mueve un marcador a lo largo de un <path>. Primer recorrido: activa los puntos por los que pasa
 * (la cobertura se acumula). Después patrulla ida y vuelta. Actualiza el DOM por refs (sin re-render por frame).
 */
export function useRouteTravel(pathRef: RefObject<SVGPathElement | null>, inView: boolean, opts: Options): Travel {
  const markerRef = useRef<SVGGElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const traveledRef = useRef<SVGPathElement>(null);
  const [activePoints, setActive] = useState<Set<string>>(() => new Set());
  const [started, setStarted] = useState(false);
  const state = useRef({ len: 0, pointLens: [] as { id: string; at: number }[], elapsed: 0, lastX: 0, facing: 1, firstLapDone: false, activated: new Set<string>(), started: false });

  // Tabla de posiciones de la ruta: se mide UNA vez, en lotes pequeños (sin tareas largas en el hilo principal).
  // La animación interpola sobre esta tabla en vez de llamar a getPointAtLength en cada cuadro.
  const tabla = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    let cancel = false;
    const snap = opts.snap ?? 22;
    const N = 400;
    // 1) Cálculo directo de la curva (rutas de smoothPath: "M x y C … "), sin medir el DOM
    const directo = tablaBezier(path.getAttribute("d") ?? "", N);
    const len = directo ? directo.len : path.getTotalLength();
    const pts: { x: number; y: number }[] = directo ? directo.pts : [];
    const lote = () => {
      if (cancel) return;
      // 2) Respaldo: medir con el navegador en lotes pequeños (sin tareas largas)
      const fin = Math.min(pts.length + 8, N + 1);
      for (let i = pts.length; i < fin; i++) {
        const q = path.getPointAtLength((i / N) * len);
        pts.push({ x: q.x, y: q.y });
      }
      if (pts.length <= N) return void setTimeout(lote, 0);
      // listo: posición de cada punto de cobertura sobre la ruta
      const pointLens: { id: string; at: number }[] = [];
      for (const p of opts.points) {
        let best = { d: Infinity, at: 0 };
        pts.forEach((q, i) => {
          const d = Math.hypot(q.x - p.at[0], q.y - p.at[1]);
          if (d < best.d) best = { d, at: (i / N) * len };
        });
        if (best.d <= snap) pointLens.push({ id: p.id, at: best.at });
      }
      tabla.current = pts;
      state.current.len = len;
      state.current.pointLens = pointLens;
      traveledRef.current?.setAttribute("stroke-dasharray", `${len}`);
      traveledRef.current?.setAttribute("stroke-dashoffset", `${len}`);
      if (!opts.enabled) {
        // Movimiento reducido: estado final estático
        setActive(new Set(pointLens.map((p) => p.id)));
        place(len, len);
      }
    };
    lote();
    return () => {
      cancel = true;
    };
  }, [pathRef, opts.enabled, opts.points]);

  function punto(at: number, len: number) {
    const t = tabla.current;
    const f = Math.max(0, Math.min(1, at / len)) * (t.length - 1);
    const i = Math.floor(f);
    const a = t[i];
    const b = t[Math.min(i + 1, t.length - 1)];
    const k = f - i;
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  }

  function place(at: number, len: number) {
    if (!len || !tabla.current.length) return;
    const q = punto(at, len);
    markerRef.current?.setAttribute("transform", `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
    const s = state.current;
    const dx = q.x - s.lastX;
    if (Math.abs(dx) > 0.4) s.facing = dx >= 0 ? 1 : -1;
    s.lastX = q.x;
    carRef.current?.setAttribute("transform", `scale(${s.facing} 1)`);
    trailRef.current?.setAttribute("stroke-dasharray", `${TRAIL} ${len + TRAIL}`);
    trailRef.current?.setAttribute("stroke-dashoffset", `${-(at - TRAIL)}`);
    if (!s.firstLapDone) traveledRef.current?.setAttribute("stroke-dashoffset", `${len - at}`);
  }

  useAnimationFrame((_, delta) => {
    if (!opts.enabled || !inView) return;
    const s = state.current;
    if (!s.len) return;
    s.elapsed += Math.min(delta, 64) / 1000;
    const t = s.elapsed - opts.delay;
    if (t < 0) return;
    if (!s.started) {
      s.started = true;
      setStarted(true);
    }
    const lap = t / opts.duration;
    const phase = lap % 2;
    const progress = phase <= 1 ? phase : 2 - phase; // ida y vuelta
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const at = eased * s.len;
    place(at, s.len);
    if (!s.firstLapDone) {
      const newly = s.pointLens.filter((p) => p.at <= at + 4 && !s.activated.has(p.id));
      if (newly.length) {
        newly.forEach((n) => s.activated.add(n.id));
        setActive(new Set(s.activated));
      }
      if (lap >= 1) {
        s.firstLapDone = true;
        traveledRef.current?.setAttribute("stroke-dashoffset", "0");
      }
    }
  });

  return { markerRef, carRef, trailRef, traveledRef, activePoints, started: started || !opts.enabled };
}

/**
 * Tabla de N+1 puntos equidistantes a lo largo de una ruta "M x y (C x1 y1 x2 y2 x y)*".
 * Devuelve null si el trazo tiene otro formato (entonces se mide con el navegador).
 */
function tablaBezier(d: string, N: number): { pts: { x: number; y: number }[]; len: number } | null {
  const limpio = d.trim();
  if (!/^M[\d\s.,-]+(C[\d\s.,-]+)*$/.test(limpio)) return null;
  const n = (limpio.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  if (n.length < 8 || (n.length - 2) % 6 !== 0) return null;
  // Curva densa
  const denso: { x: number; y: number }[] = [{ x: n[0], y: n[1] }];
  for (let i = 2; i < n.length; i += 6) {
    const [x0, y0] = [denso[denso.length - 1].x, denso[denso.length - 1].y];
    const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6);
    for (let k = 1; k <= 48; k++) {
      const t = k / 48, u = 1 - t;
      denso.push({
        x: u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        y: u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      });
    }
  }
  // Largo acumulado y re-muestreo uniforme por distancia
  const acc = [0];
  for (let i = 1; i < denso.length; i++) acc.push(acc[i - 1] + Math.hypot(denso[i].x - denso[i - 1].x, denso[i].y - denso[i - 1].y));
  const len = acc[acc.length - 1];
  const pts: { x: number; y: number }[] = [];
  let j = 1;
  for (let i = 0; i <= N; i++) {
    const objetivo = (i / N) * len;
    while (j < acc.length - 1 && acc[j] < objetivo) j++;
    const seg = acc[j] - acc[j - 1] || 1;
    const k = (objetivo - acc[j - 1]) / seg;
    pts.push({ x: denso[j - 1].x + (denso[j].x - denso[j - 1].x) * k, y: denso[j - 1].y + (denso[j].y - denso[j - 1].y) * k });
  }
  return { pts, len };
}
