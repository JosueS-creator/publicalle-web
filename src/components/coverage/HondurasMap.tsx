import { useId, useRef } from "react";
import { m, useInView, useReducedMotion } from "motion/react";
import { PublicalleMark } from "@/components/brand/PublicalleMark";
import { HN_CITIES, HN_OUTLINE, HN_VIEWBOX, type HnCity } from "@/data/honduras";
import { cn } from "@/lib/cn";

const HUB = HN_CITIES.find((c) => c.id === "tegucigalpa")!;
const SIZE: Record<HnCity["tier"], number> = { 1: 64, 2: 44, 3: 30 };

/** Arco suave desde el centro de operaciones hasta cada ciudad. */
function arc(a: [number, number], b: [number, number]) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(80, len * 0.22);
  return `M${a[0]} ${a[1]} Q${mx - (dy / len) * bend} ${my + (dx / len) * bend} ${b[0]} ${b[1]}`;
}

/**
 * <HondurasMap /> — cobertura nacional: contorno real de Honduras y la P de Publicalle
 * (con el vehículo) marcando cada ciudad principal.
 */
export function HondurasMap({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = !!useReducedMotion();
  const show = inView || reduce;
  // orden de aparición: de la capital hacia afuera
  const cities = [...HN_CITIES].sort(
    (a, b) => Math.hypot(a.at[0] - HUB.at[0], a.at[1] - HUB.at[1]) - Math.hypot(b.at[0] - HUB.at[0], b.at[1] - HUB.at[1]),
  );

  return (
    <svg
      ref={ref}
      viewBox={`-20 -60 ${HN_VIEWBOX.width + 40} ${HN_VIEWBOX.height + 80}`}
      className={cn("block h-auto w-full overflow-visible", className)}
      role="img"
      aria-label={`Mapa de Honduras con cobertura de Publicalle en ${HN_CITIES.map((c) => c.name).join(", ")}`}
    >
      <defs>
        <linearGradient id={`hn-fill-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--publicalle-blue)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--publicalle-blue-dark)" stopOpacity="0.75" />
        </linearGradient>
        <pattern id={`hn-grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgb(148 170 220 / 0.12)" strokeWidth="1" />
        </pattern>
        <clipPath id={`hn-clip-${uid}`}>
          <path d={HN_OUTLINE} />
        </clipPath>
        <filter id={`hn-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* País */}
      <path d={HN_OUTLINE} fill="none" stroke="var(--publicalle-green)" strokeWidth="6" opacity="0.35" filter={`url(#hn-glow-${uid})`} />
      <path d={HN_OUTLINE} fill={`url(#hn-fill-${uid})`} />
      <rect x="0" y="0" width={HN_VIEWBOX.width} height={HN_VIEWBOX.height} fill={`url(#hn-grid-${uid})`} clipPath={`url(#hn-clip-${uid})`} />
      <m.path
        d={HN_OUTLINE}
        fill="none"
        stroke="var(--publicalle-green-light)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={show ? { pathLength: 1 } : undefined}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Red de cobertura desde la capital */}
      {cities
        .filter((c) => c.id !== HUB.id)
        .map((c, i) => {
          const d = arc(HUB.at, c.at);
          return (
            <g key={`l-${c.id}`}>
              <m.path
                d={d}
                fill="none"
                stroke="var(--publicalle-green)"
                strokeWidth={c.tier === 1 ? 2 : 1.2}
                strokeDasharray="3 6"
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={show ? { pathLength: 1, opacity: 0.6 } : undefined}
                transition={{ delay: 0.8 + i * 0.08, duration: 0.9, ease: "easeOut" }}
              />
              {!reduce && show && (
                <circle r="3" fill="var(--publicalle-green-light)">
                  <animateMotion dur={`${2.6 + (i % 4) * 0.5}s`} begin={`${1.8 + i * 0.15}s`} repeatCount="indefinite" path={d} />
                </circle>
              )}
            </g>
          );
        })}

      {/* Ciudades: pulso + la P de Publicalle */}
      {cities.map((c, i) => {
        const s = SIZE[c.tier];
        const delay = reduce ? 0 : 0.6 + i * 0.09;
        const side = c.label ?? "right";
        return (
          <m.g
            key={c.id}
            initial={reduce ? false : { opacity: 0, y: -18 }}
            animate={show ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay, type: "spring", stiffness: 260, damping: 18 }}
            className={c.tier === 3 ? "hn-minor" : undefined}
          >
            <circle cx={c.at[0]} cy={c.at[1]} r={c.tier === 1 ? 9 : 6} fill="var(--publicalle-green)" opacity="0.35" className="animate-ping-soft" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${i * 0.3}s` }} />
            <circle cx={c.at[0]} cy={c.at[1]} r={c.tier === 1 ? 5 : 3.5} fill="var(--publicalle-green-light)" stroke="var(--publicalle-background)" strokeWidth="1.5" />
            {/* pin: la P sobre el punto */}
            <line x1={c.at[0]} y1={c.at[1]} x2={c.at[0]} y2={c.at[1] - 10} stroke="var(--publicalle-green-light)" strokeWidth="1.5" />
            <g style={{ filter: "drop-shadow(0 6px 10px rgb(0 0 0 / 0.55))" }}>
              <PublicalleMark
                theme="dark"
                compact={c.tier === 3}
                x={c.at[0] - s / 2}
                y={c.at[1] - 10 - s}
                width={s}
                height={s}
                title=""
              />
            </g>
            <text
              x={side === "left" ? c.at[0] - 12 : side === "below" ? c.at[0] : c.at[0] + (c.tier === 1 ? 14 : 10)}
              y={side === "below" ? c.at[1] + 24 : c.at[1] + (c.tier === 1 ? 22 : 17)}
              textAnchor={side === "left" ? "end" : side === "below" ? "middle" : "start"}
              fontSize={c.tier === 1 ? 20 : c.tier === 2 ? 15 : 13}
              fontWeight={c.tier === 3 ? 500 : 700}
              fontFamily="var(--font-sans)"
              fill="var(--publicalle-white)"
              className={`hn-t${c.tier}`}
              style={{ paintOrder: "stroke", stroke: "var(--publicalle-background)", strokeWidth: 4, strokeLinejoin: "round" }}
            >
              {c.name}
            </text>
          </m.g>
        );
      })}
    </svg>
  );
}
