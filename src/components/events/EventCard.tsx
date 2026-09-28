import { m } from "motion/react";
import type { EventBlock } from "@/types";
import { EventScene } from "./EventScene";
import { useSpotlight } from "@/hooks/useSpotlight";
import { reveal } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Bloque de Publicalle Events: escena grande (o foto real con overlay azul/teal) + lo que incluye. */
export function EventCard({ block, index, wide }: { block: EventBlock; index: number; wide?: boolean }) {
  const onMove = useSpotlight<HTMLElement>();
  return (
    <m.article
      variants={reveal}
      onPointerMove={onMove}
      aria-labelledby={`ev-${block.id}`}
      className={cn(
        "spotlight metal-sheen group relative flex flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-500 ease-[var(--ease-drive)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(34_201_180/0.4)]",
        wide ? "lg:col-span-7" : "lg:col-span-5",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(90%_80%_at_50%_15%,rgb(34_201_180/0.22),transparent_60%),linear-gradient(180deg,rgb(10_47_114/0.55),rgb(5_10_23/0.95))]">
        {block.image ? (
          <>
            <img src={block.image} srcSet={block.imageSrcSet} sizes="(min-width: 1024px) 45vw, (min-width: 768px) 50vw, 100vw" alt={block.imageAlt ?? block.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgb(21_96_200/0.35),transparent_45%,rgb(34_201_180/0.25))] mix-blend-multiply" aria-hidden />
          </>
        ) : (
          <div className="absolute inset-x-0 bottom-0 top-4 transition-transform duration-700 ease-[var(--ease-drive)] group-hover:scale-[1.03]">
            <EventScene visual={block.visual} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface to-transparent" aria-hidden />
        <span className="type-data absolute left-5 top-5 rounded-full bg-brand-bg/70 px-3 py-1 text-xs text-brand-white/80 backdrop-blur">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-7">
        <h3 id={`ev-${block.id}`} className="text-3xl font-extrabold tracking-tight [font-stretch:120%]">
          {block.title}
        </h3>
        <ul className="flex flex-wrap gap-2" aria-label={`Incluye (${block.title})`}>
          {block.items.map((it) => (
            <li key={it} className="rounded-full bg-white/[0.04] px-3 py-1.5 text-sm text-brand-white/80 ring-1 ring-inset ring-white/10">
              {it}
            </li>
          ))}
        </ul>
      </div>
    </m.article>
  );
}
