import { m } from "motion/react";

type Props = {
  x: number;
  y: number;
  active: boolean;
  highlighted?: boolean;
  label?: string;
  /** Posición de la etiqueta respecto al punto. */
  labelSide?: "left" | "right";
  /** Retraso (s) al encenderse — para cascadas de puntos. */
  delay?: number;
};

/** Punto de cobertura: se "enciende" cuando el vehículo pasa o la zona está activa. */
export function CoveragePoint({ x, y, active, highlighted, label, labelSide = "right", delay = 0 }: Props) {
  const on = active || highlighted;
  const lx = labelSide === "right" ? 14 : -14;
  return (
    <g transform={`translate(${x} ${y})`}>
      {on && (
        <circle r="7" fill="var(--publicalle-green)" opacity="0.5" className="animate-ping-soft" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      )}
      <circle
        r={on ? 6 : 3.5}
        fill={on ? "var(--publicalle-green)" : "var(--publicalle-background)"}
        stroke={on ? "var(--publicalle-green-light)" : "rgb(148 170 220 / 0.55)"}
        strokeWidth={1.5}
        style={{ transition: "r .4s cubic-bezier(.34,1.56,.64,1), fill .3s", transitionDelay: `${delay}s` }}
      />
      {label && (
        <m.g
          initial={false}
          animate={{ opacity: on ? 1 : 0, x: on ? 0 : -6 }}
          transition={{ duration: 0.5, delay: on ? delay + 0.15 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <rect
            x={labelSide === "right" ? lx : lx - label.length * 6.6 - 16}
            y={-12}
            width={label.length * 6.6 + 16}
            height={24}
            rx={12}
            fill="rgb(5 10 23 / 0.82)"
            stroke="rgb(34 201 180 / 0.45)"
          />
          <text
            x={labelSide === "right" ? lx + 8 : lx - 8}
            y={4}
            textAnchor={labelSide === "right" ? "start" : "end"}
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill="var(--publicalle-white)"
            letterSpacing="0.04em"
          >
            {label}
          </text>
        </m.g>
      )}
    </g>
  );
}
