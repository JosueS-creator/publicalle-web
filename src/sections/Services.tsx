import { m } from "motion/react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LineCard } from "@/components/services/LineCard";
import { serviceLines } from "@/data/services";
import { servicesSection } from "@/data/site";
import { stagger, viewportOnce } from "@/lib/motion";

/** 02 — Las cuatro líneas del ecosistema. */
export function Services() {
  return (
    <section id="servicios" aria-labelledby="servicios-title" className="relative py-24 md:py-32">
      <div className="container-pc">
        <SectionHeading id="servicios-title" index="02" eyebrow={servicesSection.eyebrow} title={servicesSection.title} body={servicesSection.body} />
        <m.div
          variants={stagger(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-4 lg:gap-5"
        >
          {serviceLines.map((l, i) => (
            <LineCard key={l.id} line={l} index={i} />
          ))}
        </m.div>
      </div>
    </section>
  );
}
