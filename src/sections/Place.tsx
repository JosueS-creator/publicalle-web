import { m } from "motion/react";
import { Building2, Crosshair, MapPin, Monitor, Store, TrafficCone } from "lucide-react";
import { CoverageMap } from "@/components/coverage/CoverageMap";
import { LineHeading } from "@/components/ui/LineHeading";
import { placeCoverage } from "@/data/coverage";
import { place } from "@/data/site";
import { reveal, stagger, viewportOnce } from "@/lib/motion";

const icons = [MapPin, Monitor, Store, TrafficCone, Building2, Crosshair];

/** 05 — Publicalle Place: publicidad en ubicaciones físicas. Sin inventario inventado. */
export function Place() {
  return (
    <section id="place" aria-labelledby="place-title" className="relative overflow-hidden py-24 md:py-32">
      <div className="container-pc grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <LineHeading size="md" id="place-title" index="05" line="PLACE" kicker="Publicidad en ubicaciones físicas" subtitle={place.title} body={place.body} />
          <h3 className="type-eyebrow mt-10 text-muted">Qué incluye</h3>
          <m.ul variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={viewportOnce} className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2" aria-label="Qué incluye Publicalle Place">
            {place.services.map((s, i) => {
              const Icon = icons[i % icons.length];
              return (
                <m.li key={s} variants={reveal} className="flex items-center gap-3.5 border-b border-line py-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-green/15 text-brand-green-light ring-1 ring-inset ring-brand-green/40" aria-hidden>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-[0.95rem] font-medium leading-snug text-brand-white">{s}</span>
                </m.li>
              );
            })}
          </m.ul>
        </div>

        <m.figure variants={reveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="relative overflow-hidden rounded-3xl bg-surface ring-1 ring-inset ring-line lg:col-span-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_55%_45%,rgb(34_201_180/0.12),transparent)]" aria-hidden />
          <div className="aspect-[1000/620]">
            <CoverageMap data={placeCoverage} showVehicle={false} showZones={false} drawDelay={0.3} title="Mapa ilustrativo de ubicaciones físicas para campañas" />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted md:px-6">
            <span className="type-eyebrow text-[0.62rem] text-brand-white">
              Tegucigalpa <span className="text-muted">· mapa ilustrativo</span>
            </span>
            <span>{place.disclaimer}</span>
          </figcaption>
        </m.figure>
      </div>
    </section>
  );
}
