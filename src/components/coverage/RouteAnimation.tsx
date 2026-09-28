import { useEffect, useRef, type ReactNode } from "react";
import { m } from "motion/react";
import type { CoveragePointData, Point } from "@/types";
import { VehicleShape } from "@/components/vehicle/VehicleSilhouette";
import { VEHICLE_BOUNDS } from "@/assets/vehicles/silhouette";
import { useRouteTravel } from "./useRouteTravel";

export type RouteAnimationProps = {
  /** Trazo SVG de la ruta. */
  d: string;
  start: Point;
  /** Puntos que se activan al pasar el vehículo. */
  points: CoveragePointData[];
  inView: boolean;
  /** Dibujar la ruta (true al entrar en pantalla por primera vez). */
  reveal: boolean;
  reduceMotion: boolean;
  showVehicle?: boolean;
  drawDelay?: number;
  drawDuration?: number;
  lapDuration?: number;
  /** ids de gradiente/filtro definidos por el SVG contenedor. */
  gradientId: string;
  glowId: string;
  onActivePointsChange?: (ids: Set<string>) => void;
  /** Capa entre la ruta y el vehículo (p. ej. los puntos de cobertura). */
  children?: ReactNode;
};

/**
 * <RouteAnimation /> — se dibuja la ruta, aparece el vehículo, recorre la ruta
 * (estela luminosa) y reporta qué puntos de cobertura va activando. Se usa dentro de un <svg>.
 */
export function RouteAnimation({
  d,
  start,
  points,
  inView,
  reveal,
  reduceMotion,
  showVehicle = true,
  drawDelay = 0.2,
  drawDuration = 1.6,
  lapDuration = 18,
  gradientId,
  glowId,
  onActivePointsChange,
  children,
}: RouteAnimationProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const travel = useRouteTravel(pathRef, inView, {
    enabled: !reduceMotion && showVehicle,
    duration: lapDuration,
    delay: drawDelay + drawDuration * 0.7,
    points,
  });

  const cb = useRef(onActivePointsChange);
  cb.current = onActivePointsChange;
  useEffect(() => cb.current?.(travel.activePoints), [travel.activePoints]);

  const carW = 46;
  const s = carW / VEHICLE_BOUNDS.width;
  const carH = VEHICLE_BOUNDS.height * s;

  return (
    <g>
      <m.path
        ref={pathRef}
        d={d}
        fill="none"
        stroke="rgb(148 170 220 / 0.35)"
        strokeWidth="2.5"
        strokeDasharray="1 9"
        strokeLinecap="round"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={reveal || reduceMotion ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ delay: drawDelay, duration: drawDuration, ease: "easeInOut" }}
      />
      {showVehicle && (
        <>
          <path ref={travel.traveledRef} d={d} fill="none" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" opacity="0.55" strokeDasharray="100000" strokeDashoffset="100000" />
          <path ref={travel.trailRef} d={d} fill="none" stroke="var(--publicalle-green-light)" strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} strokeDasharray="0 100000" />
        </>
      )}

      {children}

      {showVehicle && (
        <g
          ref={travel.markerRef}
          style={{ opacity: travel.started ? 1 : 0, transition: "opacity .5s ease" }}
          transform={`translate(${start[0]} ${start[1]})`}
        >
          <circle r="16" fill="var(--publicalle-green)" opacity="0.18" />
          <circle r="5" fill="var(--publicalle-green-light)" filter={`url(#${glowId})`} />
          <g transform="translate(0 -24)">
            <g ref={travel.carRef}>
              <rect x={-carW / 2 - 7} y={-carH / 2 - 5} width={carW + 14} height={carH + 10} rx={8} fill="rgb(5 10 23 / 0.85)" stroke="rgb(70 227 207 / 0.5)" />
              <g transform={`translate(${carW / 2 + VEHICLE_BOUNDS.x * s} ${-carH / 2 - VEHICLE_BOUNDS.y * s}) scale(${-s} ${s})`}>
                <VehicleShape maskId={`rc-${gradientId}`} detailed={false} bodyColor="var(--publicalle-white)" screenColor="var(--publicalle-green)" />
              </g>
            </g>
          </g>
        </g>
      )}
    </g>
  );
}
