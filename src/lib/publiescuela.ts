import { hasSupabase, supabaseConfig } from "@/config/backend";
import { whatsappUrl } from "./whatsapp";

/**
 * PubliEscuela — servicio de Publicalle MOVE.
 * Recorridos de 2 h/día por los barrios y colonias alrededor de las escuelas que elige el cliente.
 * Solo hay precio definido para el volanteo; el recorrido se cotiza.
 */
export const PE = {
  horasDia: 2,
  duraciones: [7, 14, 21, 30] as const,
  radios: [0.5, 1, 1.5] as const,
  maxEscuelas: 5,
  volanteo: { precio: 5000, incluye: ["Hasta 5,000 volantes", "Blanco y negro", "Tamaño 1/4 de página", "Impresión", "Distribución en la zona"] },
} as const;

export type Escuela = { id: string; nombre: string; lat: number; lng: number; radioKm: number };
export type Franja = { franja_id: string; nombre: string; hora_inicio: string; hora_fin: string; fechas: string[]; sin_cupo: string[] };

export type PEConfig = {
  escuelas: Escuela[];
  dias: number;
  inicio: string; // AAAA-MM-DD
  franjaId: string;
  volanteo: boolean;
  volanteoExtra: boolean; // más de 5,000 → cotización
};

export type PEContacto = { nombre: string; empresa: string; telefono: string; correo: string; comentarios: string; sitio: string };

export const emptyConfig: PEConfig = { escuelas: [], dias: 7, inicio: "", franjaId: "", volanteo: false, volanteoExtra: false };
export const emptyContacto: PEContacto = { nombre: "", empresa: "", telefono: "", correo: "", comentarios: "", sitio: "" };

export const lempiras = (n: number) => `L${n.toLocaleString("en-US")}`;
export const hhmm = (t: string) => t.slice(0, 5);
const fmtDia = new Intl.DateTimeFormat("es-HN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const diaCorto = (d: string) => fmtDia.format(new Date(`${d}T00:00:00Z`));

/** Mañana en Honduras (UTC−6), AAAA-MM-DD. */
export function mananaHN() {
  const t = new Date(Date.now() - 6 * 3600_000 + 24 * 3600_000);
  return t.toISOString().slice(0, 10);
}

const headers = () => ({ apikey: supabaseConfig.anonKey, Authorization: `Bearer ${supabaseConfig.anonKey}`, "Content-Type": "application/json" });

/** Horarios activos con los días del recorrido y los que no tienen cupo (lo calcula el servidor). */
export async function disponibilidad(inicio: string, dias: number): Promise<Franja[]> {
  const r = await fetch(`${supabaseConfig.url}/rest/v1/rpc/agenda_disponibilidad`, { method: "POST", headers: headers(), body: JSON.stringify({ p_inicio: inicio, p_dias: dias }) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/** Primera fecha de inicio con cupo todos los días, desde `desde`. */
export async function proximoInicio(franjaId: string, dias: number, desde: string): Promise<string | null> {
  const r = await fetch(`${supabaseConfig.url}/rest/v1/rpc/agenda_proximo_inicio`, { method: "POST", headers: headers(), body: JSON.stringify({ p_franja: franjaId, p_dias: dias, p_desde: desde }) });
  if (!r.ok) return null;
  return r.json();
}

/** Recorrido de demostración alrededor de una escuela (un bucle irregular dentro del radio). */
export function rutaDemo(e: Escuela) {
  const pts: { lat: number; lng: number }[] = [];
  const n = 28;
  const seed = Math.abs(Math.sin(e.lat * 1000 + e.lng * 1000));
  const kmLat = 1 / 110.574;
  const kmLng = 1 / (111.32 * Math.cos((e.lat * Math.PI) / 180));
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = e.radioKm * (0.62 + 0.14 * Math.sin(a * 2 + seed * 10) + 0.06 * Math.sin(a * 5 + seed * 7));
    pts.push({ lat: e.lat + Math.sin(a) * r * kmLat, lng: e.lng + Math.cos(a) * r * kmLng });
  }
  return pts;
}

export function inversion(c: PEConfig) {
  const volanteo = c.volanteo && !c.volanteoExtra ? PE.volanteo.precio : null;
  return {
    recorrido: "Por cotizar",
    volanteo: c.volanteo ? (c.volanteoExtra ? "Por cotizar (más de 5,000)" : lempiras(PE.volanteo.precio)) : "No incluido",
    // El recorrido aún no tiene precio publicado: el total siempre se cotiza
    total: null as number | null,
    volanteoMonto: volanteo,
  };
}

export function resumen(c: PEConfig, f: Franja | undefined) {
  const inv = inversion(c);
  return [
    { label: "Ciudad", value: "Tegucigalpa" },
    { label: "Escuelas", value: c.escuelas.map((e) => `${e.nombre} (${e.radioKm} km alrededor)`).join(" · ") || "—" },
    { label: "Duración", value: `${c.dias} días de recorrido` },
    { label: "Recorrido", value: `${PE.horasDia} horas/día${f ? ` · ${f.nombre} ${hhmm(f.hora_inicio)}–${hhmm(f.hora_fin)}` : ""}` },
    { label: "Fechas", value: f && f.fechas.length ? `${diaCorto(f.fechas[0])} → ${diaCorto(f.fechas[f.fechas.length - 1])}` : c.inicio ? `Desde ${diaCorto(c.inicio)}` : "—" },
    { label: "Volanteo", value: c.volanteo ? `Sí · ${inv.volanteo}` : "No" },
    { label: "Inversión", value: "Solicitar cotización" },
  ];
}

export function validar(c: PEConfig, k: PEContacto, f: Franja | undefined) {
  const e: Record<string, string> = {};
  if (!c.escuelas.length) e.escuelas = "Agrega al menos una escuela en el mapa.";
  if (!c.inicio) e.inicio = "Elige la fecha de inicio.";
  if (!c.franjaId) e.franja = "Elige un horario.";
  else if (f && f.sin_cupo.length) e.franja = "Ese horario no tiene cupo en todas las fechas. Elige otro o cambia la fecha.";
  if (k.nombre.trim().length < 2) e.nombre = "Escribe tu nombre.";
  if (!/^[+\d\s()-]{8,20}$/.test(k.telefono.trim())) e.telefono = "Escribe un teléfono o WhatsApp válido (mínimo 8 dígitos).";
  if (k.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k.correo.trim())) e.correo = "Revisa el formato del correo.";
  return e;
}

function texto(c: PEConfig, k: PEContacto, f: Franja | undefined, folio?: string) {
  return [
    `Hola Publicalle, quiero una campaña PubliEscuela.${folio ? ` (Solicitud ${folio})` : ""}`,
    ...resumen(c, f).map((r) => `• ${r.label}: ${r.value}`),
    ...(k.comentarios.trim() ? [`• Comentarios: ${k.comentarios.trim()}`] : []),
    `• Contacto: ${k.nombre}${k.empresa ? ` — ${k.empresa}` : ""} · ${k.telefono}${k.correo ? ` · ${k.correo}` : ""}`,
  ].join("\n");
}

export type PEResult =
  | { ok: true; folio?: string; whatsapp: string }
  | { ok: false; sinCupo?: boolean; message: string; whatsapp: string };

/** Guarda la solicitud en la misma tabla del brief (llega a Admin → Solicitudes). El servidor valida y aparta el cupo. */
export async function enviar(c: PEConfig, k: PEContacto, f: Franja | undefined): Promise<PEResult> {
  if (k.sitio) return { ok: true, whatsapp: whatsappUrl() }; // bot
  if (!hasSupabase) return { ok: true, whatsapp: whatsappUrl(texto(c, k, f)) };
  const id = crypto.randomUUID();
  const folio = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const e0 = c.escuelas[0];
  const servicios = ["move:publiescuela", "move:perifoneo", ...(c.volanteo ? ["move:volanteo"] : [])];
  const extra = [
    c.volanteo ? (c.volanteoExtra ? "Volanteo: más de 5,000 volantes (cotizar)" : `Volanteo: hasta 5,000 volantes · ${lempiras(PE.volanteo.precio)}`) : "",
    k.comentarios.trim(),
  ].filter(Boolean).join("\n");
  const row = {
    id,
    objetivo: "PubliEscuela",
    ciudades: ["Tegucigalpa"],
    zonas: c.escuelas.map((e) => `${e.nombre} · ${e.radioKm} km alrededor`).join("\n").slice(0, 1000),
    ubicacion_lat: e0.lat,
    ubicacion_lng: e0.lng,
    ubicacion_ref: e0.nombre.slice(0, 200),
    radio_km: e0.radioKm,
    escuelas: c.escuelas.map(({ nombre, lat, lng, radioKm }) => ({ nombre, lat, lng, radio_km: radioKm })),
    lineas: ["move"],
    servicios,
    franja_id: c.franjaId,
    fecha_inicio: c.inicio,
    dias_recorrido: c.dias,
    horario: f ? `${PE.horasDia} h/día · ${f.nombre} ${hhmm(f.hora_inicio)}–${hhmm(f.hora_fin)}`.slice(0, 120) : `${PE.horasDia} h/día`,
    presupuesto: c.volanteo && !c.volanteoExtra ? `Volanteo ${lempiras(PE.volanteo.precio)} + recorrido por cotizar` : "Por cotizar",
    comentarios: extra || null,
    contacto_nombre: k.nombre.trim(),
    contacto_empresa: k.empresa.trim() || null,
    contacto_telefono: k.telefono.trim(),
    contacto_correo: k.correo.trim() || null,
  };
  try {
    const res = await fetch(`${supabaseConfig.url}/rest/v1/solicitudes`, { method: "POST", headers: { ...headers(), Prefer: "return=minimal" }, body: JSON.stringify(row) });
    if (!res.ok) {
      const body = await res.text();
      if (body.includes("AGENDA_SIN_CUPO")) {
        return { ok: false, sinCupo: true, message: "Ese horario se acaba de ocupar en alguna de tus fechas. Elige otro horario o cambia la fecha de inicio.", whatsapp: whatsappUrl(texto(c, k, f)) };
      }
      throw new Error(String(res.status));
    }
    return { ok: true, folio, whatsapp: whatsappUrl(texto(c, k, f, folio)) };
  } catch {
    return { ok: false, message: "No pudimos guardar tu solicitud en este momento. Envíala por WhatsApp y la atendemos igual.", whatsapp: whatsappUrl(texto(c, k, f)) };
  }
}
