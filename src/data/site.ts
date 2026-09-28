import type { EventBlock, FlowNode, Metric, ProcessStepData } from "@/types";
import carpa800 from "@/assets/media/events/carpas/events-carpa-01-800.webp";
import carpa1400 from "@/assets/media/events/carpas/events-carpa-01-1400.webp";
import audio800 from "@/assets/media/events/audio/events-audio-01-800.webp";
import audio1400 from "@/assets/media/events/audio/events-audio-01-1400.webp";
import animacion540 from "@/assets/media/events/animacion/events-animacion-01-540.webp";
import promotores800 from "@/assets/media/events/promotores/events-promotores-01-800.webp";
import promotores1400 from "@/assets/media/events/promotores/events-promotores-01-1400.webp";

/** Mensaje rector de la marca. */
export const brandMessage = "Llevamos tu marca al territorio, activamos espacios y documentamos cada campaña.";

export const hero = {
  eyebrow: "Publicidad territorial medible · Honduras",
  /** La última palabra se resalta en turquesa. */
  title: "Tu marca en movimiento.",
  lead: "Publicidad que llega al territorio mediante vehículos, activaciones y espacios estratégicos, respaldada por evidencia y cobertura medible.",
  primaryCta: { label: "Crear una campaña", href: "#contacto" },
  secondaryCta: { label: "Explorar servicios", href: "#servicios" },
};

export const servicesSection = {
  eyebrow: "Servicios",
  title: "Todo lo que tu campaña necesita.",
  body: brandMessage,
};

/* ─────────────── MOVE ─────────────── */
export const move = {
  eyebrow: "Publicalle Move",
  title: "Tu publicidad recorriendo la ciudad.",
  body: "Un vehículo real, con pantalla LED en el techo y audio para perifoneo, llevando tu mensaje a las calles donde está tu público.",
  services: [
    "Pantalla LED",
    "Creación de spots",
    "Perifoneo",
    "Animación y sonido",
    "Entrega de volantes y material publicitario",
    "Conectividad",
  ],
  /** Mensajes que rotan en la pantalla LED del vehículo. */
  screenMessages: ["TU MARCA AQUÍ", "PUBLICALLE MOVE", "EN TU ZONA", "CREA TU CAMPAÑA"],
  video: {
    title: "Así se ve en la calle",
    caption: "Publicalle Move · pantalla LED y parlante en el techo",
  },
};

/* ─────────────── EVENTS ─────────────── */
export const events = {
  eyebrow: "Publicalle Events",
  title: "Haz que tu marca cobre vida con experiencias presenciales.",
  body: "Montamos la experiencia completa: espacio, sonido, animación y personas que conectan tu marca con el público.",
};

/**
 * Bloques de Events. Cuando haya fotos reales, colócalas en src/assets/images/events/
 * e impórtalas en `image` (se muestran con overlay azul/teal automáticamente).
 */
export const eventBlocks: EventBlock[] = [
  {
    id: "carpas",
    title: "Carpas",
    items: ["Carpas publicitarias", "Mesas", "Sillas", "Branding", "Montaje"],
    visual: "tent",
    image: carpa800,
    imageSrcSet: `${carpa800} 800w, ${carpa1400} 1400w`,
    imageAlt: "Carpa con banner de marca, bandera tipo pluma y parlantes durante una activación frente a un comercio",
  },
  {
    id: "audio",
    title: "Audio",
    items: ["Parlantes", "Micrófonos", "Música", "Sonido profesional"],
    visual: "audio",
    image: audio800,
    imageSrcSet: `${audio800} 800w, ${audio1400} 1400w`,
    imageAlt: "Animador con micrófono bajo una carpa de marca, con parlante en trípode y módulo de producto",
  },
  {
    id: "animacion",
    title: "Animación",
    items: ["Animadores", "Concursos", "Dinámicas", "Presentaciones"],
    visual: "animation",
    image: animacion540,
    imageAlt: "Activación dentro de una farmacia con mascota inflable y ruleta de premios",
  },
  {
    id: "promotores",
    title: "Promotores",
    items: ["Impulso de marca", "Entrega de material", "Interacción", "Activaciones"],
    visual: "promoters",
    image: promotores800,
    imageSrcSet: `${promotores800} 800w, ${promotores1400} 1400w`,
    imageAlt: "Promotora en un módulo de marca frente a una tienda mostrando producto promocional",
  },
];

/* ─────────────── PLACE ─────────────── */
export const place = {
  eyebrow: "Publicalle Place",
  title: "Pon tu marca donde está tu público.",
  body: "Desarrollamos campañas en espacios físicos: buscamos, gestionamos y activamos las ubicaciones que mejor funcionan para tu objetivo.",
  services: [
    "Espacios publicitarios",
    "Pantallas",
    "Comercios aliados",
    "Puntos de alto tráfico",
    "Fachadas",
    "Ubicaciones estratégicas",
  ],
  disclaimer: "Mapa ilustrativo. Las ubicaciones se definen para cada campaña según disponibilidad.",
};

/* ─────────────── CAMPAÑAS COMBINADAS ─────────────── */
export const combined = {
  eyebrow: "Campañas combinadas",
  title: "Una sola campaña. Múltiples soluciones.",
  body: "Combinamos movimiento, experiencias y ubicaciones en un mismo plan, y lo cerramos con un reporte de ejecución.",
  example: {
    kicker: "Campaña",
    name: "Lanzamiento de producto",
    nodes: [
      { line: "move", value: 2, label: "vehículos" },
      { line: "events", value: 4, label: "activaciones" },
      { line: "place", value: 8, label: "ubicaciones" },
    ] satisfies FlowNode[],
    result: { line: "data", value: 0, label: "Reporte final" } satisfies FlowNode,
  },
  cta: { label: "Diseñar mi campaña", href: "#contacto" },
};

/* ─────────────── DATA ─────────────── */
export const dataSection = {
  eyebrow: "Publicalle Data",
  title: "No solo ejecutamos campañas. Te mostramos dónde estuvieron.",
  body: "Cada campaña deja un registro: rutas, zonas cubiertas, ejecuciones y evidencias fotográficas. Así sabes qué se hizo, dónde y cuándo.",
  concepts: ["Cobertura territorial", "Kilómetros en zona", "Ejecuciones completadas", "Evidencias", "Fotografías", "Rutas"],
  disclaimer: "Panel demostrativo. Las cifras son de ejemplo y no representan resultados reales.",
  /** Prueba real: foto de ejecución con el sello que Publicalle ya usa. */
  proof: {
    kicker: "Evidencia real",
    title: "Así documentamos cada ejecución.",
    body: "Cada foto de campo lleva impreso el lugar, la fecha, la hora y las coordenadas donde se tomó.",
    alt: "Foto de ejecución de Publicalle: tres personas con pendones publicitarios en la acera, con el sello de lugar, fecha, hora y coordenadas en la esquina inferior",
  },
};

/** ⚠️ Datos DEMOSTRATIVOS para el panel conceptual. No son resultados reales. */
export const demoCampaign = {
  name: "Campaña de ejemplo",
  city: "Tegucigalpa",
  status: "ACTIVA",
  coverage: 0.78,
  metrics: [
    { id: "zonas", label: "Zonas", value: "12" },
    { id: "km", label: "Km en zonas", value: "84", unit: "km" },
    { id: "ejecuciones", label: "Ejecuciones", value: "10" },
    { id: "evidencias", label: "Evidencias", value: "28" },
  ] satisfies Metric[],
};

/* ─────────────── CÓMO FUNCIONA ─────────────── */
export const processSteps: ProcessStepData[] = [
  { id: "objetivo", title: "Cuéntanos tu objetivo.", description: "Qué quieres comunicar, a quién, dónde y cuándo.", detail: "Objetivo · Público · Fechas" },
  { id: "diseno", title: "Diseñamos la campaña.", description: "Combinamos Move, Events y Place según tu objetivo y presupuesto.", detail: "Zonas · Rutas · Formatos" },
  { id: "ejecucion", title: "Ejecutamos en territorio.", description: "Vehículos, activaciones y ubicaciones funcionando en la calle.", detail: "Move · Events · Place" },
  { id: "reporte", title: "Recibes evidencia y reporte.", description: "Rutas, zonas, horas y fotografías de tu campaña.", detail: "Evidencias · Rutas · Reporte" },
];

/* ─────────────── COBERTURA ─────────────── */
export const coverageSection = {
  eyebrow: "Cobertura territorial",
  title: "Llegamos donde está tu audiencia.",
  body: "Así planificamos una campaña por zonas, con Tegucigalpa como ejemplo: colonias, centros comerciales, corredores y puntos de encuentro. Trabajamos igual en cualquier ciudad del país.",
  note: "Cobertura en toda Honduras: diseñamos la ruta según la ciudad, la zona y la duración de tu campaña.",
};

/* ─────────────── CTA FINAL ─────────────── */
export const finalCta = {
  eyebrow: "Crea tu campaña",
  title: "¿Listo para mover tu próxima campaña?",
  body: "Combina publicidad móvil, activaciones y espacios estratégicos en una sola campaña territorial.",
  primary: { label: "Crear una campaña", href: "#formulario" },
  secondary: { label: "Hablar con un asesor" },
  formTitle: "Diseña tu campaña",
  formNote: "Cuéntanos qué quieres lograr, dónde y cuándo. Nuestro equipo te contacta para afinar los detalles.",
};

/* ─────────────── COBERTURA NACIONAL ─────────────── */
export const nationalCoverage = {
  eyebrow: "Cobertura nacional",
  title: "Cobertura en toda Honduras.",
  body: "Llevamos tu campaña a cualquier ciudad del país. Planificamos rutas, activaciones y ubicaciones en cada región, con la misma operación y el mismo reporte.",
  regions: ["Zona norte", "Zona central", "Zona sur", "Occidente", "Oriente", "Litoral atlántico", "Islas de la Bahía", "La Mosquitia"],
  highlight: { value: 18, label: "departamentos" },
  cta: { label: "Crear una campaña en mi ciudad", href: "#contacto" },
};
