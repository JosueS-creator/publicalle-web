import { useId, type SVGProps } from "react";
import { m, useReducedMotion } from "motion/react";
import { VehicleShape } from "@/components/vehicle/VehicleSilhouette";
import { LogoDefs } from "./LogoDefs";
import {
  LOGO_CAR_TRANSFORM,
  LOGO_P_BODY,
  LOGO_P_FOLD,
  LOGO_P_RIBBON,
  LOGO_P_SHINE,
  LOGO_SOUND_ORIGIN,
  LOGO_SPEED_LINES,
  MARK_VIEWBOX,
} from "./logoPaths";

const EASE = [0.22, 1, 0.36, 1] as const;

export type MarkTheme = "light" | "dark";

export type PublicalleMarkProps = {
  /** Fondo sobre el que se usa: ajusta brillo y contraste. */
  theme?: MarkTheme;
  /** Versión monocromática (currentColor). El vehículo se dibuja con `knockout`. */
  mono?: boolean;
  knockout?: string;
  /** Vehículo real dentro de la P. `false` = P sola. */
  withVehicle?: boolean;
  /** < 40px: sin ventanas, sin líneas de velocidad ni ondas. */
  compact?: boolean;
  /** Animación de entrada (~1.5 s). Respeta prefers-reduced-motion. */
  animate?: boolean;
  /** Se usa solo dentro de <PublicalleLogo />. */
  embedded?: boolean;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "children">;

/** Contenido del símbolo (reutilizado por el logo completo). */
export function MarkContent({
  uid,
  theme = "dark",
  mono = false,
  knockout = "#fff",
  withVehicle = true,
  compact = false,
  animate = false,
}: Required<Pick<PublicalleMarkProps, "theme" | "mono" | "knockout" | "withVehicle" | "compact" | "animate">> & { uid: string }) {
  const f = (id: string) => (mono ? "currentColor" : `url(#${id}-${uid})`);
  const carColor = mono ? knockout : "var(--publicalle-white)";
  const screen = mono ? "currentColor" : `url(#gt-${uid})`;
  const init = <T,>(v: T) => (animate ? v : false);

  return (
    <>
      <defs>
        {!mono && <LogoDefs uid={uid} theme={theme} />}
        <clipPath id={`cb-${uid}`}>
          <m.rect x="50" width="520" initial={init({ y: 760, height: 0 })} animate={{ y: 240, height: 520 }} transition={{ duration: 0.6, ease: EASE }} />
        </clipPath>
        <clipPath id={`cr-${uid}`}>
          <m.rect y="240" height="520" initial={init({ x: 560, width: 0 })} animate={{ x: 50, width: 520 }} transition={{ delay: 0.25, duration: 0.7, ease: EASE }} />
        </clipPath>
      </defs>

      {!compact &&
        LOGO_SPEED_LINES.map(([x, y, w], i) => (
          <m.rect
            key={y}
            y={y}
            height={13}
            rx={6.5}
            fill={f("gt")}
            initial={init({ x: x + w, width: 0 })}
            animate={{ x, width: w }}
            transition={{ delay: 0.85 + i * 0.08, duration: 0.5, ease: EASE }}
          />
        ))}

      <g clipPath={`url(#cb-${uid})`}>
        <path d={LOGO_P_BODY} fill={f("gn")} />
        {!mono && <path d={LOGO_P_BODY} fill={`url(#gs-${uid})`} />}
      </g>
      <g clipPath={`url(#cr-${uid})`}>
        <path d={LOGO_P_RIBBON} fill={f("gt")} />
        {!mono && (
          <>
            <path d={LOGO_P_FOLD} fill={`url(#gf-${uid})`} opacity={0.85} />
            <path d={LOGO_P_SHINE} fill="#BFFFF4" opacity={0.35} />
          </>
        )}
      </g>

      {withVehicle && (
        <m.g initial={init({ x: -70, opacity: 0 })} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }}>
          <g transform={LOGO_CAR_TRANSFORM}>
            <VehicleShape maskId={`mv-${uid}`} detailed={!compact} bodyColor={carColor} screenColor={screen} />
          </g>
          {!compact && (
            <m.g
              stroke={f("gt")}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
              initial={init({ opacity: 0 })}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.25, duration: 0.4 }}
            >
              {/* ondas del parlante (perifoneo) */}
              <path d={`M${LOGO_SOUND_ORIGIN.x + 3} ${LOGO_SOUND_ORIGIN.y - 12} l14 -10`} />
              <path d={`M${LOGO_SOUND_ORIGIN.x + 5} ${LOGO_SOUND_ORIGIN.y} l18 -1`} />
              <path d={`M${LOGO_SOUND_ORIGIN.x + 3} ${LOGO_SOUND_ORIGIN.y + 12} l14 9`} />
            </m.g>
          )}
        </m.g>
      )}
    </>
  );
}

/** <PublicalleMark /> — la P del logo aprobado con la silueta real del vehículo. */
export function PublicalleMark({
  theme = "dark",
  mono = false,
  knockout = "#fff",
  withVehicle = true,
  compact = false,
  animate = false,
  title = "Publicalle",
  ...rest
}: PublicalleMarkProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  return (
    <svg viewBox={MARK_VIEWBOX} role="img" aria-label={title || undefined} aria-hidden={title ? undefined : true} {...rest}>
      <MarkContent
        uid={uid}
        theme={theme}
        mono={mono}
        knockout={knockout}
        withVehicle={withVehicle}
        compact={compact}
        animate={animate && !reduce}
      />
    </svg>
  );
}
