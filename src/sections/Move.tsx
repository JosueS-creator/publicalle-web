import { useRef } from "react";
import { m, useScroll } from "motion/react";
import { Clapperboard, Megaphone, MonitorPlay, Music, Newspaper, Wifi } from "lucide-react";
import { LineHeading } from "@/components/ui/LineHeading";
import { VehicleShowcase } from "@/components/vehicle/VehicleShowcase";
import { StreetVideo } from "@/components/vehicle/StreetVideo";
import { move } from "@/data/site";
import { brand } from "@/config/brand";
import { reveal, stagger, viewportOnce } from "@/lib/motion";
import streetVideo from "@/assets/media/publicalle-calle.mp4";
import streetPoster from "@/assets/media/publicalle-calle-poster.jpg";

/** Un ícono por servicio, en el mismo orden que move.services. */
const serviceIcons = [MonitorPlay, Clapperboard, Megaphone, Music, Newspaper, Wifi];

/** Hotspots sobre la foto (en % de la imagen volteada). */
const hotspots = [
  { id: "pantalla", x: 43.5, y: 9, label: "Pantalla LED" },
  { id: "audio", x: 58.5, y: 15, label: "Perifoneo" },
];

/** 03 — Publicalle Move: la pieza estrella (vehículo real a gran escala). */
export function Move() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section ref={ref} id="move" aria-labelledby="move-title" className="relative overflow-hidden py-24 md:py-32">
      <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_60%_at_50%_55%,black,transparent)]" aria-hidden />
      <div className="container-pc relative">
        <LineHeading id="move-title" index="03" line="MOVE" kicker="Publicidad en movimiento" subtitle={move.title} body={move.body} />
      </div>

      <VehicleShowcase
        className="mt-10 md:mt-14"
        progress={scrollYProgress}
        screenMessages={move.screenMessages}
        backdropText={brand.signature.toUpperCase()}
        hotspots={hotspots}
      />

      <div className="container-pc relative mt-16 grid gap-10 md:mt-20 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <h3 className="type-eyebrow text-muted">Servicios incluidos</h3>
          <m.ul variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={viewportOnce} className="mt-5 grid gap-3 sm:grid-cols-2">
            {move.services.map((s, i) => {
              const Icon = serviceIcons[i];
              return (
                <m.li key={s} variants={reveal} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3.5 ring-1 ring-inset ring-line">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-blue-dark/70 text-brand-green-light">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-[0.95rem] font-medium text-brand-white/90">{s}</span>
                </m.li>
              );
            })}
          </m.ul>
        </div>
        <m.div variants={reveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="lg:col-span-7">
          <StreetVideo src={streetVideo} poster={streetPoster} title={move.video.title} caption={move.video.caption} />
        </m.div>
      </div>
    </section>
  );
}
