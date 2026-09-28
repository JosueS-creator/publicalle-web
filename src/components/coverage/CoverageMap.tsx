import { useId, useMemo, useRef, useState } from "react";
import { m, useInView, useReducedMotion } from "motion/react";
import type { CoverageDataset } from "@/types";
import { centroid, smoothPath, smoothPolygon } from "@/lib/geometry";
import { CoveragePoint } from "./CoveragePoint";
import { MAP_AVENUES, MAP_CONTOURS, MAP_RIVER, MAP_STREETS, MAP_VIEWBOX } from "./mapBase";
import { RouteAnimation } from "./RouteAnimation";
import { cn } from "@/lib/cn";

export type CoverageMapProps = {
  data: CoverageDataset;
  /** Ruta que recorre el vehículo. */
  vehicleRouteId?: string;
  showVehicle?: boolean;
  showZones?: boolean;
  /** Mostrar las demás rutas (no solo la del vehículo). */
  showAllRoutes?: boolean;
  highlightZone?: string | null;
  showLabels?: boolean;
  /** Retraso (s) antes de dibujar la ruta — secuencia del hero. */
  drawDelay?: number;
  /** Segundos por recorrido del vehículo. */
  lapDuration?: number;
  fit?: "meet" | "slice";
  className?: string;
  title?: string;
};

/**
 * <CoverageMap /> — territorio + movimiento + cobertura.
 * Muestra zonas, rutas, puntos y un vehículo. Datos desacoplados (src/data/coverage.ts).
 */
export function CoverageMap({
  data,
  vehicleRouteId,
  showVehicle = true,
  showZones = true,
  showAllRoutes = true,
  highlightZone = null,
  showLabels = true,
  drawDelay = 0.2,
  lapDuration = 18,
  fit = "meet",
  className,
  title = "Mapa ilustrativo de cobertura",
}: CoverageMapProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<SVGSVGElement>(null);
  const inView = useInView(wrapRef, { margin: "0px 0px -10% 0px" });
  const onceInView = useInView(wrapRef, { once: true, margin: "0px 0px -10% 0px" });

  const route = data.routes.find((r) => r.id === vehicleRouteId) ?? data.routes[0];
  const routeD = useMemo(() => (route ? smoothPath(route.points) : ""), [route]);
  const others = useMemo(
    () => (showAllRoutes && route ? data.routes.filter((r) => r.id !== route.id).map((r) => ({ id: r.id, d: smoothPath(r.points) })) : []),
    [data.routes, route, showAllRoutes],
  );
  const zones = useMemo(() => data.zones.map((z) => ({ ...z, d: smoothPolygon(z.coordinates), c: centroid(z.coordinates) })), [data.zones]);

  const drawDuration = 1.6;
  const [activePoints, setActivePoints] = useState<Set<string>>(() => new Set());
  const draw = reduce ? false : { pathLength: 0, opacity: 0 };
  const drawn = onceInView || reduce ? { pathLength: 1, opacity: 1 } : undefined;

  const points = data.points.map((p, i) => (
    <CoveragePoint
      key={p.id}
      x={p.at[0]}
      y={p.at[1]}
      active={activePoints.has(p.id) || ((!showVehicle || !route) && (onceInView || reduce))}
      highlighted={!!highlightZone && p.zoneId === highlightZone}
      label={showLabels ? p.label : undefined}
      labelSide={p.at[0] > 760 ? "left" : i % 2 ? "left" : "right"}
      delay={!route && !reduce ? drawDelay + i * 0.12 : 0}
    />
  ));

  return (
    <svg
      ref={wrapRef}
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      preserveAspectRatio={fit === "slice" ? "xMidYMid slice" : "xMidYMid meet"}
      className={cn("block h-full w-full", className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={`zone-${uid}`} cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="var(--publicalle-green)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--publicalle-blue)" stopOpacity="0.06" />
        </radialGradient>
        <linearGradient id={`route-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--publicalle-blue-electric)" />
          <stop offset="1" stopColor="var(--publicalle-green-light)" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`fade-${uid}`} cx="55%" cy="50%" r="65%">
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`vign-${uid}`}>
          <rect width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} fill={`url(#fade-${uid})`} />
        </mask>
      </defs>

      {/* Base cartográfica */}
      <g mask={`url(#vign-${uid})`} aria-hidden>
        <path d={MAP_CONTOURS} fill="none" stroke="rgb(148 170 220 / 0.08)" strokeWidth="1" />
        <path d={MAP_STREETS} fill="none" stroke="rgb(148 170 220 / 0.075)" strokeWidth="1" />
        <path d={MAP_RIVER} fill="none" stroke="rgb(58 168 240 / 0.14)" strokeWidth="10" strokeLinecap="round" />
        {MAP_AVENUES.map((d) => (
          <path key={d} d={d} fill="none" stroke="rgb(148 170 220 / 0.16)" strokeWidth="2.5" strokeLinecap="round" />
        ))}
      </g>

      {/* Zonas */}
      {showZones &&
        zones.map((z) => {
          const hl = highlightZone === z.id;
          return (
            <g key={z.id}>
              <m.path
                d={z.d}
                fill={z.active ? `url(#zone-${uid})` : "transparent"}
                stroke={hl ? "var(--publicalle-green-light)" : z.active ? "rgb(34 201 180 / 0.35)" : "rgb(148 170 220 / 0.3)"}
                strokeWidth={hl ? 2 : 1}
                strokeDasharray={z.active ? undefined : "5 6"}
                initial={false}
                animate={{ opacity: highlightZone && !hl ? 0.35 : 1, scale: hl ? 1.03 : 1 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
              {showLabels && hl && (
                <m.text
                  x={z.c[0]}
                  y={z.c[1]}
                  textAnchor="middle"
                  fontSize="13"
                  fontFamily="var(--font-mono)"
                  fill="var(--publicalle-white)"
                  initial={{ opacity: 0, y: z.c[1] + 6 }}
                  animate={{ opacity: 1, y: z.c[1] }}
                  style={{ paintOrder: "stroke", stroke: "var(--publicalle-background)", strokeWidth: 4 }}
                >
                  {z.name}
                </m.text>
              )}
            </g>
          );
        })}

      {/* Rutas secundarias */}
      {others.map((r, i) => (
        <m.path
          key={r.id}
          d={r.d}
          fill="none"
          stroke="rgb(58 168 240 / 0.45)"
          strokeWidth="2"
          strokeDasharray="2 7"
          strokeLinecap="round"
          initial={draw}
          animate={drawn}
          transition={{ delay: drawDelay + 0.6 + i * 0.25, duration: drawDuration, ease: "easeInOut" }}
        />
      ))}

      {/* Ruta del vehículo + puntos + vehículo */}
      {route ? (
      <RouteAnimation
        d={routeD}
        start={route.points[0]}
        points={data.points}
        inView={inView}
        reveal={onceInView}
        reduceMotion={reduce}
        showVehicle={showVehicle}
        drawDelay={drawDelay}
        drawDuration={drawDuration}
        lapDuration={lapDuration}
        gradientId={`route-${uid}`}
        glowId={`glow-${uid}`}
        onActivePointsChange={setActivePoints}
      >
        {points}
      </RouteAnimation>
      ) : (
        points
      )}
    </svg>
  );
}
