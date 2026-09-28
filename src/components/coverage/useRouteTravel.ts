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

  // Pre-cálculo: longitud total y posición de cada punto sobre la ruta
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const snap = opts.snap ?? 22;
    const samples = 240;
    const pointLens: { id: string; at: number }[] = [];
    for (const p of opts.points) {
      let best = { d: Infinity, at: 0 };
      for (let i = 0; i <= samples; i++) {
        const at = (i / samples) * len;
        const q = path.getPointAtLength(at);
        const d = Math.hypot(q.x - p.at[0], q.y - p.at[1]);
        if (d < best.d) best = { d, at };
      }
      if (best.d <= snap) pointLens.push({ id: p.id, at: best.at });
    }
    state.current.len = len;
    state.current.pointLens = pointLens;
    traveledRef.current?.setAttribute("stroke-dasharray", `${len}`);
    traveledRef.current?.setAttribute("stroke-dashoffset", `${len}`);
    if (!opts.enabled) {
      // Movimiento reducido: estado final estático
      setActive(new Set(pointLens.map((p) => p.id)));
      place(len, len);
    }
  }, [pathRef, opts.enabled, opts.points]);

  function place(at: number, len: number) {
    const path = pathRef.current;
    if (!path || !len) return;
    const q = path.getPointAtLength(at);
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
