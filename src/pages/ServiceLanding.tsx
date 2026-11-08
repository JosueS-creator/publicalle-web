import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { ServicePhotoCarousel, type GalleryImage } from "@/components/gallery/ServicePhotoCarousel";
import { WhatsAppButton } from "@/components/contact/WhatsAppButton";

type Landing = {
  eyebrow: string;
  title: string;
  lead: string;
  intro: string;
  benefits: string[];
  process: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  related: { label: string; href: string; detail: string }[];
  whatsapp: string;
  accent: string;
  gallery: { title: string; images: GalleryImage[] };
};

const pages: Record<string, Landing> = {
  "/publicidad-en-honduras": {
    eyebrow: "Soluciones para marcas y empresas",
    title: "Publicidad en Honduras que conecta tu marca con las personas.",
    lead: "Planificamos y ejecutamos campañas territoriales con publicidad móvil, pantalla LED, perifoneo, activaciones BTL y espacios publicitarios.",
    intro: "Publicalle reúne distintos formatos de publicidad para que las empresas puedan llevar su mensaje a las zonas y espacios donde está su público. Diseñamos cada campaña según el objetivo, la ciudad y el alcance operativo que se necesita.",
    benefits: ["Publicidad móvil con pantalla LED y audio", "Perifoneo y comunicación en movimiento", "Activaciones BTL con carpas, audio y promotores", "Espacios físicos y ubicaciones estratégicas", "Registro de rutas y evidencias de ejecución"],
    process: [
      { title: "Cuéntanos qué quieres lograr", body: "Comparte el objetivo, el público, la ciudad y las fechas tentativas de tu campaña." },
      { title: "Diseñamos la propuesta", body: "Revisamos los formatos y combinaciones que mejor responden a tu necesidad." },
      { title: "Coordinamos la ejecución", body: "Definimos zonas, recorridos, ubicaciones y actividades según el plan aprobado." },
      { title: "Documentamos la campaña", body: "Organizamos evidencias de campo y la información disponible de la ejecución." },
    ],
    faq: [
      { q: "¿Publicalle trabaja en todo Honduras?", a: "Publicalle ofrece cobertura nacional. La planificación, disponibilidad y logística se confirman según la ciudad, las fechas y el tipo de campaña." },
      { q: "¿Puedo combinar varios servicios?", a: "Sí. Podemos evaluar una campaña que combine publicidad móvil, perifoneo, activaciones BTL y espacios publicitarios." },
      { q: "¿Cómo solicito una cotización?", a: "Escríbenos por WhatsApp e indica qué deseas promocionar, en qué ciudad y para qué fechas. Un asesor podrá revisar los detalles contigo." },
    ],
    related: [
      { label: "Publicidad móvil", href: "/publicidad-movil", detail: "Campañas en movimiento con vehículos, pantalla y audio." },
      { label: "Pantallas LED", href: "/pantallas-led", detail: "Lleva tu mensaje en formato audiovisual a las calles." },
      { label: "Perifoneo", href: "/perifoneo", detail: "Comunica promociones y mensajes mediante audio móvil." },
      { label: "Activaciones BTL", href: "/activaciones-btl", detail: "Conecta cara a cara con tu público." },
    ],
    whatsapp: "Hola Publicalle, quiero cotizar una campaña de publicidad en Honduras.",
      gallery: {
      title: "Publicalle en acción",
      images: [
        { src: "/images/servicios/Carpa1.jpg", alt: "Carpa de activación promocional" },
        { src: "/images/servicios/PPM1.jpg", alt: "Unidad y formato de publicidad móvil" },
        { src: "/images/servicios/Perifoneo1.jpg", alt: "Servicio de perifoneo móvil" },
        { src: "/images/servicios/Promotora1.jpg", alt: "Promotora en actividad de marca" },
        { src: "/images/servicios/volanteo1.jpg", alt: "Actividad de volanteo promocional" },
      ],
    },
    accent: "Una campaña. Diferentes formas de llegar a tu público.",
  },
  "/publicidad-movil": {
    eyebrow: "Publicalle Move · Publicidad en movimiento",
    title: "Publicidad móvil en Honduras para llevar tu marca a las calles.",
    lead: "Lleva tu mensaje a diferentes zonas con una unidad móvil equipada con pantalla LED y audio para perifoneo.",
    intro: "Publicalle Move convierte el recorrido en un espacio de comunicación para tu marca. La campaña se planifica de acuerdo con la ciudad, las zonas de interés, el mensaje y el tiempo disponible.",
    benefits: ["Vehículo con pantalla LED en el techo", "Audio para perifoneo y animación", "Reproducción de spots y mensajes de marca", "Posibilidad de integrar entrega de volantes y material publicitario", "Planificación de recorridos según el objetivo de campaña"],
    process: [
      { title: "Definimos el objetivo", body: "Conocemos tu producto, público, ciudad y fechas." },
      { title: "Preparamos el mensaje", body: "Revisamos el spot, el contenido de pantalla y el audio que se utilizará." },
      { title: "Planificamos el recorrido", body: "Acordamos las zonas y la operación según la propuesta aprobada." },
      { title: "Ejecutamos y documentamos", body: "Realizamos la campaña y organizamos las evidencias disponibles." },
    ],
    faq: [
      { q: "¿Qué incluye la publicidad móvil?", a: "La propuesta puede incluir unidad móvil con pantalla LED y audio, reproducción de spots, perifoneo y otros apoyos como entrega de material publicitario, según lo cotizado." },
      { q: "¿En qué ciudades está disponible?", a: "Publicalle trabaja con cobertura nacional. La disponibilidad y el recorrido se confirman para cada ciudad y fecha." },
      { q: "¿Puedo contratar solo pantalla o solo audio?", a: "Cuéntanos el objetivo de tu campaña. Revisaremos qué formato y combinación están disponibles para tu necesidad." },
    ],
    related: [
      { label: "Pantallas LED", href: "/pantallas-led", detail: "Conoce el formato audiovisual móvil." },
      { label: "Perifoneo", href: "/perifoneo", detail: "Amplía tu mensaje con audio en movimiento." },
      { label: "Activaciones BTL", href: "/activaciones-btl", detail: "Combina el recorrido con experiencias presenciales." },
    ],
    whatsapp: "Hola Publicalle, quiero cotizar publicidad móvil para mi marca.",
      gallery: {
      title: "Publicidad móvil en movimiento",
      images: [
        { src: "/images/servicios/PPM1.jpg", alt: "Publicidad móvil Publicalle" },
        { src: "/images/servicios/PPM2.jpg", alt: "Unidad de publicidad móvil en campaña" },
        { src: "/images/servicios/PPM3.jpg", alt: "Ejecución de publicidad móvil" },
        { src: "/images/servicios/megavalla - Copy.jpg", alt: "Formato de publicidad exterior móvil" },
        { src: "/images/servicios/IMG_20261007_090650484_HDR.jpg", alt: "Registro fotográfico de campaña Publicalle" },
      ],
    },
    accent: "Tu marca recorriendo la ciudad.",
  },
  "/pantallas-led": {
    eyebrow: "Publicalle Move · Formato audiovisual",
    title: "Pantalla LED móvil para publicidad en Honduras.",
    lead: "Muestra el mensaje de tu marca en una pantalla LED instalada sobre una unidad móvil que recorre las zonas planificadas para tu campaña.",
    intro: "El formato de pantalla LED móvil permite presentar contenido audiovisual mientras la unidad se desplaza por los recorridos acordados. Es una alternativa para lanzamientos, promociones y campañas que buscan presencia en diferentes puntos de una ciudad.",
    benefits: ["Pantalla LED instalada en la unidad móvil", "Exhibición de spots y piezas audiovisuales", "Integración con perifoneo y audio", "Recorridos planificados según la campaña", "Opción de complementar con activaciones y material promocional"],
    process: [
      { title: "Comparte tu pieza", body: "Indica si ya tienes un video o si necesitas orientación para preparar el contenido." },
      { title: "Definimos la campaña", body: "Revisamos duración, ciudad, zonas y fechas para preparar la propuesta." },
      { title: "Coordinamos la ruta", body: "Acordamos los recorridos y condiciones operativas antes de iniciar." },
      { title: "Realizamos la ejecución", body: "La pantalla presenta el contenido durante la operación planificada." },
    ],
    faq: [
      { q: "¿La pantalla LED es móvil?", a: "Sí. El formato descrito corresponde a una pantalla LED instalada en el techo de una unidad móvil de Publicalle Move." },
      { q: "¿Puedo utilizar mi propio video?", a: "Puedes compartir tu pieza audiovisual para revisar sus características y compatibilidad con la reproducción." },
      { q: "¿La pantalla puede combinarse con perifoneo?", a: "Sí. La unidad móvil también cuenta con audio para perifoneo, sujeto a la planificación de la campaña." },
    ],
    related: [
      { label: "Publicidad móvil", href: "/publicidad-movil", detail: "Conoce la solución completa de Publicalle Move." },
      { label: "Perifoneo", href: "/perifoneo", detail: "Complementa la pantalla con comunicación por audio." },
      { label: "Publicidad en Honduras", href: "/publicidad-en-honduras", detail: "Explora todas las soluciones de Publicalle." },
    ],
    whatsapp: "Hola Publicalle, quiero cotizar una campaña con pantalla LED móvil.",
      gallery: {
      title: "Pantallas LED en campaña",
      images: [
        { src: "/images/servicios/PPM1.jpg", alt: "Pantalla y formato audiovisual móvil" },
        { src: "/images/servicios/PPM2.jpg", alt: "Publicidad móvil con contenido visual" },
        { src: "/images/servicios/PPM3.jpg", alt: "Ejecución de campaña audiovisual" },
        { src: "/images/servicios/megavalla - Copy.jpg", alt: "Publicidad exterior en gran formato" },
      ],
    },
    accent: "Tu mensaje en movimiento y a la vista.",
  },
  "/perifoneo": {
    eyebrow: "Publicalle Move · Audio móvil",
    title: "Servicio de perifoneo en Honduras para campañas y promociones.",
    lead: "Comunica anuncios, promociones y mensajes de marca mediante audio desde una unidad móvil que recorre las zonas planificadas.",
    intro: "El perifoneo permite llevar un mensaje hablado o grabado a diferentes sectores durante un recorrido. En Publicalle puede integrarse con la pantalla LED móvil y otros recursos de campaña, de acuerdo con el objetivo y la propuesta aprobada.",
    benefits: ["Difusión de mensajes grabados o locución según coordinación", "Audio desde una unidad móvil", "Recorridos definidos para cada campaña", "Posibilidad de combinar perifoneo y pantalla LED", "Opción de complementar con volanteo y activaciones"],
    process: [
      { title: "Definimos el mensaje", body: "Revisamos qué deseas comunicar y a qué público quieres llegar." },
      { title: "Seleccionamos el formato", body: "Acordamos el audio, el contenido y los recursos que formarán parte de la campaña." },
      { title: "Planificamos las zonas", body: "Definimos ciudad, sectores, fechas y recorrido de acuerdo con la propuesta." },
      { title: "Ejecutamos la campaña", body: "Realizamos el recorrido coordinado y documentamos la ejecución disponible." },
    ],
    faq: [
      { q: "¿Qué tipo de mensajes se pueden difundir?", a: "Podemos revisar mensajes promocionales, anuncios comerciales, invitaciones y comunicaciones de campaña, según el contenido y las condiciones de operación." },
      { q: "¿El perifoneo puede contratarse con pantalla LED?", a: "Sí. Publicalle Move integra pantalla LED y audio en una misma unidad móvil." },
      { q: "¿Puedo solicitar cobertura en mi ciudad?", a: "Sí. Indica la ciudad y las zonas de interés para confirmar la planificación y disponibilidad." },
    ],
    related: [
      { label: "Publicidad móvil", href: "/publicidad-movil", detail: "Conoce la unidad móvil y sus formatos." },
      { label: "Pantallas LED", href: "/pantallas-led", detail: "Combina audio con contenido audiovisual." },
      { label: "Activaciones BTL", href: "/activaciones-btl", detail: "Integra experiencias presenciales a tu campaña." },
    ],
    whatsapp: "Hola Publicalle, quiero cotizar un servicio de perifoneo.",
      gallery: {
      title: "Perifoneo y comunicación en movimiento",
      images: [
        { src: "/images/servicios/Perifoneo1.jpg", alt: "Equipo de perifoneo Publicalle" },
        { src: "/images/servicios/perifoneo2.jpg", alt: "Unidad de perifoneo en operación" },
        { src: "/images/servicios/perifoneo3.jpg", alt: "Campaña de perifoneo móvil" },
        { src: "/images/servicios/Perifoneo4.jpg", alt: "Servicio de audio móvil" },
        { src: "/images/servicios/perifoneo5.jpg", alt: "Actividad de perifoneo" },
      ],
    },
    accent: "Haz que tu mensaje se escuche en tu zona.",
  },
  "/activaciones-btl": {
    eyebrow: "Publicalle Events · Experiencias presenciales",
    title: "Activaciones BTL en Honduras para acercar tu marca al público.",
    lead: "Creamos experiencias presenciales con carpas, audio, animación, promotores y material publicitario para conectar tu marca con las personas.",
    intro: "Las activaciones BTL permiten generar interacción directa con el público en espacios y momentos definidos. Publicalle Events coordina los elementos de la experiencia de acuerdo con el objetivo, el lugar y las necesidades de cada campaña.",
    benefits: ["Carpas, mesas, sillas y montaje", "Audio, parlantes y micrófonos", "Animadores, concursos y dinámicas", "Promotores e impulso de marca", "Entrega de material promocional y POP"],
    process: [
      { title: "Definimos la experiencia", body: "Conversamos sobre el producto, el público y la interacción que buscas generar." },
      { title: "Organizamos los recursos", body: "Revisamos espacio, carpas, audio, personal y materiales necesarios." },
      { title: "Coordinamos lugar y fecha", body: "Confirmamos las condiciones de la activación y la disponibilidad operativa." },
      { title: "Activamos tu marca", body: "Ejecutamos la experiencia y organizamos las evidencias disponibles." },
    ],
    faq: [
      { q: "¿Qué incluye una activación BTL?", a: "Puede incluir carpas, mesas, sillas, branding, audio, animadores, promotores y material promocional, según el diseño de la campaña." },
      { q: "¿Puedo realizar una activación en un comercio o evento?", a: "Podemos revisar la ubicación, los permisos y las condiciones del espacio para determinar la viabilidad." },
      { q: "¿Pueden combinarse las activaciones con publicidad móvil?", a: "Sí. Podemos evaluar una campaña combinada con Publicalle Move y otros servicios." },
    ],
    related: [
      { label: "Publicidad móvil", href: "/publicidad-movil", detail: "Lleva la campaña a las calles." },
      { label: "Publicidad en Honduras", href: "/publicidad-en-honduras", detail: "Conoce todas las soluciones disponibles." },
      { label: "Perifoneo", href: "/perifoneo", detail: "Amplía la comunicación de tu activación." },
    ],
    whatsapp: "Hola Publicalle, quiero cotizar una activación BTL.",
      gallery: {
      title: "Activaciones y experiencias reales",
      images: [
        { src: "/images/servicios/Carpa1.jpg", alt: "Carpa promocional para activación de marca" },
        { src: "/images/servicios/Edecan1.jpg", alt: "Edecan en actividad promocional" },
        { src: "/images/servicios/edecan2.jpg", alt: "Personal de apoyo en activación" },
        { src: "/images/servicios/Promotora1.jpg", alt: "Promotora en campaña" },
        { src: "/images/servicios/Promotora2.jpg", alt: "Promoción e interacción con público" },
        { src: "/images/servicios/eventos1.jpg", alt: "Montaje de evento promocional" },
        { src: "/images/servicios/eventos2.jpg", alt: "Actividad de evento y marca" },
        { src: "/images/servicios/eventos3.jpg", alt: "Experiencia promocional presencial" },
        { src: "/images/servicios/eventos4.jpg", alt: "Producción de evento" },
        { src: "/images/servicios/volanteo1.jpg", alt: "Volanteo promocional" },
      ],
    },
    accent: "Convierte tu campaña en una experiencia.",
  },
};

export default function ServiceLanding() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const page = pages[path] ?? pages["/publicidad-en-honduras"];

  return (
    <div className="min-h-screen bg-brand-bg pb-20 pt-32 md:pt-40">
      <section className="container-pc">
        <div className="max-w-4xl">
          <p className="type-eyebrow text-brand-green">{page.eyebrow}</p>
          <h1 className="type-display mt-5 max-w-4xl text-4xl text-brand-white sm:text-5xl md:text-7xl">{page.title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-brand-white/75 md:text-xl">{page.lead}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton message={page.whatsapp} label="Solicitar cotización" />
            <a href="#servicio" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 font-semibold text-brand-white transition-colors hover:bg-white/5">
              Conocer el servicio <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <p className="mt-8 type-data text-xs tracking-wide text-muted">PUBLICALLE HONDURAS · COBERTURA NACIONAL</p>
        </div>
      </section>

      <section aria-label="Galería fotográfica del servicio" className="container-pc mt-16 md:mt-20">
        <ServicePhotoCarousel title={page.gallery.title} images={page.gallery.images} />
      </section>

      <section id="servicio" className="container-pc mt-20 grid gap-10 border-t border-line pt-12 md:mt-28 md:grid-cols-12 md:pt-16">
        <div className="md:col-span-5">
          <p className="type-eyebrow text-brand-green">La solución</p>
          <h2 className="type-title mt-4 text-3xl text-brand-white md:text-4xl">{page.accent}</h2>
        </div>
        <div className="md:col-span-7">
          <p className="text-lg leading-relaxed text-brand-white/75">{page.intro}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {page.benefits.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl border border-line bg-white/[0.025] p-4 text-sm leading-relaxed text-brand-white/85">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-green" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-pc mt-20 md:mt-28">
        <p className="type-eyebrow text-brand-green">Cómo trabajamos</p>
        <h2 className="type-title mt-4 max-w-2xl text-3xl text-brand-white md:text-4xl">De tu objetivo a la ejecución.</h2>
        <div className="mt-9 grid gap-4 md:grid-cols-4">
          {page.process.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-line bg-white/[0.025] p-6">
              <span className="type-data text-sm text-brand-green">0{index + 1}</span>
              <h3 className="mt-5 text-lg font-bold text-brand-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-pc mt-20 grid gap-10 md:mt-28 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="type-eyebrow text-brand-green">Preguntas frecuentes</p>
          <h2 className="type-title mt-4 text-3xl text-brand-white md:text-4xl">Antes de cotizar.</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">Si tu proyecto tiene necesidades particulares, conversemos para revisar la mejor forma de ejecutarlo.</p>
        </div>
        <div className="space-y-3 md:col-span-8">
          {page.faq.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-line bg-white/[0.025] p-5">
              <summary className="cursor-pointer list-none pr-6 font-semibold text-brand-white marker:hidden">{item.q}</summary>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="configurar" className="container-pc mt-20 md:mt-28">
        <div className="rounded-3xl border border-brand-green/20 bg-[radial-gradient(ellipse_at_top_right,rgba(34,201,180,0.13),transparent_55%),linear-gradient(135deg,rgba(21,96,200,0.15),rgba(10,19,38,0.8))] p-7 md:p-12">
          <p className="type-eyebrow text-brand-green">Hablemos de tu campaña</p>
          <h2 className="type-title mt-4 max-w-3xl text-3xl text-brand-white md:text-5xl">Cuéntanos qué quieres lograr y dónde.</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-white/70">Solicita una cotización. Revisaremos contigo el objetivo, la ciudad, las fechas y los recursos que necesita tu campaña.</p>
          <div className="mt-8"><WhatsAppButton message={page.whatsapp} label="Cotizar por WhatsApp" /></div>
        </div>
      </section>

      <section className="container-pc mt-20 md:mt-24">
        <p className="type-eyebrow text-brand-green">También te puede interesar</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {page.related.map((item) => (
            <a key={item.href} href={item.href} className="group rounded-2xl border border-line bg-white/[0.025] p-5 transition-colors hover:border-brand-green/40">
              <span className="font-semibold text-brand-white">{item.label}</span>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-green">Ver servicio <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </a>
          ))}
        </div>
      </section>

      <div className="container-pc mt-14 flex items-center gap-2 text-xs text-muted">
        <MapPin className="size-4 text-brand-green" aria-hidden />
        Cobertura nacional en Honduras · <a href="/publicidad-en-honduras" className="underline decoration-brand-green/50 underline-offset-4 hover:text-brand-white">Publicalle</a>
      </div>
    </div>
  );
}
