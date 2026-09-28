import { BRIEF_POR_HORAS, briefDayMoments, briefServices } from "@/data/brief";
import { hasSupabase, supabaseConfig } from "@/config/backend";
import { whatsappUrl } from "./whatsapp";

export type BriefData = {
  objetivo: string;
  objetivoOtro: string;
  ciudades: string[];
  ciudadOtra: string;
  zonas: string;
  /** Mapa (opcional): ubicación del negocio, radio a recorrer y zonas dibujadas elegidas. */
  ubicacion: { lat: number; lng: number } | null;
  ubicacionRef: string;
  radioKm: number;
  zonasElegidas: string[];
  servicios: string[];
  noSeguro: boolean;
  fechaInicio: string;
  fechaFin: string;
  fechasFlexibles: boolean;
  horario: string;
  /** Solo si horario = «Por cantidad de horas». */
  horasDia: string;
  horasMomentos: string[];
  horaDesde: string;
  presupuesto: string;
  presupuestoMonto: string;
  comentarios: string;
  nombre: string;
  empresa: string;
  cargo: string;
  telefono: string;
  correo: string;
  /** Campo trampa anti-spam: las personas no lo ven; los bots sí lo llenan. */
  sitio: string;
};

export const emptyBrief: BriefData = {
  objetivo: "", objetivoOtro: "", ciudades: [], ciudadOtra: "", zonas: "", ubicacion: null, ubicacionRef: "", radioKm: 0, zonasElegidas: [], servicios: [], noSeguro: false,
  fechaInicio: "", fechaFin: "", fechasFlexibles: false, horario: "", horasDia: "", horasMomentos: [], horaDesde: "", presupuesto: "", presupuestoMonto: "",
  comentarios: "", nombre: "", empresa: "", cargo: "", telefono: "", correo: "", sitio: "",
};

export type BriefErrors = Partial<Record<keyof BriefData, string>>;

export const BRIEF_STEPS = ["Objetivo", "Territorio", "Servicios", "Fechas", "Contacto"] as const;

export function validateStep(step: number, d: BriefData): BriefErrors {
  const e: BriefErrors = {};
  if (step === 0) {
    if (!d.objetivo) e.objetivo = "Elige qué quieres lograr.";
    else if (d.objetivo === "Otro" && d.objetivoOtro.trim().length < 3) e.objetivoOtro = "Cuéntanos brevemente tu objetivo.";
  }
  if (step === 1 && d.ciudades.length === 0 && d.ciudadOtra.trim().length < 2) e.ciudades = "Elige al menos una ciudad o escribe otra.";
  if (step === 2 && d.servicios.length === 0 && !d.noSeguro) e.servicios = "Elige al menos un servicio o marca «No estoy seguro».";
  if (step === 3 && !d.fechasFlexibles) {
    if (!d.fechaInicio) e.fechaInicio = "Indica la fecha de inicio o marca «Fechas flexibles».";
    if (d.fechaInicio && d.fechaFin && d.fechaFin < d.fechaInicio) e.fechaFin = "La fecha final debe ser igual o posterior al inicio.";
  }
  if (step === 3 && d.horario === BRIEF_POR_HORAS) {
    const h = Number(d.horasDia);
    if (!Number.isInteger(h) || h < 1 || h > 16) e.horasDia = "Indica de 1 a 16 horas por día.";
    if (d.horasMomentos.length === 0 && !d.horaDesde) e.horasMomentos = "Elige en qué momento del día o una hora de inicio.";
  }
  if (step === 4) {
    if (d.nombre.trim().length < 2) e.nombre = "Escribe tu nombre.";
    if (!/^[+\d\s()-]{8,20}$/.test(d.telefono.trim())) e.telefono = "Escribe un teléfono válido (mínimo 8 dígitos).";
    if (d.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo.trim())) e.correo = "Revisa el formato del correo.";
  }
  return e;
}

/** Texto de horario (≤120 caracteres, columna `solicitudes.horario`). */
export function horarioTexto(d: BriefData) {
  if (d.horario !== BRIEF_POR_HORAS) return d.horario;
  const h = Number(d.horasDia);
  const fin = d.horaDesde && h ? addHours(d.horaDesde, h) : "";
  const momentos = briefDayMoments.filter((m) => d.horasMomentos.includes(m)).join(", ");
  return [`${h} h/día`, momentos, d.horaDesde ? `desde ${d.horaDesde}${fin ? ` hasta ${fin}` : ""}` : ""].filter(Boolean).join(" · ");
}

export function addHours(hhmm: string, h: number) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const t = (hh * 60 + mm + h * 60) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

const serviceLabel = (id: string) => briefServices.flatMap((l) => l.options).find((o) => o.id === id)?.label ?? id;

export function briefCitiesList(d: BriefData) {
  return [...d.ciudades, ...(d.ciudadOtra.trim() ? [d.ciudadOtra.trim()] : [])];
}

/** Resumen en texto (para WhatsApp y para la pantalla de revisión). */
export function briefSummary(d: BriefData): { label: string; value: string }[] {
  const objetivo = d.objetivo === "Otro" ? d.objetivoOtro.trim() : d.objetivo;
  const servicios = d.servicios.length ? d.servicios.map(serviceLabel).join(", ") : "";
  return [
    { label: "Objetivo", value: objetivo },
    { label: "Ciudades", value: briefCitiesList(d).join(", ") },
    { label: "Zonas o puntos", value: d.zonas.trim() },
    { label: "Ubicación del negocio", value: d.ubicacion ? `https://maps.google.com/?q=${d.ubicacion.lat},${d.ubicacion.lng}` : "" },
    { label: "Área a recorrer", value: [d.ubicacion && d.radioKm ? `${d.radioKm} km a la redonda` : "", d.zonasElegidas.join(", ")].filter(Boolean).join(" · ") },
    { label: "Servicios", value: [servicios, d.noSeguro ? "No estoy seguro: necesito asesoría" : ""].filter(Boolean).join(" · ") },
    { label: "Fechas", value: d.fechasFlexibles ? "Flexibles" : [d.fechaInicio, d.fechaFin].filter(Boolean).join(" → ") },
    { label: "Horario", value: horarioTexto(d) },
    { label: "Presupuesto", value: [d.presupuesto, d.presupuestoMonto.trim()].filter(Boolean).join(": ") },
    { label: "Comentarios", value: d.comentarios.trim() },
  ].filter((r) => r.value);
}

function whatsappMessage(d: BriefData, folio?: string) {
  return [
    `Hola Publicalle, quiero crear una campaña.${folio ? ` (Solicitud ${folio})` : ""}`,
    ...briefSummary(d).map((r) => `• ${r.label}: ${r.value}`),
    `• Contacto: ${d.nombre}${d.empresa ? ` — ${d.empresa}` : ""} · ${d.telefono}${d.correo ? ` · ${d.correo}` : ""}`,
  ].join("\n");
}

export type BriefResult =
  | { ok: true; folio?: string; whatsapp: string; channel: "supabase" | "whatsapp" }
  | { ok: false; message: string; whatsapp: string };

/** Guarda la solicitud en Supabase (si está configurado). Sin backend, prepara el envío por WhatsApp. */
export async function submitBrief(d: BriefData): Promise<BriefResult> {
  if (d.sitio) return { ok: true, whatsapp: whatsappUrl(), channel: "whatsapp" }; // bot: se descarta en silencio
  if (!hasSupabase) return { ok: true, whatsapp: whatsappUrl(whatsappMessage(d)), channel: "whatsapp" };

  const id = crypto.randomUUID();
  const folio = id.replace(/-/g, "").slice(0, 8).toUpperCase(); // igual a la columna generada `folio`
  const lineas = [...new Set(d.servicios.map((s) => s.split(":")[0]))];
  const row = {
    id,
    objetivo: d.objetivo === "Otro" ? d.objetivoOtro.trim() : d.objetivo,
    ciudades: briefCitiesList(d),
    zonas: d.zonas.trim() || null,
    ubicacion_lat: d.ubicacion?.lat ?? null,
    ubicacion_lng: d.ubicacion?.lng ?? null,
    ubicacion_ref: d.ubicacion && d.ubicacionRef ? d.ubicacionRef.slice(0, 200) : null,
    radio_km: d.ubicacion && d.radioKm ? d.radioKm : null,
    zonas_elegidas: d.zonasElegidas,
    lineas,
    servicios: [...d.servicios, ...(d.noSeguro ? ["asesoria"] : [])],
    fecha_inicio: d.fechasFlexibles ? null : d.fechaInicio || null,
    fecha_fin: d.fechasFlexibles ? null : d.fechaFin || null,
    fechas_flexibles: d.fechasFlexibles,
    horario: horarioTexto(d) || null,
    presupuesto: [d.presupuesto, d.presupuestoMonto.trim()].filter(Boolean).join(": ") || null,
    comentarios: d.comentarios.trim() || null,
    contacto_nombre: d.nombre.trim(),
    contacto_empresa: d.empresa.trim() || null,
    contacto_cargo: d.cargo.trim() || null,
    contacto_telefono: d.telefono.trim(),
    contacto_correo: d.correo.trim() || null,
  };
  try {
    const res = await fetch(`${supabaseConfig.url}/rest/v1/solicitudes`, {
      method: "POST",
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(String(res.status));
    return { ok: true, folio, whatsapp: whatsappUrl(whatsappMessage(d, folio)), channel: "supabase" };
  } catch {
    return {
      ok: false,
      message: "No pudimos guardar tu solicitud en este momento. Envíala por WhatsApp y la atendemos igual.",
      whatsapp: whatsappUrl(whatsappMessage(d)),
    };
  }
}
