import { m } from "motion/react";
import { CoverageMap } from "@/components/coverage/CoverageMap";
import { MetricCard } from "@/components/ui/MetricCard";
import { CountUp } from "@/components/ui/CountUp";
import { DemoTag, StatusBadge } from "@/components/ui/StatusBadge";
import { coverage } from "@/data/coverage";
import { demoCampaign } from "@/data/site";
import { EASE_DRIVE, viewportOnce } from "@/lib/motion";
import ev1 from "@/assets/media/move/move-perifoneo-furgoneta-01-480.webp";
import ev2 from "@/assets/media/move/move-perifoneo-vehiculo-01-480.webp";
import ev3 from "@/assets/media/campaigns/campaigns-material-pop-01-800.webp";

/** Fotos REALES de ejecuciones de Publicalle (sin datos inventados: solo el tipo de trabajo). */
const EVIDENCE = [
  { src: ev1, label: "Perifoneo", alt: "Vehículo de perifoneo con bocinas en el techo, estacionado frente a un parque" },
  { src: ev2, label: "Perifoneo", alt: "Vehículo con bocinas de perifoneo en una colonia" },
  { src: ev3, label: "Montaje", alt: "Módulo de marca con roll-ups, producto y material promocional" },
];

/**
 * Panel CONCEPTUAL del futuro Publicalle Data. Todos los valores son de ejemplo (src/data/site.ts → demoCampaign)
 * y el componente lo declara visualmente. Cuando exista medición real, solo cambian los datos.
 */
export function CampaignDashboard() {
  const c = demoCampaign;
  const pct = Math.round(c.coverage * 100);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(160deg,rgb(21_96_200/0.18),rgb(10_19_38/0.9)_45%)] p-4 ring-1 ring-inset ring-white/10 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="type-eyebrow text-[0.62rem] text-muted">Campaña activa</p>
          <p className="mt-1 text-lg font-bold [font-stretch:110%]">{c.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <DemoTag label="Datos de ejemplo" />
          <StatusBadge label={c.status} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl bg-brand-bg/60 ring-1 ring-inset ring-white/10 md:col-span-3">
          <p className="type-eyebrow absolute left-4 top-3 z-10 text-[0.6rem] text-muted">Ruta · {c.city}</p>
          <div className="aspect-[1000/620]">
            <CoverageMap data={coverage} vehicleRouteId="ruta-principal" showLabels={false} lapDuration={16} title="Mapa de ejemplo del recorrido de la campaña" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-1 md:gap-3 lg:grid-cols-2">
          {c.metrics.map((m) => (
            <MetricCard key={m.id} metric={m} className="p-3.5" />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 md:col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="type-eyebrow text-[0.62rem] text-muted">Cobertura territorial</p>
            <p className="type-data text-xl font-semibold">
              <CountUp value={pct} />%
            </p>
          </div>
          <div className="mt-4 flex gap-1" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Cobertura de ejemplo">
            {Array.from({ length: 20 }).map((_, i) => (
              <m.span
                key={i}
                className="h-6 flex-1 rounded-[3px]"
                initial={{ backgroundColor: "rgb(148 170 220 / 0.12)" }}
                whileInView={{ backgroundColor: i < Math.round(c.coverage * 20) ? "var(--publicalle-green)" : "rgb(148 170 220 / 0.12)" }}
                viewport={viewportOnce}
                transition={{ delay: 0.3 + i * 0.04, duration: 0.2 }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Zonas planificadas cubiertas por los recorridos.</p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 md:col-span-3">
          <div className="flex items-baseline justify-between">
            <p className="type-eyebrow text-[0.62rem] text-muted">Evidencias fotográficas</p>
            <p className="type-eyebrow text-[0.6rem] text-brand-green-light">Fotos reales</p>
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {EVIDENCE.map((ev, i) => (
              <m.li
                key={ev.src}
                className="group/ev relative overflow-hidden rounded-lg ring-1 ring-white/10"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.6, ease: EASE_DRIVE }}
              >
                <img src={ev.src} alt={ev.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover/ev:scale-105" />
                <span className="type-data absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-1.5 pb-1 pt-5 text-[0.6rem] leading-tight text-brand-white">
                  {ev.label}
                </span>
              </m.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
