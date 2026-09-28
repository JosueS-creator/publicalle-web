import { m } from "motion/react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { HondurasMap } from "@/components/coverage/HondurasMap";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { nationalCoverage as nc } from "@/data/site";
import { reveal, stagger, viewportOnce } from "@/lib/motion";

/** Cobertura nacional: sección destacada justo después del hero. */
export function NationalCoverage() {
  return (
    <section id="honduras" aria-labelledby="honduras-title" className="relative overflow-hidden border-y border-line bg-[radial-gradient(80%_70%_at_70%_50%,rgb(21_96_200/0.22),transparent_70%)] py-20 md:py-28">
      <div className="bg-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(70%_60%_at_65%_50%,black,transparent)]" aria-hidden />
      <div className="container-pc relative grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <m.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={viewportOnce} className="lg:col-span-5">
          <m.div variants={reveal}>
            <Eyebrow>{nc.eyebrow}</Eyebrow>
          </m.div>
          <m.h2 id="honduras-title" variants={reveal} className="type-display mt-6 text-[clamp(2.6rem,6vw,4.8rem)]">
            Cobertura en <span className="text-brand-green">toda Honduras.</span>
          </m.h2>
          <m.p variants={reveal} className="mt-6 max-w-[46ch] text-lg leading-relaxed text-brand-white/80">
            {nc.body}
          </m.p>
          <m.div variants={reveal} className="mt-8 flex items-end gap-4">
            <CountUp value={nc.highlight.value} className="type-display text-6xl text-brand-green-light" />
            <span className="pb-2 text-lg font-semibold leading-tight text-brand-white">
              {nc.highlight.label}
              <span className="block text-sm font-normal text-brand-white/70">en todo el país</span>
            </span>
          </m.div>
          <m.ul variants={reveal} className="mt-8 flex flex-wrap gap-2" aria-label="Regiones">
            {nc.regions.map((r) => (
              <li key={r} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm text-brand-white ring-1 ring-inset ring-white/15">
                <MapPin className="size-3.5 text-brand-green-light" aria-hidden />
                {r}
              </li>
            ))}
          </m.ul>
          <m.div variants={reveal} className="mt-9">
            <ButtonLink href={nc.cta.href} size="lg" icon={<ArrowUpRight className="size-5" aria-hidden />}>
              {nc.cta.label}
            </ButtonLink>
          </m.div>
        </m.div>
        <div className="-mx-3 lg:col-span-7 lg:mx-0">
          <HondurasMap />
        </div>
      </div>
    </section>
  );
}
