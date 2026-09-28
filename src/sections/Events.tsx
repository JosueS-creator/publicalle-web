import { m } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { LineHeading } from "@/components/ui/LineHeading";
import { EventCard } from "@/components/events/EventCard";
import { ButtonLink } from "@/components/ui/Button";
import { eventBlocks, events } from "@/data/site";
import { primaryCta } from "@/config/navigation";
import { stagger, viewportOnce } from "@/lib/motion";

/** 04 — Publicalle Events: activaciones y experiencias presenciales. */
export function Events() {
  return (
    <section id="events" aria-labelledby="events-title" className="relative overflow-hidden bg-brand-graphite/40 py-24 md:py-32">
      <div className="pointer-events-none absolute -left-40 top-10 size-[36rem] rounded-full bg-brand-green/10 blur-[140px]" aria-hidden />
      <div className="container-pc relative">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <LineHeading id="events-title" index="04" line="EVENTS" kicker="Activaciones y experiencias" subtitle={events.title} body={events.body} />
          <ButtonLink href={primaryCta.href} variant="secondary" className="self-start md:self-end" icon={<ArrowUpRight className="size-4" aria-hidden />}>
            Planear una activación
          </ButtonLink>
        </div>
        <m.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={viewportOnce} className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {eventBlocks.map((b, i) => (
            <EventCard key={b.id} block={b} index={i} wide={i === 0 || i === 3} />
          ))}
        </m.div>
      </div>
    </section>
  );
}
