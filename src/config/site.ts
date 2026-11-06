/** Dominio canónico de producción. El dominio raíz redirige permanentemente a www en Vercel. */
export const SITE_URL = "https://www.publicallehonduras.lat";

export const site = {
  url: SITE_URL,
  title: "Publicalle Honduras | Agencia de publicidad territorial y BTL",
  description:
    "Agencia de publicidad en Honduras: publicidad móvil con pantalla LED y perifoneo, activaciones BTL y espacios físicos para marcas. Planificación territorial y evidencia de ejecución.",
  locale: "es_HN",
  year: new Date().getFullYear(),
} as const;
