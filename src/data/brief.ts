import type { LineId } from "@/types";
import { HN_CITIES } from "./honduras";

/** Opciones del brief de campaña. Solo recopila información: no hay precios en esta fase. */
export const briefObjectives = [
  "Lanzamiento de producto",
  "Promoción",
  "Apertura de negocio",
  "Activación de marca",
  "Reconocimiento de marca",
  "Llevar tráfico a un punto",
  "Evento",
  "Otro",
] as const;

export const briefCities = [...HN_CITIES].sort((a, b) => a.tier - b.tier).map((c) => c.name);

export type BriefServiceOption = { id: string; label: string };

/** Servicios por línea. El id se guarda como "linea:servicio". */
export const briefServices: { line: Exclude<LineId, "data">; name: string; kicker: string; options: BriefServiceOption[] }[] = [
  {
    line: "move",
    name: "MOVE",
    kicker: "Publicidad en movimiento",
    options: [
      { id: "move:pantalla_led", label: "Pantalla LED" },
      { id: "move:perifoneo", label: "Perifoneo" },
      { id: "move:audio_movil", label: "Audio móvil" },
      { id: "move:volanteo", label: "Entrega de volantes y material" },
      { id: "move:creacion_spots", label: "Creación de spots" },
    ],
  },
  {
    line: "events",
    name: "EVENTS",
    kicker: "Activaciones y experiencias",
    options: [
      { id: "events:carpa", label: "Carpa" },
      { id: "events:audio", label: "Audio" },
      { id: "events:animador", label: "Animador" },
      { id: "events:promotores", label: "Promotores" },
      { id: "events:material_pop", label: "Material POP" },
    ],
  },
  {
    line: "place",
    name: "PLACE",
    kicker: "Ubicaciones físicas",
    options: [
      { id: "place:espacios", label: "Espacios publicitarios" },
      { id: "place:comercios_aliados", label: "Comercios aliados" },
      { id: "place:pantallas_fijas", label: "Pantallas fijas" },
    ],
  },
];

export const BRIEF_POR_HORAS = "Por cantidad de horas";
export const briefSchedules = ["Mañana", "Tarde", "Día completo", "Noche", BRIEF_POR_HORAS, "Por definir"] as const;
/** Momentos del día para la opción «Por cantidad de horas». */
export const briefDayMoments = ["Mañana", "Mediodía", "Tarde", "Noche"] as const;
export const briefBudgets = ["Aún no lo sé", "Prefiero conversarlo", "Tengo un monto definido"] as const;
