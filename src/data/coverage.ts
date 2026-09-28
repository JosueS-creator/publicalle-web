import type { CoverageDataset } from "@/types";

/**
 * Datos de cobertura — mapa ILUSTRATIVO de Tegucigalpa (no es cartografía real).
 * Sistema de coordenadas: viewBox 0 0 1000 620. Las zonas son ejemplos de dónde puede operar una campaña.
 * Futuro: estos datos pueden venir de Publicalle Data (GPS) o de Supabase sin cambiar CoverageMap.
 */
export const coverage: CoverageDataset = {
  city: "Tegucigalpa",
  zones: [
    {
      id: "centro",
      name: "Centro",
      kind: "comercial",
      description: "Casco histórico, comercio y oficinas. Alto flujo peatonal.",
      coordinates: [[405, 280], [500, 258], [556, 300], [540, 372], [452, 386], [400, 340]],
      active: true,
    },
    {
      id: "comayaguela",
      name: "Comayagüela",
      kind: "mercado",
      description: "Mercados, terminales y comercio popular.",
      coordinates: [[210, 430], [320, 404], [392, 452], [366, 540], [258, 552], [200, 496]],
      active: true,
    },
    {
      id: "el-carrizal",
      name: "El Carrizal",
      kind: "residencial",
      description: "Colonias residenciales: ideal para perifoneo y volanteo.",
      coordinates: [[392, 128], [470, 108], [528, 150], [512, 214], [436, 226], [388, 184]],
      active: true,
    },
    {
      id: "miraflores",
      name: "Miraflores",
      kind: "corredor",
      description: "Corredores de alto tráfico, comercio y servicios.",
      coordinates: [[640, 228], [740, 212], [800, 262], [772, 326], [676, 334], [630, 288]],
      active: true,
    },
    {
      id: "kennedy",
      name: "Kennedy",
      kind: "residencial",
      description: "Zona residencial y comercial de gran densidad.",
      coordinates: [[700, 400], [812, 384], [872, 440], [836, 516], [724, 524], [680, 466]],
      active: true,
    },
  ],
  routes: [
    {
      id: "ruta-principal",
      name: "Recorrido de ejemplo",
      points: [
        [150, 500], [240, 480], [300, 472], [380, 412], [470, 322], [462, 240],
        [452, 166], [530, 200], [600, 256], [712, 278], [790, 336], [792, 418], [764, 462],
      ],
    },
    {
      id: "ruta-sur",
      name: "Recorrido sur",
      points: [[300, 472], [420, 500], [560, 520], [680, 490], [764, 462]],
    },
  ],
  points: [
    { id: "p-comayaguela", at: [300, 472], label: "Comayagüela", zoneId: "comayaguela" },
    { id: "p-centro", at: [470, 322], label: "Centro", zoneId: "centro" },
    { id: "p-carrizal", at: [452, 166], label: "El Carrizal", zoneId: "el-carrizal" },
    { id: "p-miraflores", at: [712, 278], label: "Miraflores", zoneId: "miraflores" },
    { id: "p-kennedy", at: [764, 462], label: "Kennedy", zoneId: "kennedy" },
  ],
};

/** Variante del hero: ruta y puntos dentro de la zona visible (derecha/superior) de la composición. */
export const heroCoverage: CoverageDataset = {
  ...coverage,
  routes: [
    {
      id: "ruta-hero",
      name: "Recorrido de ejemplo",
      points: [[300, 90], [380, 130], [452, 166], [510, 232], [560, 300], [640, 282], [712, 278], [790, 236], [862, 196], [975, 140]],
    },
  ],
  points: [
    { id: "h1", at: [380, 130] },
    { id: "h2", at: [452, 166], label: "El Carrizal", zoneId: "el-carrizal" },
    { id: "h3", at: [560, 300], zoneId: "centro" },
    { id: "h4", at: [712, 278], label: "Miraflores", zoneId: "miraflores" },
    { id: "h5", at: [862, 196] },
  ],
};

/**
 * Publicalle Place — puntos ILUSTRATIVOS (no es inventario real).
 * Muestran los tipos de ubicación con los que se puede trabajar una campaña.
 */
export const placeCoverage: CoverageDataset = {
  city: "Tegucigalpa",
  zones: [],
  routes: [],
  points: [
    { id: "pl1", at: [470, 318], label: "Comercio aliado" },
    { id: "pl2", at: [712, 276], label: "Pantalla" },
    { id: "pl3", at: [300, 470], label: "Alto tráfico" },
    { id: "pl4", at: [770, 456], label: "Fachada" },
    { id: "pl5", at: [452, 168] },
    { id: "pl6", at: [540, 360] },
    { id: "pl7", at: [610, 250] },
    { id: "pl8", at: [360, 520] },
    { id: "pl9", at: [840, 300] },
    { id: "pl10", at: [230, 380] },
    { id: "pl11", at: [640, 420] },
    { id: "pl12", at: [560, 150] },
    { id: "pl13", at: [880, 520] },
    { id: "pl14", at: [390, 250] },
  ],
};
