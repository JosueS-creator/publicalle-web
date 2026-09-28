import { m } from "motion/react";
import { ArrowUpRight, ChartNoAxesColumn, MapPinned, Route, Tent } from "lucide-react";
import type { ServiceLine } from "@/types";
import { LineVisual } from "./LineVisual";
import { useSpotlight } from "@/hooks/useSpotlight";
import { reveal } from "@/lib/motion";

const icons = { move: Route, events: Tent, place: MapPinned, data: ChartNoAxesColumn } as const;

/** Tarjeta de una línea del ecosistema (MOVE, EVENTS, PLACE, DATA). */
export function LineCard({ line, index }: { line: ServiceLine; index: number }) {
  const onMove = useSpotlight<HTMLElement>();
  const Icon = icons[line.id];
  return (
    <m.article
      variants={reveal}
      onPointerMove={onMove}
      aria-labelledby={`line-${line.id}`}
      className="spotlight metal-sheen group relative flex flex-col overflow-hidden rounded-3xl bg-[linear-gradient(160deg,rgb(21_96_200/0.16),rgb(10_19_38/0.92)_42%)] ring-1 ring-inset ring-line transition-[box-shadow,transform] duration-500 ease-[var(--ease-drive)] hover:-translate-y-1.5 hover:ring-brand-green/35 hover:shadow-[0_30px_60px_-30px_rgb(34_201_180/0.4)]"
    >
      <div className="flex items-center justify-between p-6 pb-0">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-blue-dark/70 text-brand-green-light ring-1 ring-inset ring-white/10">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="type-data text-sm text-muted">{String(index + 1).padStart(2, "0")}</span>
      </div>

      <div className="h-28 px-4 pt-3">
        <LineVisual line={line.id} />
      </div>

      <div className="flex flex-1 flex-col p-6 pt-2">
        <p className="type-eyebrow text-[0.62rem] text-muted">Publicalle</p>
        <h3 id={`line-${line.id}`} className="type-display mt-1 text-[2.4rem] text-brand-white md:text-[2.6rem]">
          {line.name}
        </h3>
        <p className="mt-2 font-semibold text-brand-green-light">{line.kicker}</p>
        <ul className="mt-5 grid gap-2 text-brand-white/80" aria-label={`Incluye (${line.name})`}>
          {line.items.map((it) => (
            <li key={it} className="flex items-center gap-2.5 text-[0.95rem]">
              <span className="size-1.5 rounded-full bg-brand-green" aria-hidden />
              {it}
            </li>
          ))}
        </ul>
        <a
          href={line.href}
          className="mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-semibold text-brand-white transition-colors hover:text-brand-green-light"
        >
          Ver Publicalle {line.name[0] + line.name.slice(1).toLowerCase()}
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </a>
      </div>

      {/* ruta inferior: el punto recorre la tarjeta al pasar el cursor */}
      <div className="relative mx-6 mb-6 h-px bg-[repeating-linear-gradient(90deg,rgb(148_170_220/0.35)_0_3px,transparent_3px_9px)]" aria-hidden>
        <span className="absolute -top-[3px] left-0 size-[7px] rounded-full bg-brand-green shadow-[0_0_10px_var(--publicalle-green)] transition-[left] duration-[1.2s] ease-[var(--ease-drive)] group-hover:left-[calc(100%-7px)]" />
      </div>
    </m.article>
  );
}
