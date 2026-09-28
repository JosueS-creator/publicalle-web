export type Point = [number, number];

/** Líneas del ecosistema PUBLICALLE. */
export type LineId = "move" | "events" | "place" | "data";

export type ServiceLine = {
  id: LineId;
  /** Nombre corto de la línea: MOVE, EVENTS… */
  name: string;
  /** Qué es, en 2–4 palabras. */
  kicker: string;
  description: string;
  items: string[];
  /** Ancla de la sección de detalle. */
  href: `#${string}`;
};

export type EventBlock = {
  id: string;
  title: string;
  items: string[];
  visual: "tent" | "audio" | "animation" | "promoters";
  /** Foto real (se muestra con overlay azul/teal). */
  image?: string;
  /** srcSet opcional con varios anchos (p. ej. "a.webp 800w, b.webp 1400w"). */
  imageSrcSet?: string;
  imageAlt?: string;
};

export type FlowNode = {
  line: LineId;
  value: number;
  /** Texto después del número ("vehículos"). Si value es 0 se muestra solo `label`. */
  label: string;
};

export type Campaign = {
  id: string;
  title: string;
  client?: string;
  type: string;
  location: string;
  duration: string;
  format: string;
  service: string;
  image?: string;
  imageAlt?: string;
  result?: string;
  /** true = contenido de ejemplo. Se muestra una marca visible. */
  isPlaceholder: boolean;
};

export type ZoneKind = "comercial" | "corredor" | "universitaria" | "residencial" | "mercado" | "eventos";

export type CoverageZone = {
  id: string;
  name: string;
  kind: ZoneKind;
  description: string;
  /** Polígono en el sistema de coordenadas del mapa (viewBox 0 0 1000 620). */
  coordinates: Point[];
  active: boolean;
};

export type CoverageRoute = {
  id: string;
  name: string;
  points: Point[];
};

export type CoveragePointData = {
  id: string;
  at: Point;
  label?: string;
  zoneId?: string;
};

export type CoverageDataset = {
  city: string;
  zones: CoverageZone[];
  routes: CoverageRoute[];
  points: CoveragePointData[];
};

export type Metric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
};

export type ProcessStepData = {
  id: string;
  title: string;
  description: string;
  detail: string;
};

export type Differentiator = {
  id: string;
  title: string;
  description: string;
};
