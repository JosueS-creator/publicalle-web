import type { LineId } from "@/types";
import { VehicleIcon } from "@/components/vehicle/VehicleSilhouette";

/**
 * Mini-ilustración por línea. Todas comparten el lenguaje del sistema:
 * ruta punteada + nodos turquesa + blanco sobre azul profundo.
 */
export function LineVisual({ line }: { line: LineId }) {
  const route = (
    <path d="M6 70 C40 52 70 78 104 58 S160 40 194 50" fill="none" stroke="rgb(148 170 220 / 0.35)" strokeWidth="1.5" strokeDasharray="2 5" />
  );
  switch (line) {
    case "move":
      return (
        <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
          {route}
          <circle cx="104" cy="58" r="3" fill="var(--publicalle-green)" />
          <g className="transition-transform duration-700 ease-[var(--ease-drive)] group-hover:translate-x-3">
            <svg x="58" y="16" width="92" height="44">
              <VehicleIcon bodyColor="var(--publicalle-white)" />
            </svg>
          </g>
        </svg>
      );
    case "events":
      return (
        <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
          {route}
          {/* carpa */}
          <path d="M70 34 L100 16 L130 34 Z" fill="var(--publicalle-white)" />
          <path d="M70 34 H130 V40 Q125 44 120 40 Q115 44 110 40 Q105 44 100 40 Q95 44 90 40 Q85 44 80 40 Q75 44 70 40 Z" fill="var(--publicalle-green)" />
          <path d="M73 40 V70 M127 40 V70" stroke="var(--publicalle-white)" strokeWidth="2" />
          <rect x="86" y="54" width="28" height="16" rx="2" fill="rgb(244 246 250 / 0.85)" />
          <g fill="var(--publicalle-green-light)" className="animate-ping-soft" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <circle cx="60" cy="24" r="2" />
          </g>
          <circle cx="146" cy="22" r="2" fill="var(--publicalle-green-light)" />
          <circle cx="54" cy="44" r="1.5" fill="var(--publicalle-blue-electric)" />
        </svg>
      );
    case "place":
      return (
        <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
          <g stroke="rgb(148 170 220 / 0.14)">
            {[20, 45, 70].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} />)}
            {[30, 70, 110, 150, 190].map((x) => <line key={x} y1="0" y2="90" x1={x} x2={x} />)}
          </g>
          {[[50, 32], [96, 58], [140, 26], [168, 64]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r="9" fill="var(--publicalle-green)" opacity="0.18" className="animate-ping-soft" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${i * 0.5}s` }} />
              <circle r="4" fill="var(--publicalle-green-light)" />
            </g>
          ))}
          <path d="M96 30 C88 30 84 36 84 41 C84 49 96 58 96 58 C96 58 108 49 108 41 C108 36 104 30 96 30 Z" fill="var(--publicalle-white)" transform="translate(0 -6)" />
          <circle cx="96" cy="35" r="4" fill="var(--publicalle-blue-dark)" />
        </svg>
      );
    case "data":
    default:
      return (
        <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
          <path d="M10 70 C40 60 60 40 90 46 S140 20 190 18" fill="none" stroke="url(#ld-grad)" strokeWidth="2.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="ld-grad" x1="0" x2="1">
              <stop offset="0" stopColor="var(--publicalle-blue-electric)" />
              <stop offset="1" stopColor="var(--publicalle-green-light)" />
            </linearGradient>
          </defs>
          {[[10, 70], [90, 46], [190, 18]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.5" fill="var(--publicalle-green)" />)}
          {[0.4, 0.65, 0.5, 0.9, 0.75].map((v, i) => (
            <rect key={i} x={120 + i * 14} y={84 - v * 34} width="8" height={v * 34} rx="2" fill="rgb(244 246 250 / 0.2)" />
          ))}
        </svg>
      );
  }
}
