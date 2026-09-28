import { m, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { VehiclePhoto } from "./VehiclePhoto";
import { viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Trayectorias elegantes (sin mapa) que envuelven al vehículo. */
const TRAJECTORIES = [
  { d: "M0 250 C220 200 380 280 560 236 S860 170 1000 206", w: 2.5, o: 0.9 },
  { d: "M0 150 C180 110 320 190 520 150 S820 70 1000 110", w: 1.5, o: 0.55 },
  { d: "M0 290 C260 270 420 300 640 280 S900 250 1000 270", w: 1.5, o: 0.45 },
];

export type Hotspot = { id: string; x: number; y: number; label: string };

type Props = {
  /** Progreso de scroll de la sección (0–1): el vehículo avanza y el texto de fondo retrocede. */
  progress: MotionValue<number>;
  screenMessages: string[];
  backdropText: string;
  hotspots?: Hotspot[];
  className?: string;
};

/** <VehicleShowcase /> — el vehículo real a gran escala, con ruta, texto de fondo y puntos de interés. */
export function VehicleShowcase({ progress, screenMessages, backdropText, hotspots = [], className }: Props) {
  const reduce = useReducedMotion();
  const carX = useTransform(progress, [0, 1], reduce ? ["0%", "0%"] : ["-14%", "10%"]);
  const textX = useTransform(progress, [0, 1], reduce ? ["0%", "0%"] : ["6%", "-12%"]);
  const draws = [
    useTransform(progress, [0.1, 0.55], [0, 1]),
    useTransform(progress, [0.18, 0.62], [0, 1]),
    useTransform(progress, [0.26, 0.7], [0, 1]),
  ];

  return (
    <div className={cn("relative", className)}>
      <m.p
        style={{ x: textX }}
        aria-hidden
        className="type-display text-outline pointer-events-none absolute inset-x-0 top-[2%] whitespace-nowrap text-center text-[clamp(4rem,15vw,15rem)] leading-none"
      >
        {backdropText}
      </m.p>
      {/* Trayectorias alrededor del vehículo: se dibujan con el scroll */}
      <svg className="pointer-events-none absolute inset-x-0 top-[18%] h-[78%] w-full" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="vs-trail" x1="0" x2="1">
            <stop offset="0" stopColor="var(--publicalle-blue-electric)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--publicalle-green-light)" />
            <stop offset="1" stopColor="var(--publicalle-blue-electric)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {TRAJECTORIES.map((t, i) => (
          <g key={t.d}>
            <path d={t.d} fill="none" stroke="rgb(148 170 220 / 0.14)" strokeWidth="1" strokeDasharray="2 8" vectorEffect="non-scaling-stroke" />
            <m.path d={t.d} fill="none" stroke="url(#vs-trail)" strokeWidth={t.w} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: reduce ? 1 : draws[i], opacity: t.o }} />
          </g>
        ))}
      </svg>
      <m.div style={{ x: carX }} className="relative mx-auto w-[min(92vw,62rem)] pt-[6vw]">
        <VehiclePhoto screenMessages={screenMessages} />
        {hotspots.map((h, i) => (
          <m.div
            key={h.id}
            className="absolute hidden md:block"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ delay: 0.6 + i * 0.2, type: "spring", stiffness: 200, damping: 16 }}
          >
            <span className="relative -ml-2 -mt-2 flex size-4" aria-hidden>
              <span className="absolute inset-0 rounded-full bg-brand-green animate-ping-soft" />
              <span className="relative size-4 rounded-full border-2 border-brand-bg bg-brand-green" />
            </span>
            <span className="type-eyebrow absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-bg/85 px-3 py-1.5 text-[0.62rem] text-brand-white ring-1 ring-brand-green/40 backdrop-blur">
              {h.label}
            </span>
            <span className="absolute -top-6 left-0 h-4 w-px bg-brand-green/60" aria-hidden />
          </m.div>
        ))}
      </m.div>
    </div>
  );
}
