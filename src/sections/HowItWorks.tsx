import { useEffect, useRef, useState } from "react";
import { m, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProcessStep } from "@/components/process/ProcessStep";
import { VehicleIcon } from "@/components/vehicle/VehicleSilhouette";
import { ButtonLink } from "@/components/ui/Button";
import { processSteps } from "@/data/site";
import { primaryCta } from "@/config/navigation";

/** 4 pasos. La ruta se dibuja con el scroll y el vehículo avanza por ella (sin scroll-jacking). */
export function HowItWorks() {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 60%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  // el carril termina en el nodo del último paso
  const [railEnd, setRailEnd] = useState(100);
  useEffect(() => {
    const ol = listRef.current;
    if (!ol) return;
    const measure = () => {
      const last = ol.lastElementChild as HTMLElement | null;
      if (last && ol.offsetHeight) setRailEnd(((last.offsetTop + 40) / ol.offsetHeight) * 100);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ol);
    return () => ro.disconnect();
  }, []);
  const top = useTransform(progress, [0, 1], ["0%", "100%"]);
  const scaleY = progress;

  return (
    <section id="como-funciona" aria-labelledby="proceso-title" className="relative overflow-hidden bg-paper py-24 text-brand-blue-dark md:py-36">
      <div className="bg-grid-paper absolute inset-0 [mask-image:linear-gradient(90deg,transparent,black_40%,black_60%,transparent)]" aria-hidden />
      <div className="container-pc relative grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              id="proceso-title"
              index="08"
              tone="light"
              eyebrow="Cómo funciona"
              title="De tu objetivo al territorio en 4 pasos."
              body="Un solo equipo coordina la campaña completa, desde el plan hasta el reporte."
            />
            <ButtonLink href={primaryCta.href} variant="light" className="mt-10" icon={<ArrowUpRight className="size-4" aria-hidden />}>
              Crear una campaña
            </ButtonLink>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          {/* Carril de la ruta */}
          <div className="absolute left-7 top-7 w-px -translate-x-1/2 md:left-10 md:top-10" style={{ height: `calc(${railEnd}% - 40px)` }} aria-hidden>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgb(11_26_61/0.25)_0_4px,transparent_4px_10px)]" />
            <m.div style={{ scaleY }} className="absolute inset-0 origin-top bg-gradient-to-b from-brand-blue to-brand-green" />
            <m.div style={{ top }} className="absolute left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <span className="block rotate-90 rounded-lg bg-brand-blue-dark px-1.5 py-1 shadow-lg ring-2 ring-paper">
                <VehicleIcon className="w-9" bodyColor="var(--publicalle-white)" />
              </span>
            </m.div>
          </div>
          <ol ref={listRef} className="relative">
            {processSteps.map((s, i) => (
              <ProcessStep key={s.id} step={s} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
