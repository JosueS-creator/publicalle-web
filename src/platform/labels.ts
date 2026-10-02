import { briefServices } from "@/data/brief";
import type { Enum } from "./database.types";

export type Tone = "green" | "blue" | "amber" | "red" | "gray";

export const estadoSolicitud: Record<Enum<"estado_solicitud">, [string, Tone]> = {
  nueva: ["Nueva", "green"],
  en_revision: ["En revisión", "blue"],
  convertida: ["Convertida", "gray"],
  descartada: ["Descartada", "red"],
};

export const estadoCampania: Record<Enum<"estado_campania">, [string, Tone]> = {
  borrador: ["Borrador", "gray"],
  cotizacion_enviada: ["Cotización enviada", "blue"],
  aprobada: ["Aprobada", "blue"],
  programada: ["Programada", "blue"],
  en_ejecucion: ["En ejecución", "green"],
  finalizada: ["Finalizada", "gray"],
  reportada: ["Reportada", "green"],
  cancelada: ["Cancelada", "red"],
};

export const estadoEjecucion: Record<Enum<"estado_ejecucion">, [string, Tone]> = {
  programada: ["Programada", "blue"],
  en_curso: ["En curso", "green"],
  pausada: ["Pausada", "amber"],
  finalizada: ["Finalizada · por validar", "amber"],
  validada: ["Validada", "green"],
  rechazada: ["Rechazada", "red"],
  incompleta: ["Incompleta", "red"],
};

export const estadoEvidencia: Record<Enum<"estado_evidencia">, [string, Tone]> = {
  pendiente: ["Pendiente", "amber"],
  validada: ["Validada", "green"],
  rechazada: ["Rechazada", "red"],
};

export const rolLabel: Record<Enum<"rol_usuario">, string> = {
  super_admin: "Super administrador",
  admin: "Administrador",
  operador: "Operador",
  cliente: "Cliente",
};

export const lineaLabel: Record<Enum<"linea_servicio">, string> = { move: "MOVE", events: "EVENTS", place: "PLACE" };

export const momentoLabel: Record<string, string> = {
  montaje: "Montaje",
  actividad: "Actividad",
  recorrido: "Recorrido",
  instalacion: "Instalación",
  verificacion: "Verificación",
  otro: "Otro",
};

export const tiposUnidad: Record<string, string> = { vehiculo: "Vehículo", carpa: "Carpa", audio: "Audio", otro: "Otro" };

/** Servicios del catálogo (mismos del brief), por línea. */
export const catalogo = briefServices.map((l) => ({
  linea: l.line as Enum<"linea_servicio">,
  opciones: l.options.map((o) => ({ servicio: o.id.split(":")[1], label: o.label })),
}));

export function servicioLabel(linea: string, servicio: string) {
  if (servicio === "asesoria") return "Necesita asesoría";
  if (servicio === "publiescuela") return "PubliEscuela";
  return briefServices.flatMap((l) => l.options).find((o) => o.id === `${linea}:${servicio}`)?.label ?? servicio;
}

/** "linea:servicio" (formato del brief) → etiqueta */
export const servicioIdLabel = (id: string) => (id.includes(":") ? servicioLabel(id.split(":")[0], id.split(":")[1]) : servicioLabel("", id));

const fmtFecha = new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtFechaHora = new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Fecha de columna `date` (AAAA-MM-DD), sin corrimiento de zona horaria. */
export const fecha = (d: string | null | undefined) => (d ? fmtFecha.format(new Date(`${d}T00:00:00Z`)) : "—");
export const fechaHora = (d: string | null | undefined) => (d ? fmtFechaHora.format(new Date(d)) : "—");
export const hora = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");
export const hoyISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** "a, b , c" → ["a","b","c"] */
export const lista = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
