export type NavItem = { id: string; label: string; href: string };

/** En páginas de servicio (/publi-escuela) las anclas vuelven a la portada: "#move" → "/#move". */
export const enPortada = () => window.location.pathname === "/";
export const hrefSitio = (href: string) => (href.startsWith("#") && !enPortada() ? `/${href}` : href);

/** Menú principal: el ecosistema PUBLICALLE + cobertura. */
export const mainNav: NavItem[] = [
  { id: "servicios", label: "Servicios", href: "#servicios" },
  { id: "move", label: "Move", href: "#move" },
  { id: "events", label: "Events", href: "#events" },
  { id: "place", label: "Place", href: "#place" },
  { id: "data", label: "Data", href: "#data" },
  { id: "cobertura", label: "Cobertura", href: "#cobertura" },
  { id: "publi-escuela", label: "PubliEscuela", href: "/publi-escuela" },
];

export const primaryCta = { label: "Crear una campaña", shortLabel: "Crear campaña", href: "#contacto" } as const;
