import { useEffect } from "react";
import { m } from "motion/react";
import { ArrowDown, ArrowRight, Camera, Clapperboard, Clock, MapPinned, MonitorPlay, Repeat, Route, Satellite, School, Signpost, Volume2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow, SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppIcon } from "@/components/contact/WhatsAppButton";
import { SelloPubliEscuela } from "@/components/publiescuela/Sello";
import { RecorridoVisual } from "@/components/publiescuela/RecorridoVisual";
import { Configurador } from "@/components/publiescuela/Configurador";
import { PE, lempiras, miles, reproducciones, reproduccionesDia } from "@/lib/publiescuela";
import { VehiclePhoto } from "@/components/vehicle/VehiclePhoto";
import { whatsappUrl } from "@/lib/whatsapp";
import { reveal, stagger, viewportOnce } from "@/lib/motion";

/**
 * /publi-escuela — servicio de Publicalle MOVE.
 * Vive dentro del sitio: mismo header, footer, tokens, mapa y formulario de solicitudes.
 */
export default function PubliEscuela() {
  useEffect(() => {
    const prev = document.title;
    document.title = "PubliEscuela · Un servicio de Publicalle";
    // Enlace directo a una parte de la página (/publi-escuela#configurar)
    const id = decodeURIComponent(window.location.hash.slice(1));
    const t = id ? setTimeout(() => document.getElementById(id)?.scrollIntoView(), 80) : undefined;
    return () => {
      document.title = prev;
      if (t) clearTimeout(t);
    };
  }, []);

  return (
    <>
      <Hero />
      <QueIncluye />
      <ComoFunciona />
      <section id="configurar" aria-labelledby="configurar-title" className="relative scroll-mt-20 py-20 md:py-28">
        <div className="bg-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" aria-hidden />
        <div className="container-pc relative grid gap-12">
          <SectionHeading id="configurar-title" eyebrow="Configurador" index="04" title="Arma la campaña de tu escuela" body="Ubica tu escuela, elige la duración y el horario. Ves la disponibilidad real antes de enviar." />
          <Configurador />
        </div>
      </section>
      <DataPE />
      <Cierre />
    </>
  );
}

const grad = "bg-[linear-gradient(100deg,var(--publicalle-green-light),var(--publicalle-green)_50%,var(--publicalle-blue-electric))] bg-clip-text text-transparent";

function Hero() {
  return (
    <section id="inicio" aria-labelledby="pe-title" className="relative overflow-hidden pb-16 pt-[calc(var(--nav-h)+3rem)] md:pb-24 md:pt-40">
      <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_60%_at_60%_40%,black,transparent)]" aria-hidden />
      <div className="container-pc relative grid items-center gap-12 lg:grid-cols-12">
        <m.div variants={stagger(0.1)} initial="hidden" animate="show" className="flex flex-col gap-6 lg:col-span-6">
          <m.nav variants={reveal} aria-label="Ruta" className="type-data flex items-center gap-2 text-xs text-muted">
            <a href="/" className="hover:text-brand-white">Publicalle</a>
            <span aria-hidden>/</span>
            <a href="/#move" className="hover:text-brand-white">Move</a>
            <span aria-hidden>/</span>
            <span className="text-brand-green" aria-current="page">PubliEscuela</span>
          </m.nav>
          <m.div variants={reveal}>
            <SelloPubliEscuela />
          </m.div>
          <m.h1 id="pe-title" variants={reveal} className="type-display text-[clamp(2.4rem,6.4vw,5rem)]">
            Tu escuela, <span className={grad}>en pantalla y en movimiento.</span>
          </m.h1>
          <m.p variants={reveal} className="max-w-[54ch] text-lg leading-relaxed text-muted">
            Una <b className="font-semibold text-brand-white">unidad móvil con pantalla LED y audio</b> recorre los barrios y colonias alrededor de tu escuela{" "}
            <b className="font-semibold text-brand-white">{PE.horasDia} horas diarias</b>, se detiene en esquinas y calles concurridas y reproduce en bucle un{" "}
            <b className="font-semibold text-brand-white">video de {PE.videoSeg} segundos</b> con los servicios de tu escuela. Todo el recorrido se monitorea por GPS.
          </m.p>
          <m.div variants={reveal} className="flex flex-wrap gap-3">
            <ButtonLink href="#configurar" size="lg" icon={<ArrowRight className="size-4" aria-hidden />}>Configurar campaña</ButtonLink>
            <ButtonLink href="#que-incluye" size="lg" variant="secondary" icon={<ArrowDown className="size-4" aria-hidden />}>Conocer el servicio</ButtonLink>
          </m.div>
          <m.ul variants={reveal} className="type-data flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-white/80">
            <li className="flex items-center gap-2"><MonitorPlay className="size-4 text-brand-green" aria-hidden />Pantalla LED + audio</li>
            <li className="flex items-center gap-2"><Clapperboard className="size-4 text-brand-green" aria-hidden />Video de {PE.videoSeg} s incluido</li>
            <li className="flex items-center gap-2"><Repeat className="size-4 text-brand-green" aria-hidden />{miles(reproduccionesDia())} reproducciones/día</li>
            <li className="flex items-center gap-2"><Satellite className="size-4 text-brand-green" aria-hidden />Monitoreo GPS</li>
          </m.ul>
        </m.div>
        <m.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} className="relative lg:col-span-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-surface/70 px-4 pb-8 pt-16 ring-1 ring-inset ring-line sm:px-8">
            <RecorridoVisual className="pointer-events-none absolute inset-0 h-full w-full opacity-35" />
            <p className="type-data absolute left-5 top-5 flex items-center gap-2 rounded-full bg-brand-bg/85 px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-brand-green ring-1 ring-inset ring-brand-green/30">
              <span className="relative flex size-2" aria-hidden><span className="absolute inset-0 animate-ping-soft rounded-full bg-brand-green" /><span className="relative size-2 rounded-full bg-brand-green" /></span>
              GPS activo · recorrido 2 h
            </p>
            <VehiclePhoto priority className="relative w-full" screenMessages={["TU ESCUELA AQUÍ", "MATRÍCULA ABIERTA", `VIDEO DE ${PE.videoSeg} s`]} alt="Unidad móvil de Publicalle con pantalla LED en el techo y parlante de audio" />
            <p className="relative mt-5 text-center text-xs text-muted">Unidad móvil de Publicalle · pantalla LED + audio · mensaje de ejemplo</p>
          </div>
        </m.div>
      </div>
    </section>
  );
}

const incluye = [
  { icon: MonitorPlay, t: "Unidad móvil con pantalla LED", b: "El vehículo de Publicalle con pantalla en el techo, visible desde la calle y las aceras." },
  { icon: Volume2, t: "Audio en el recorrido", b: "El audio del video acompaña la pantalla para que tu escuela se escuche en cada cuadra." },
  { icon: Clapperboard, t: `Video de ${PE.videoSeg} s incluido`, b: "Lo creamos con los servicios de tu escuela: matrícula, niveles, horarios, becas, actividades." },
  { icon: Repeat, t: "En bucle, todo el recorrido", b: `Se reproduce mientras la unidad avanza y cuando está detenida: ${miles(reproduccionesDia())} veces por día.` },
  { icon: Signpost, t: "Paradas estratégicas", b: "La unidad se detiene por periodos de tiempo en esquinas y calles concurridas de la zona." },
  { icon: Satellite, t: "Monitoreo por GPS", b: "Cada recorrido queda registrado por GPS: dónde estuvo la unidad, en qué fecha y horario." },
];

function QueIncluye() {
  return (
    <section id="que-incluye" aria-labelledby="incluye-title" className="relative scroll-mt-20 border-t border-line py-20 md:py-28">
      <div className="container-pc grid gap-12">
        <SectionHeading id="incluye-title" eyebrow="En qué consiste" index="02" title="Publicidad con pantalla y audio alrededor de tu escuela" body={`Llevamos tu escuela a los barrios y colonias de las familias que quieres atraer: ${PE.horasDia} horas al día, con un video de ${PE.videoSeg} segundos que se repite en bucle durante todo el recorrido.`} />
        <m.ul variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {incluye.map((x) => (
            <m.li key={x.t} variants={reveal} className="grid content-start gap-3 rounded-3xl bg-surface/60 p-6 ring-1 ring-inset ring-line">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-blue-dark/70 text-brand-green-light">
                <x.icon className="size-6" aria-hidden />
              </span>
              <h3 className="text-lg font-bold tracking-tight">{x.t}</h3>
              <p className="text-[0.95rem] leading-relaxed text-muted">{x.b}</p>
            </m.li>
          ))}
        </m.ul>
        {/* Reproducciones del video según la duración */}
        <div className="grid gap-4 rounded-3xl bg-[linear-gradient(160deg,rgb(10_47_114/0.5),rgb(10_19_38/0.85))] p-6 ring-1 ring-inset ring-white/10 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight">Reproducciones de tu video</h3>
            <p className="type-data text-xs text-muted">{PE.horasDia} h × 3,600 s ÷ {PE.videoSeg} s = {miles(reproduccionesDia())} por día</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PE.duraciones.map((d) => (
              <div key={d} className="rounded-2xl bg-brand-bg/60 p-4 ring-1 ring-inset ring-line">
                <dt className="text-sm text-muted">{d} días</dt>
                <dd className={`type-data mt-1 text-2xl font-semibold ${grad}`}>{miles(reproducciones(d))}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted">Veces que se reproduce el video en la pantalla durante el servicio. No es una medición de personas alcanzadas.</p>
        </div>
      </div>
    </section>
  );
}

const pasos = [
  { icon: School, t: "Ubicas tu escuela", b: "Marcas tu escuela (y otras sedes) y cuántos kilómetros alrededor: los barrios y colonias de las familias que quieres atraer." },
  { icon: Clapperboard, t: "Creamos tu video", b: `Preparamos el video de ${PE.videoSeg} segundos con los servicios de tu escuela. Está incluido.` },
  { icon: Route, t: "Recorremos la zona", b: `La unidad con pantalla y audio recorre la zona ${PE.horasDia} h al día y se detiene en esquinas y calles concurridas. Puedes sumar volanteo.` },
  { icon: Satellite, t: "Monitoreamos por GPS", b: "Ves por dónde pasó la unidad, en qué fecha y horario, con fotos de evidencia, en tu portal de cliente." },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="como-title" className="relative scroll-mt-20 border-y border-line bg-surface/40 py-20 md:py-28">
      <div className="container-pc grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="grid gap-10 lg:col-span-7">
          <SectionHeading id="como-title" eyebrow="Cómo funciona" index="03" title="Pantalla en movimiento + presencia territorial + evidencia" body="No es solo perifoneo: es una campaña planificada alrededor de tu escuela, con prueba de que se hizo." />
          <m.ol variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid gap-4 sm:grid-cols-2">
            {pasos.map((p, i) => (
              <m.li key={p.t} variants={reveal} className="relative grid content-start gap-4 rounded-3xl bg-brand-bg/60 p-6 ring-1 ring-inset ring-line">
                <span className="type-data text-sm text-muted">0{i + 1}</span>
                <span className="grid size-12 place-items-center rounded-xl bg-brand-blue-dark/70 text-brand-green-light">
                  <p.icon className="size-6" aria-hidden />
                </span>
                <h3 className="text-lg font-bold tracking-tight">{p.t}</h3>
                <p className="text-[0.95rem] leading-relaxed text-muted">{p.b}</p>
              </m.li>
            ))}
          </m.ol>
        </div>
        <m.div variants={reveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="lg:col-span-5">
          <div className="rounded-[2rem] bg-surface/70 p-3 ring-1 ring-inset ring-line">
            <RecorridoVisual className="h-auto w-full" />
          </div>
        </m.div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-white/[0.03] px-6 py-4 text-sm ring-1 ring-inset ring-line lg:col-span-12">
          <span className="font-semibold">Complemento:</span>
          <span className="text-muted">Volanteo · hasta 5,000 volantes en blanco y negro, 1/4 de página, impresión y distribución</span>
          <span className="type-data font-semibold text-brand-green-light">{lempiras(PE.volanteo.precio)}</span>
        </div>
      </div>
    </section>
  );
}

/** Publicalle Data aplicado a PubliEscuela. Ejemplo ilustrativo: sin métricas de audiencia. */
const bitacora = [
  { fecha: "Lun 3", hora: "06:00 – 08:00", zona: "Colonias alrededor de la escuela", estado: "Recorrido documentado" },
  { fecha: "Mar 4", hora: "06:00 – 08:00", zona: "Colonias alrededor de la escuela", estado: "Recorrido documentado" },
  { fecha: "Mié 5", hora: "06:00 – 08:00", zona: "Colonias alrededor de la escuela", estado: "En curso" },
];

function DataPE() {
  return (
    <section id="publicalle-data" aria-labelledby="data-title" className="relative overflow-hidden py-20 md:py-28">
      <div className="container-pc grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="grid gap-8 lg:col-span-5">
          <SectionHeading id="data-title" eyebrow="Publicalle Data · Monitoreo GPS" index="05" title="Tu campaña sale a la calle. Nosotros documentamos el recorrido." body="La unidad lleva GPS durante todo el servicio: registramos por dónde pasó, cuándo y cuánto tiempo estuvo en tu zona." />
          <ul className="grid gap-3">
            {[
              { icon: Satellite, t: "Monitoreo GPS de la unidad durante las 2 h" },
              { icon: Route, t: "Recorrido trazado dentro de tu zona" },
              { icon: Clock, t: "Fecha y horario de cada jornada" },
              { icon: Camera, t: "Fotos de evidencia con hora y ubicación" },
              { icon: MapPinned, t: "Kilómetros recorridos dentro de la zona" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3.5 ring-1 ring-inset ring-line">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-blue-dark/70 text-brand-green-light">
                  <x.icon className="size-4" aria-hidden />
                </span>
                <span className="text-[0.95rem] font-medium">{x.t}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            Lo ves en tu <a href="/entrar" className="text-brand-green-light underline underline-offset-4">portal de cliente</a>. Documentamos la ejecución: no estimamos audiencia ni personas alcanzadas.
          </p>
        </div>
        <m.div variants={reveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="lg:col-span-7">
          <div className="grid gap-4 rounded-[2rem] bg-surface p-4 ring-1 ring-inset ring-line sm:p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>Demostración</Eyebrow>
              <span className="type-data rounded-full bg-white/[0.05] px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-muted">Datos de ejemplo</span>
            </div>
            {/* Mapa → ruta → fecha → zona → campaña */}
            <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
              <div className="overflow-hidden rounded-2xl bg-brand-bg ring-1 ring-inset ring-line">
                <RecorridoVisual className="h-full w-full" />
              </div>
              <ol className="grid content-start gap-2">
                {[["Mapa", "Tegucigalpa"], ["Ruta", "Barrios alrededor de la escuela"], ["Fecha", "Lunes a viernes"], ["Zona", "Radio de 1 km"], ["Campaña", "Tu marca"]].map(([k, v], i) => (
                  <li key={k} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-line">
                    <span className="type-data text-xs text-brand-green">0{i + 1}</span>
                    <span className="text-sm font-semibold">{k}</span>
                    <span className="ml-auto text-right text-xs text-muted">{v}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <caption className="sr-only">Ejemplo de bitácora de recorridos</caption>
                <thead className="type-data text-xs uppercase tracking-[0.14em] text-muted">
                  <tr><th className="py-2 font-normal">Fecha</th><th className="py-2 font-normal">Horario</th><th className="py-2 font-normal">Zona</th><th className="py-2 text-right font-normal">Estado</th></tr>
                </thead>
                <tbody>
                  {bitacora.map((r) => (
                    <tr key={r.fecha} className="border-t border-line">
                      <td className="py-2.5 font-medium">{r.fecha}</td>
                      <td className="type-data py-2.5">{r.hora}</td>
                      <td className="py-2.5 text-muted">{r.zona}</td>
                      <td className="py-2.5 text-right text-brand-green-light">{r.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}

function Cierre() {
  return (
    <section aria-label="Más información" className="border-t border-line py-16">
      <div className="container-pc flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="grid gap-2">
          <SelloPubliEscuela size="sm" />
          <p className="text-muted">PubliEscuela es parte de Publicalle MOVE. También puedes combinarlo con eventos y ubicaciones fijas.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={whatsappUrl("Hola Publicalle, quiero información sobre PubliEscuela.")} target="_blank" rel="noopener noreferrer" variant="secondary" icon={<WhatsAppIcon className="size-4" />}>Preguntar por WhatsApp</ButtonLink>
          <ButtonLink href="/" variant="ghost">Volver a Publicalle</ButtonLink>
        </div>
      </div>
    </section>
  );
}
