import { useReducedMotion } from "motion/react";

/**
 * Ilustración territorial (no es un mapa real): una escuela, las cuadras de alrededor
 * y el vehículo de Publicalle recorriéndolas con audio. Comunica "movimiento + territorio".
 */
export function RecorridoVisual({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ruta = "M90 250 H230 V120 H390 V250 H470 V370 H300 V430 H130 V330 H90 Z";
  return (
    <svg viewBox="0 0 560 520" className={className} role="img" aria-label="Ilustración: el vehículo de Publicalle recorre las cuadras alrededor de una escuela">
      <defs>
        <pattern id="pe-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="rgb(148 170 220 / 0.10)" strokeWidth="1" />
        </pattern>
        <radialGradient id="pe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c9b4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22c9b4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pe-ruta" x1="0" x2="1">
          <stop offset="0%" stopColor="#46e3cf" />
          <stop offset="100%" stopColor="#3aa8f0" />
        </linearGradient>
      </defs>
      <rect width="560" height="520" fill="url(#pe-grid)" />
      {/* Cuadras (barrios y colonias alrededor) */}
      {[
        [40, 60, 160, 160], [250, 40, 120, 60], [410, 60, 120, 160], [40, 280, 60, 30], [250, 140, 120, 90],
        [490, 270, 50, 150], [150, 270, 130, 40], [320, 270, 130, 80], [40, 360, 70, 120], [150, 450, 300, 40], [330, 390, 120, 30],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="rgb(10 19 38 / 0.9)" stroke="rgb(148 170 220 / 0.16)" />
      ))}
      <text x="60" y="88" className="fill-[#8d97ad] font-mono text-[11px] uppercase tracking-[0.2em]">Colonia</text>
      <text x="425" y="88" className="fill-[#8d97ad] font-mono text-[11px] uppercase tracking-[0.2em]">Barrio</text>
      <text x="335" y="412" className="fill-[#8d97ad] font-mono text-[11px] uppercase tracking-[0.2em]">Colonia</text>

      {/* Radio alrededor de la escuela */}
      <circle cx="290" cy="290" r="200" fill="url(#pe-glow)" />
      <circle cx="290" cy="290" r="200" fill="none" stroke="#22c9b4" strokeOpacity="0.35" strokeDasharray="5 7" />

      {/* Recorrido */}
      <path d={ruta} fill="none" stroke="rgb(70 227 207 / 0.15)" strokeWidth="12" strokeLinejoin="round" />
      <path d={ruta} fill="none" stroke="url(#pe-ruta)" strokeWidth="3" strokeLinejoin="round" strokeDasharray="8 8">
        {!reduce && <animate attributeName="stroke-dashoffset" from="0" to="-160" dur="4s" repeatCount="indefinite" />}
      </path>

      {/* Escuela */}
      <g transform="translate(290 290)">
        {!reduce &&
          [0, 1, 2].map((i) => (
            <circle key={i} r="20" fill="none" stroke="#46e3cf" strokeWidth="2" opacity="0">
              <animate attributeName="r" from="22" to="90" dur="3s" begin={`${i}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="3s" begin={`${i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        <rect x="-28" y="-22" width="56" height="40" rx="6" fill="#0a2f72" stroke="#3aa8f0" strokeWidth="2" />
        <path d="M-34 -20 L0 -44 L34 -20 Z" fill="#1560c8" stroke="#3aa8f0" strokeWidth="2" strokeLinejoin="round" />
        <rect x="-7" y="0" width="14" height="18" rx="2" fill="#22c9b4" />
        <rect x="-21" y="-12" width="10" height="9" rx="1.5" fill="#46e3cf" opacity="0.8" />
        <rect x="11" y="-12" width="10" height="9" rx="1.5" fill="#46e3cf" opacity="0.8" />
        <text y="42" textAnchor="middle" className="fill-[#f4f6fa] text-[12px] font-semibold">Escuela</text>
      </g>

      {/* Vehículo */}
      <g transform={reduce ? "translate(230 120)" : undefined}>
        <circle r="13" fill="#22c9b4" opacity="0.25" />
        <circle r="7" fill="#46e3cf" stroke="#050a17" strokeWidth="3" />
        {!reduce && <animateMotion dur="14s" repeatCount="indefinite" path={ruta} rotate="auto" />}
      </g>
    </svg>
  );
}
