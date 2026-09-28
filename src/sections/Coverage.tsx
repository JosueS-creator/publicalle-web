import { useState } from "react";
import { m } from "motion/react";
import { CoverageMap } from "@/components/coverage/CoverageMap";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { coverage } from "@/data/coverage";
import { coverageSection } from "@/data/site";
import { reveal, stagger, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

function Legend() {
  const items = [
    { id: "zona", label: "Zona", el: <span className="size-3 rounded-sm bg-brand-green/30 ring-1 ring-brand-green/60" /> },
    { id: "ruta", label: "Ruta", el: <span className="h-0.5 w-5 bg-[repeating-linear-gradient(90deg,var(--publicalle-blue-electric)_0_3px,transparent_3px_6px)]" /> },
    { id: "punto", label: "Punto", el: <span className="size-2.5 rounded-full bg-brand-green" /> },
    { id: "vehiculo", label: "Vehículo", el: <span className="size-2.5 rounded-full bg-brand-green-light shadow-[0_0_8px_var(--publicalle-green-light)]" /> },
  ];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Leyenda del mapa">
      {items.map((i) => (
        <li key={i.id} className="type-eyebrow flex items-center gap-2 text-[0.62rem] text-muted">
          {i.el}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Territorio: dónde puede llevar una campaña. */
export function Coverage() {
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const zone = hovered ?? pinned;

  return (
    <section id="cobertura" aria-labelledby="cobertura-title" className="relative overflow-hidden py-24 md:py-36">
      <div className="container-pc">
        <SectionHeading
          id="cobertura-title"
          index="09"
          eyebrow={coverageSection.eyebrow}
          title={coverageSection.title}
          body={coverageSection.body}
        />

        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12 lg:gap-8">
          {/* Mapa */}
          <m.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="relative overflow-hidden rounded-3xl bg-surface ring-1 ring-inset ring-line lg:col-span-8 lg:row-span-2"
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 md:px-6">
              <p className="type-eyebrow text-[0.65rem] text-brand-white">
                {coverage.city} <span className="text-muted">· mapa ilustrativo</span>
              </p>
              <div className="hidden sm:block">
                <Legend />
              </div>
            </div>
            <div className="aspect-[1000/620]">
              <CoverageMap data={coverage} vehicleRouteId="ruta-principal" highlightZone={zone} lapDuration={22} />
            </div>
            <div className="border-t border-line px-5 py-3 sm:hidden">
              <Legend />
            </div>
          </m.div>

          {/* Zonas */}
          <m.ul
            variants={stagger(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 lg:col-span-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
            aria-label="Zonas de ejemplo"
          >
            {coverage.zones.map((z) => {
              const selected = zone === z.id;
              const isPinned = pinned === z.id;
              return (
                <m.li key={z.id} variants={reveal} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                  <button
                    type="button"
                    aria-pressed={isPinned}
                    onClick={() => setPinned(isPinned ? null : z.id)}
                    onMouseEnter={() => setHovered(z.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(z.id)}
                    onBlur={() => setHovered(null)}
                    className={cn(
                      "flex h-full w-full items-start gap-4 rounded-2xl p-4 text-left ring-1 ring-inset transition-all duration-300",
                      selected ? "bg-brand-green/10 ring-brand-green/50" : "bg-white/[0.02] ring-line hover:bg-white/[0.05]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2.5 shrink-0 rounded-full transition-colors",
                        z.active ? (selected ? "bg-brand-green-light shadow-[0_0_10px_var(--publicalle-green)]" : "bg-brand-green") : "border border-muted",
                      )}
                      aria-hidden
                    />
                    <span>
                      <span className="block font-bold text-brand-white">{z.name}</span>
                      <span className="mt-1 block text-sm leading-snug text-muted">{z.description}</span>
                      {!z.active && <span className="type-eyebrow mt-2 block text-[0.6rem] text-brand-electric">Bajo solicitud</span>}
                    </span>
                  </button>
                </m.li>
              );
            })}
          </m.ul>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-muted">
          {coverageSection.note} Zonas de ejemplo en mapa ilustrativo.
        </p>
      </div>
    </section>
  );
}
