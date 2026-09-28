import { useId, type SVGProps } from "react";
import {
  VEHICLE_BODY_PATH,
  VEHICLE_BOUNDS,
  VEHICLE_SCREEN,
  VEHICLE_SCREEN_GAP,
  VEHICLE_WHEELS,
  VEHICLE_WINDOWS,
} from "@/assets/vehicles/silhouette";

export type VehicleSilhouetteProps = {
  facing?: "left" | "right";
  /** Muestra ventanas recortadas (usar en tamaños > 48px). */
  detailed?: boolean;
  bodyColor?: string;
  screenColor?: string;
  /** Si se pasa, el SVG es accesible con ese título; si no, es decorativo. */
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "children">;

/** Contenido interno reutilizable (también lo usa PublicalleMark). Coordenadas del frame original. */
export function VehicleShape({
  maskId,
  detailed = true,
  bodyColor = "currentColor",
  screenColor = "var(--publicalle-green)",
}: {
  maskId: string;
  detailed?: boolean;
  bodyColor?: string;
  screenColor?: string;
}) {
  return (
    <>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="500">
          <rect width="900" height="500" fill="#fff" />
          {detailed && VEHICLE_WINDOWS.map((d) => <path key={d} d={d} fill="#000" />)}
          {VEHICLE_WHEELS.map((w) => (
            <circle key={w.cx} cx={w.cx} cy={w.cy} r={w.arch} fill="#000" />
          ))}
          <rect {...VEHICLE_SCREEN_GAP} fill="#000" />
        </mask>
      </defs>
      <path d={VEHICLE_BODY_PATH} fill={bodyColor} mask={`url(#${maskId})`} />
      {VEHICLE_WHEELS.map((w) => (
        <circle key={w.cx} cx={w.cx} cy={w.cy} r={w.r} fill={bodyColor} />
      ))}
      <rect {...VEHICLE_SCREEN} fill={screenColor} data-part="screen" />
    </>
  );
}

/** Silueta real del vehículo Publicalle como SVG escalable. */
export function VehicleSilhouette({
  facing = "right",
  detailed = true,
  bodyColor,
  screenColor,
  title,
  ...rest
}: VehicleSilhouetteProps) {
  const maskId = `veh-${useId().replace(/:/g, "")}`;
  const { x, y, width, height } = VEHICLE_BOUNDS;
  const flip = facing === "right" ? `translate(${2 * x + width} 0) scale(-1 1)` : undefined;
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      <g transform={flip}>
        <VehicleShape maskId={maskId} detailed={detailed} bodyColor={bodyColor} screenColor={screenColor} />
      </g>
    </svg>
  );
}

/** Ícono compacto del vehículo (sin ventanas) para chips, marcadores y listas. */
export function VehicleIcon(props: Omit<VehicleSilhouetteProps, "detailed">) {
  return <VehicleSilhouette detailed={false} {...props} />;
}
