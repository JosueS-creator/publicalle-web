import type { EventBlock } from "@/types";

const W = "var(--publicalle-white)";
const G = "var(--publicalle-green)";
const GL = "var(--publicalle-green-light)";
const BD = "var(--publicalle-blue-dark)";
const BE = "var(--publicalle-blue-electric)";

/** Persona estilizada (promotor/animador). `shirt` = color de camiseta de marca. */
function Person({ x, y, s = 1, shirt = G, arm = "down" }: { x: number; y: number; s?: number; shirt?: string; arm?: "down" | "up" | "out" }) {
  const armPath = arm === "up" ? "M-14 -38 L-24 -70" : arm === "out" ? "M-14 -38 L-38 -44" : "M-14 -38 L-18 -12";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-16 0 L-14 -46 Q0 -54 14 -46 L16 0 Z" fill={shirt} />
      <path d="M-5 -38 Q0 -33 5 -38" stroke={BD} strokeWidth="2" fill="none" opacity=".5" />
      <path d={armPath} stroke={shirt} strokeWidth="9" strokeLinecap="round" />
      <path d="M14 -38 L18 -12" stroke={shirt} strokeWidth="9" strokeLinecap="round" />
      <circle cy="-62" r="11" fill={W} />
      <rect x="-14" y="0" width="11" height="26" rx="4" fill={BD} />
      <rect x="3" y="0" width="11" height="26" rx="4" fill={BD} />
    </g>
  );
}

function Floor() {
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="ev-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BE} stopOpacity="0" />
          <stop offset="1" stopColor={BE} stopOpacity="0.16" />
        </linearGradient>
      </defs>
      <rect x="0" y="190" width="400" height="60" fill="url(#ev-floor)" />
      {[-160, -80, 0, 80, 160].map((dx) => (
        <line key={dx} x1={200 + dx * 0.4} y1="190" x2={200 + dx * 1.6} y2="250" stroke="rgb(148 170 220 / 0.12)" />
      ))}
      {[200, 215, 235].map((y) => (
        <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="rgb(148 170 220 / 0.1)" />
      ))}
    </g>
  );
}

function Beams() {
  return (
    <g opacity="0.5" aria-hidden>
      <path d="M90 0 L60 200 L130 200 Z" fill="url(#ev-beam)" className="ev-sway" style={{ transformOrigin: "90px 0px" }} />
      <path d="M310 0 L270 200 L340 200 Z" fill="url(#ev-beam)" className="ev-sway ev-sway-rev" style={{ transformOrigin: "310px 0px" }} />
      <defs>
        <linearGradient id="ev-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GL} stopOpacity="0.45" />
          <stop offset="1" stopColor={GL} stopOpacity="0" />
        </linearGradient>
      </defs>
    </g>
  );
}

function Confetti() {
  const pieces = [[40, 20], [120, 8], [180, 30], [240, 12], [300, 26], [360, 10], [80, 40], [340, 44], [210, 50]];
  return (
    <g aria-hidden>
      {pieces.map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="5"
          height="9"
          rx="1"
          fill={i % 3 === 0 ? GL : i % 3 === 1 ? W : BE}
          className="ev-fall"
          style={{ animationDelay: `${(i * 0.37) % 2.4}s`, transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </g>
  );
}

/** Escena ilustrada de cada bloque de Events (se reemplaza por foto real cuando exista). */
export function EventScene({ visual }: { visual: EventBlock["visual"] }) {
  return (
    <svg viewBox="0 0 400 250" className="h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <Floor />
      {visual === "tent" && (
        <g>
          <Beams />
          <ellipse cx="200" cy="222" rx="130" ry="10" fill="black" opacity=".35" />
          <path d="M100 96 L200 50 L300 96 Z" fill={W} />
          <path d="M200 50 L300 96 L270 96 Z" fill="rgb(11 26 61 / 0.12)" />
          <path d="M100 96 H300 V112 Q290 120 280 112 Q270 120 260 112 Q250 120 240 112 Q230 120 220 112 Q210 120 200 112 Q190 120 180 112 Q170 120 160 112 Q150 120 140 112 Q130 120 120 112 Q110 120 100 112 Z" fill={G} />
          <text x="200" y="108" textAnchor="middle" fontSize="11" fontWeight="800" fill={BD} fontFamily="var(--font-sans)" letterSpacing="2">TU MARCA</text>
          <path d="M106 112 V218 M294 112 V218" stroke={W} strokeWidth="4" />
          <rect x="146" y="168" width="108" height="46" rx="3" fill={G} />
          <rect x="146" y="164" width="108" height="8" rx="2" fill={W} />
          <text x="200" y="196" textAnchor="middle" fontSize="10" fontWeight="800" fill={BD} fontFamily="var(--font-sans)" letterSpacing="1.5">PROMO</text>
          <path d="M120 218 V190 H138 V218 M262 218 V190 H280 V218" stroke="rgb(244 246 250 / 0.6)" strokeWidth="3" fill="none" />
          {/* bandera tipo pluma */}
          <path d="M338 218 V70" stroke={W} strokeWidth="3" />
          <path d="M338 72 Q370 90 360 150 L338 150 Z" fill={G} />
          <path d="M338 78 Q360 94 354 140 L342 140 Z" fill={GL} opacity=".5" />
        </g>
      )}
      {visual === "audio" && (
        <g>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx="200" cy="120" r="40" fill="none" stroke={GL} strokeWidth="2" className="animate-ping-soft" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${i * 0.8}s` }} />
          ))}
          {[[80, 70], [270, 70]].map(([x, y]) => (
            <g key={x}>
              <ellipse cx={x + 25} cy="222" rx="36" ry="6" fill="black" opacity=".35" />
              <rect x={x} y={y} width="50" height="148" rx="8" fill={BD} stroke="rgb(148 170 220 / 0.35)" />
              <circle cx={x + 25} cy={y + 34} r="14" fill="#08132c" stroke={GL} strokeWidth="2" />
              <circle cx={x + 25} cy={y + 90} r="20" fill="#08132c" stroke={GL} strokeWidth="2" />
              <circle cx={x + 25} cy={y + 90} r="6" fill={G} />
            </g>
          ))}
          <path d="M200 218 V120" stroke={W} strokeWidth="3" />
          <path d="M184 218 H216" stroke={W} strokeWidth="3" />
          <rect x="192" y="96" width="16" height="28" rx="8" fill={W} />
          <g className="ev-eq">
            {Array.from({ length: 11 }).map((_, i) => (
              <rect key={i} x={140 + i * 11} y="180" width="6" height="34" rx="3" fill={i % 2 ? G : BE} className="animate-eq" style={{ animationDelay: `${(i % 5) * 0.14}s`, transformBox: "fill-box" }} />
            ))}
          </g>
        </g>
      )}
      {visual === "animation" && (
        <g>
          <Beams />
          <Confetti />
          <path d="M60 206 H340 L324 222 H76 Z" fill={BD} stroke="rgb(148 170 220 / 0.3)" />
          <Person x={200} y={180} s={1.25} arm="up" />
          <rect x="168" y="84" width="8" height="16" rx="4" fill={W} transform="rotate(-25 172 92)" />
          <Person x={110} y={206} s={0.8} shirt="rgb(244 246 250 / 0.75)" arm="up" />
          <Person x={296} y={206} s={0.8} shirt="rgb(244 246 250 / 0.75)" arm="out" />
        </g>
      )}
      {visual === "promoters" && (
        <g>
          <ellipse cx="200" cy="226" rx="150" ry="9" fill="black" opacity=".35" />
          <Person x={120} y={200} s={1.05} arm="out" />
          <Person x={210} y={200} s={1.15} arm="out" />
          <Person x={300} y={200} s={1.05} shirt="rgb(244 246 250 / 0.8)" />
          {[[74, 128, -12], [168, 124, 8], [250, 116, -6]].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`} className="ev-float" style={{ animationDelay: `${i * 0.6}s` }}>
              <rect x={x} y={y} width="20" height="28" rx="2" fill={W} />
              <rect x={x + 3} y={y + 3} width="14" height="9" rx="1" fill={G} />
              <rect x={x + 3} y={y + 16} width="14" height="2" fill={BD} opacity=".3" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
