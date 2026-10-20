import type { Json } from "../database.types";

/** Forma de la copia congelada (snapshot) de una cotización emitida. */
export type CotizacionDoc = {
  numero: string | null;
  version: number;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  moneda: string;
  emisor: { razon_social: string | null; rtn: string | null; telefono: string | null; correo: string | null; direccion: string | null; sitio_web: string | null };
  cliente: { nombre: string; rtn: string | null; telefono: string | null; correo: string | null; contacto: string | null };
  campania: { nombre: string; objetivo: string | null; ciudades: string[]; zonas: string[]; fecha_inicio: string | null; fecha_fin: string | null };
  proyecto: string;
  conceptos: { concepto: string; descripcion: string | null; cantidad: number; unidad: string; precio_unitario: number; descuento_porcentaje: number; subtotal: number }[];
  totales: { subtotal: number; descuento_total: number; impuesto_porcentaje: number; impuesto_total: number; total: number };
  condiciones: string | null;
};

/** Valida lo mínimo para dibujar el documento (los datos vienen de la base, pero se comprueba la forma). */
export function comoDoc(j: Json | null | undefined): CotizacionDoc | null {
  if (!j || typeof j !== "object" || Array.isArray(j)) return null;
  const d = j as Record<string, unknown>;
  if (!Array.isArray(d.conceptos) || typeof d.totales !== "object" || !d.totales || typeof d.cliente !== "object" || !d.cliente) return null;
  return j as unknown as CotizacionDoc;
}

export const UNIDADES = ["UN", "Jornada", "Día", "Hora", "Evento", "Ubicación", "Mes"] as const;

/** unidad_medida de campania_servicios → etiqueta de unidad de la cotización */
export const unidadDesdeMedida = (m: string) =>
  ({ jornada: "Jornada", dia: "Día", hora: "Hora", evento: "Evento", ubicacion: "Ubicación" } as Record<string, string>)[m] ?? "UN";
