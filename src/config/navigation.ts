export type NavItem = { id: string; label: string; href: `#${string}` };

/** Menú principal: el ecosistema PUBLICALLE + cobertura. */
export const mainNav: NavItem[] = [
  { id: "servicios", label: "Servicios", href: "#servicios" },
  { id: "move", label: "Move", href: "#move" },
  { id: "events", label: "Events", href: "#events" },
  { id: "place", label: "Place", href: "#place" },
  { id: "data", label: "Data", href: "#data" },
  { id: "cobertura", label: "Cobertura", href: "#cobertura" },
];

export const primaryCta = { label: "Crear una campaña", shortLabel: "Crear campaña", href: "#contacto" } as const;
