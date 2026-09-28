export const site = {
  url: (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://publicalle.com",
  title: "Publicalle | Publicidad territorial medible en Honduras",
  description:
    "Publicidad territorial medible con cobertura en toda Honduras: vehículos con pantalla LED y perifoneo (Move), activaciones con carpas y animadores (Events), ubicaciones físicas (Place) y reportes con evidencia (Data).",
  locale: "es_HN",
  year: new Date().getFullYear(),
} as const;
