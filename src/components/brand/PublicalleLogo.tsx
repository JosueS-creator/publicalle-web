import { useId, type SVGProps } from "react";
import { m, useReducedMotion } from "motion/react";
import { MarkContent, type MarkTheme } from "./PublicalleMark";
import { LOGO_HN, LOGO_VIEWBOX, LOGO_WORDMARK } from "./logoPaths";
import { brand } from "@/config/brand";

export type PublicalleLogoProps = {
  theme?: MarkTheme;
  mono?: boolean;
  knockout?: string;
  withVehicle?: boolean;
  /** Mostrar "HN." */
  withHN?: boolean;
  animate?: boolean;
  /** Altura en px (el ancho es proporcional, ~2.87×). */
  height?: number;
} & Omit<SVGProps<SVGSVGElement>, "children" | "height">;

const RATIO = 1422 / 496;

/**
 * <PublicalleLogo /> — logo aprobado completo (P + UBLICALLE + HN.).
 * Variantes: theme="light" (logo-light), theme="dark" (logo-dark), mono (monochrome).
 */
export function PublicalleLogo({
  theme = "dark",
  mono = false,
  knockout = "#fff",
  withVehicle = true,
  withHN = true,
  animate = false,
  height = 40,
  ...rest
}: PublicalleLogoProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const play = animate && !reduce;
  const f = (id: string) => (mono ? "currentColor" : `url(#${id}-${uid})`);
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      height={height}
      width={Math.round(height * RATIO)}
      role="img"
      aria-label={brand.legalName}
      {...rest}
    >
      <MarkContent
        uid={uid}
        theme={theme}
        mono={mono}
        knockout={knockout}
        withVehicle={withVehicle}
        compact={height < 28}
        animate={play}
      />
      <m.path
        d={LOGO_WORDMARK}
        fill={f("gw")}
        initial={play ? { opacity: 0, x: -24 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      {withHN && (
        <m.path
          d={LOGO_HN}
          fill={f("gt")}
          initial={play ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        />
      )}
    </svg>
  );
}
