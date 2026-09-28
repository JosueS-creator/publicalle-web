import { m } from "motion/react";
import { LineHeading } from "@/components/ui/LineHeading";
import { CampaignDashboard } from "@/components/data/CampaignDashboard";
import { dataSection } from "@/data/site";
import { reveal, stagger, viewportOnce } from "@/lib/motion";
import proof600 from "@/assets/media/data/data-evidencia-sello-01-600.webp";
import proof900 from "@/assets/media/data/data-evidencia-sello-01-900.webp";

/** 07 — Publicalle Data: cobertura y evidencia (panel demostrativo). */
export function Data() {
  return (
    <section id="data" aria-labelledby="data-title" className="relative overflow-hidden bg-brand-graphite/40 py-24 md:py-32">
      <div className="pointer-events-none absolute -right-40 top-20 size-[40rem] rounded-full bg-brand-blue/20 blur-[140px]" aria-hidden />
      <div className="container-pc relative grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <LineHeading size="md" id="data-title" index="07" line="DATA" kicker="Cobertura y evidencia" subtitle={dataSection.title} body={dataSection.body} />
          <m.ul variants={stagger(0.05)} initial="hidden" whileInView="show" viewport={viewportOnce} className="mt-8 flex flex-wrap gap-2" aria-label="Qué registra una campaña">
            {dataSection.concepts.map((c) => (
              <m.li key={c} variants={reveal} className="type-eyebrow rounded-full px-3 py-1.5 text-[0.62rem] text-brand-white/80 ring-1 ring-inset ring-white/15">
                {c}
              </m.li>
            ))}
          </m.ul>

          <m.figure
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="mt-10 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-5 overflow-hidden rounded-3xl bg-surface p-3 pr-5 ring-1 ring-inset ring-brand-green/30"
          >
            <img
              src={proof600}
              srcSet={`${proof600} 600w, ${proof900} 900w`}
              sizes="(min-width: 1024px) 16vw, 45vw"
              alt={dataSection.proof.alt}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
            />
            <figcaption>
              <span className="type-eyebrow text-[0.62rem] text-brand-green-light">{dataSection.proof.kicker}</span>
              <span className="mt-2 block text-lg font-bold leading-snug text-brand-white [font-stretch:110%]">{dataSection.proof.title}</span>
              <span className="mt-2 block text-sm leading-relaxed text-brand-white/80">{dataSection.proof.body}</span>
            </figcaption>
          </m.figure>
        </div>
        <m.div variants={reveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="lg:col-span-7 lg:pt-6">
          <CampaignDashboard />
          <p className="mt-4 text-xs text-muted">{dataSection.disclaimer}</p>
        </m.div>
      </div>
    </section>
  );
}
