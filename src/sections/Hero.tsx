import { useRef, type CSSProperties } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { CoverageMap } from "@/components/coverage/CoverageMap";
import { VehiclePhoto } from "@/components/vehicle/VehiclePhoto";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { heroCoverage } from "@/data/coverage";
import { hero, move } from "@/data/site";
import { serviceLines } from "@/data/services";
import { HN_OUTLINE, HN_VIEWBOX } from "@/data/honduras";
import { EASE_DRIVE } from "@/lib/motion";

/** Partículas discretas (CSS puro, sin JS por frame). Se congelan con prefers-reduced-motion. */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 23) % 90}%`,
  size: 1.5 + (i % 3),
  dur: 9 + (i % 5) * 2.5,
  delay: -(i * 1.3),
  dx: `${((i % 4) - 1.5) * 30}px`,
  dy: `${-40 - (i % 3) * 30}px`,
  o: 0.25 + (i % 4) * 0.12,
}));

function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-brand-green-light shadow-[0_0_8px_var(--publicalle-green-light)]"
          style={
            {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animation: `drift ${p.dur}s linear ${p.delay}s infinite`,
              "--dx": p.dx,
              "--dy": p.dy,
              "--o": p.o,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Secuencia: 1) marca y titular → 2) se dibuja la ruta → 3) aparece el vehículo →
 * 4) el vehículo recorre la ruta → 5) se activan puntos → 6) indicadores.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const carX = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const mapY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);

  const words = hero.title.split(" ");
  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.8, ease: EASE_DRIVE },
  });

  return (
    <section
      id="inicio"
      ref={ref}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-[var(--nav-h)] md:pt-24"
    >
      {/* Territorio */}
      <m.div style={{ y: mapY }} className="absolute inset-0 -z-10 lg:left-[30%]" aria-hidden={false}>
        <div className="absolute inset-0 opacity-60 md:opacity-100">
          <CoverageMap data={heroCoverage} vehicleRouteId="ruta-hero" fit="slice" drawDelay={0.6} lapDuration={20} showZones title="Mapa ilustrativo: recorrido de un vehículo Publicalle activando puntos de cobertura" />
        </div>
      </m.div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--publicalle-background)_18%,rgb(5_10_23/0.75)_45%,transparent_75%)] max-lg:bg-[linear-gradient(180deg,rgb(5_10_23/0.8)_10%,rgb(5_10_23/0.35)_50%,var(--publicalle-background)_92%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-brand-bg to-transparent" />
      <Particles />

      <div className="container-pc relative flex flex-1 flex-col justify-center gap-10 pb-10 pt-10 lg:pb-16">
        <div className="max-w-[46rem]">
          <m.div {...fadeUp(0.1)}>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </m.div>

          <h1 id="hero-title" className="type-display mt-6 text-[clamp(2.55rem,7.2vw,5.6rem)]">
            <span className="sr-only">Publicalle — </span>
            {words.map((w, i) => (
              <m.span
                key={w + i}
                className={i === words.length - 1 ? "inline-block text-brand-green" : "inline-block"}
                initial={reduce ? false : { opacity: 0, y: "0.4em", filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.9, ease: EASE_DRIVE }}
              >
                {w}
                {i < words.length - 1 && " "}
              </m.span>
            ))}
          </h1>

          {/* Sin fundido de opacidad: es el elemento LCP y no debe esperar a la animación */}
          <m.p initial={reduce ? false : { y: 24 }} animate={{ y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: EASE_DRIVE }} className="mt-6 max-w-[34rem] text-lg leading-relaxed text-brand-white/75 md:text-xl">
            {hero.lead}
          </m.p>

          <m.div {...fadeUp(0.75)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={hero.primaryCta.href} size="lg" icon={<ArrowUpRight className="size-5" aria-hidden />}>
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary" icon={<ArrowDown className="size-4" aria-hidden />}>
              {hero.secondaryCta.label}
            </ButtonLink>
          </m.div>

          <m.a
            {...fadeUp(0.95)}
            href="#honduras"
            className="group mt-6 inline-flex items-center gap-3 rounded-full bg-brand-blue-dark/70 py-2 pl-2 pr-4 ring-1 ring-inset ring-brand-green/45 backdrop-blur transition-colors hover:bg-brand-blue-dark"
          >
            <span className="grid h-9 w-12 place-items-center rounded-full bg-brand-green/15">
              <svg viewBox={`0 0 ${HN_VIEWBOX.width} ${HN_VIEWBOX.height}`} className="h-5 w-auto" aria-hidden>
                <path d={HN_OUTLINE} fill="var(--publicalle-green-light)" />
              </svg>
            </span>
            <span className="text-[0.95rem] font-bold text-brand-white">
              Cobertura en <span className="text-brand-green-light">toda Honduras</span>
            </span>
            <ArrowUpRight className="size-4 text-brand-green-light transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </m.a>
        </div>

        {/* Vehículo real */}
        <m.div
          style={{ x: carX }}
          className="relative w-[min(100%,34rem)] self-center lg:absolute lg:bottom-[9%] lg:right-[4%] lg:w-[min(48vw,46rem)]"
        >
          <m.div
            initial={reduce ? false : { x: "-40%", opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.4, ease: EASE_DRIVE }}
          >
            <VehiclePhoto screenMessages={move.screenMessages} priority />
          </m.div>
        </m.div>

        {/* Ecosistema: las 4 líneas */}
        <m.nav
          aria-label="Líneas de servicio"
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{ hidden: {}, show: { transition: { delayChildren: 2.6, staggerChildren: 0.12 } } }}
          className="grid max-w-[40rem] grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-4 lg:mt-4"
        >
          {serviceLines.map((l) => (
            <m.a
              key={l.id}
              href={l.href}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_DRIVE } } }}
              className="group bg-brand-bg/80 px-4 py-3 backdrop-blur transition-colors hover:bg-brand-blue-dark/60 md:py-4"
            >
              <span className="block text-[0.95rem] font-extrabold tracking-tight text-brand-white [font-stretch:125%] group-hover:text-brand-green-light">{l.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">{l.kicker}</span>
            </m.a>
          ))}
        </m.nav>
      </div>
    </section>
  );
}
