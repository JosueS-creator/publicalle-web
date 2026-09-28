import type { ServiceLine } from "@/types";

/**
 * Ecosistema PUBLICALLE: una marca madre, cuatro líneas de servicio.
 * El orden define el orden en la web, el menú y el formulario.
 */
export const serviceLines: ServiceLine[] = [
  {
    id: "move",
    name: "MOVE",
    kicker: "Publicidad en movimiento",
    description: "Tu marca recorriendo la ciudad en vehículos con pantalla y audio.",
    items: ["Vehículos", "Pantallas", "Perifoneo", "Audio móvil", "Volanteo"],
    href: "#move",
  },
  {
    id: "events",
    name: "EVENTS",
    kicker: "Activaciones y experiencias",
    description: "Presencia en vivo para que las personas conozcan tu marca de cerca.",
    items: ["Carpas", "Audio", "Animadores", "Promotores", "Material POP"],
    href: "#events",
  },
  {
    id: "place",
    name: "PLACE",
    kicker: "Publicidad en ubicaciones físicas",
    description: "Tu marca fija en los puntos por donde pasa tu público.",
    items: ["Espacios", "Puntos estratégicos", "Comercios aliados", "Pantallas", "Fachadas"],
    href: "#place",
  },
  {
    id: "data",
    name: "DATA",
    kicker: "Cobertura y evidencia",
    description: "Te mostramos dónde estuvo tu campaña, con rutas y evidencias.",
    items: ["GPS", "Rutas", "Evidencias", "Cobertura", "Reportes"],
    href: "#data",
  },
];

export const lineById = Object.fromEntries(serviceLines.map((l) => [l.id, l])) as Record<ServiceLine["id"], ServiceLine>;
