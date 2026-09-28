import { useState } from "react";
import { useParams } from "react-router";
import { Camera, Flag, MapPin, Pause, Play, Square, TriangleAlert } from "lucide-react";
import { useAuth } from "../auth";
import { sb } from "../supabase";
import { estadoEjecucion, fecha, fechaHora, hora, lineaLabel, momentoLabel, servicioLabel } from "../labels";
import type { Enum } from "../database.types";
import { Badge, Btn, Card, Dl, ErrorBox, Estado, Field, Loading, OkBox, Page, Select, Textarea, must, useAction, useAsync } from "../ui";
import { comprimir, sha256, ubicacion, useGps } from "./geo";

type Linea = Enum<"linea_servicio">;
type Evento = Enum<"tipo_evento">;

const MIN_FOTOS: Record<Linea, number> = { move: 2, events: 2, place: 1 };
const MOMENTOS: Record<Linea, string[]> = {
  move: ["recorrido", "otro"],
  events: ["montaje", "actividad", "otro"],
  place: ["instalacion", "verificacion", "otro"],
};
const EVENTO_LABEL: Record<Evento, string> = {
  inicio: "Inicio", pausa: "Pausa", reanudacion: "Reanudación", fin: "Fin",
  llegada: "Llegada", salida: "Salida", instalacion: "Instalación", verificacion: "Verificación",
};
const TIPOS_INCIDENCIA: [string, string][] = [
  ["mecanica", "Falla mecánica"], ["clima", "Clima"], ["acceso", "Sin acceso a la zona / punto"],
  ["seguridad", "Seguridad"], ["cliente", "Tema con el cliente"], ["otra", "Otra"],
];

export default function OperadorJornada() {
  const { id = "" } = useParams();
  const { perfil } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const [j, ev, evid] = await Promise.all([
      sb.from("ejecuciones").select("*, campanias(nombre, zonas, empresas(nombre)), unidades(nombre, placa)").eq("id", id).single(),
      sb.from("ejecucion_eventos").select("id, tipo, registrado_en").eq("ejecucion_id", id).order("registrado_en"),
      sb.from("evidencias").select("id, storage_path, momento, estado, registrado_en").eq("ejecucion_id", id).order("registrado_en"),
    ]);
    const fotos = must(evid);
    const urls = fotos.length ? (await sb.storage.from("evidencias").createSignedUrls(fotos.map((f) => f.storage_path), 3600)).data ?? [] : [];
    return { j: must(j), eventos: must(ev), fotos: fotos.map((f, i) => ({ ...f, url: urls[i]?.signedUrl ?? null })) };
  }, [id]);

  const j = data?.j;
  const linea = (j?.linea ?? "move") as Linea;
  const gps = useGps(id, !!j && linea === "move" && j.estado === "en_curso");
  const acc = useAction();
  const foto = useAction();
  const inc = useAction();
  const [momento, setMomento] = useState("");
  const [incidencia, setIncidencia] = useState({ abierta: false, tipo: "mecanica", descripcion: "" });
  const [avisoUbic, setAvisoUbic] = useState(false);

  if (loading) return <Page title="Jornada" back="/operador"><Loading /></Page>;
  if (!data || !j) return <Page title="Jornada" back="/operador"><ErrorBox msg={error} /></Page>;

  const activa = j.estado === "programada" || j.estado === "en_curso" || j.estado === "pausada";
  const fotosOk = data.fotos.length >= MIN_FOTOS[linea];
  const momentoSel = momento || MOMENTOS[linea][0];

  /** Registra un evento con la ubicación actual y (opcional) cambia el estado de la jornada. */
  const registrar = (tipo: Evento, nuevo?: Enum<"estado_ejecucion">) =>
    acc.run(async () => {
      const p = await ubicacion();
      setAvisoUbic(!p);
      must(
        await sb
          .from("ejecucion_eventos")
          .insert({ ejecucion_id: id, tipo, lat: p?.lat ?? null, lng: p?.lng ?? null, precision_m: p?.precision ?? null, capturado_en: new Date().toISOString(), registrado_por: perfil?.id })
          .select("id")
          .single(),
      );
      if (nuevo === "finalizada") await gps.flush(); // enviar GPS pendiente antes de cerrar (después ya no se acepta)
      if (nuevo && nuevo !== j.estado) must(await sb.from("ejecuciones").update({ estado: nuevo }).eq("id", id).select("id").single());
      await reload();
    }, `${EVENTO_LABEL[tipo]} registrada.`);

  const finalizar = (tipo: Evento) => {
    if (!fotosOk) {
      acc.setError(`Antes de finalizar, sube al menos ${MIN_FOTOS[linea]} ${MIN_FOTOS[linea] === 1 ? "foto" : "fotos"} (llevas ${data.fotos.length}).`);
      return;
    }
    registrar(tipo, "finalizada");
  };

  return (
    <Page
      title={servicioLabel(linea, j.servicio)}
      back="/operador"
      subtitle={<><span className="font-mono text-xs text-brand-green-light">{lineaLabel[linea]}</span> · <Estado map={estadoEjecucion} value={j.estado} /></>}
    >
      <Card>
        <Dl
          items={[
            ["Campaña", j.campanias?.nombre],
            ["Cliente", j.campanias?.empresas?.nombre],
            ["Fecha", fecha(j.fecha)],
            ["Horario", j.hora_inicio_prog ? `${hora(j.hora_inicio_prog)}–${hora(j.hora_fin_prog)}` : "Todo el día"],
            ["Unidad", j.unidades ? `${j.unidades.nombre}${j.unidades.placa ? ` (${j.unidades.placa})` : ""}` : ""],
            [linea === "move" ? "Zonas a recorrer" : "Lugar", linea === "move" ? j.zonas.join(", ") : j.punto_nombre],
          ]}
        />
      </Card>

      {/* Acciones principales */}
      {activa ? (
        <Card title="Registro">
          <div className="grid gap-3">
            {linea === "move" && j.estado === "programada" && <Grande icon={<Play />} onClick={() => registrar("inicio", "en_curso")} busy={acc.busy}>Iniciar recorrido</Grande>}
            {linea === "move" && j.estado === "en_curso" && (
              <>
                <Grande variant="secondary" icon={<Pause />} onClick={() => registrar("pausa", "pausada")} busy={acc.busy}>Pausar</Grande>
                <Grande icon={<Square />} onClick={() => finalizar("fin")} busy={acc.busy}>Finalizar recorrido</Grande>
              </>
            )}
            {linea === "move" && j.estado === "pausada" && (
              <>
                <Grande icon={<Play />} onClick={() => registrar("reanudacion", "en_curso")} busy={acc.busy}>Reanudar</Grande>
                <Grande variant="secondary" icon={<Square />} onClick={() => finalizar("fin")} busy={acc.busy}>Finalizar recorrido</Grande>
              </>
            )}
            {linea === "events" && j.estado === "programada" && <Grande icon={<MapPin />} onClick={() => registrar("llegada", "en_curso")} busy={acc.busy}>Registrar llegada</Grande>}
            {linea === "events" && j.estado !== "programada" && <Grande icon={<Flag />} onClick={() => finalizar("salida")} busy={acc.busy}>Registrar salida y finalizar</Grande>}
            {linea === "place" && j.estado === "programada" && (
              <>
                <Grande icon={<MapPin />} onClick={() => registrar("instalacion", "en_curso")} busy={acc.busy}>Registrar instalación</Grande>
                <Grande variant="secondary" icon={<MapPin />} onClick={() => registrar("verificacion", "en_curso")} busy={acc.busy}>Registrar verificación</Grande>
              </>
            )}
            {linea === "place" && j.estado !== "programada" && <Grande icon={<Flag />} onClick={() => finalizar("fin")} busy={acc.busy}>Finalizar</Grande>}
            <ErrorBox msg={acc.error} />
            <OkBox msg={acc.ok} />
            {avisoUbic && <p className="text-xs text-[#ffd48a]">No se pudo obtener tu ubicación. Activa el GPS y da permiso de ubicación al navegador.</p>}
            <p className="text-xs text-muted">La hora que cuenta es la del servidor al momento de registrar.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm">
            {j.estado === "finalizada" ? "Jornada finalizada. El equipo de Publicalle la revisará." : j.estado === "validada" ? "Jornada validada por el equipo." : `Estado: ${estadoEjecucion[j.estado][0]}.`}
          </p>
          {j.motivo_rechazo && <p className="mt-2 text-sm text-red-200">Motivo: {j.motivo_rechazo}</p>}
        </Card>
      )}

      {/* GPS (solo MOVE) */}
      {linea === "move" && (j.estado === "en_curso" || gps.pendientes > 0) && (
        <Card title="GPS" actions={<GpsBadge estado={gps.estado} />}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Mini label="Km (este teléfono)" value={gps.km.toFixed(1)} />
            <Mini label="Puntos enviados" value={String(gps.enviados)} />
            <Mini label="Por enviar" value={String(gps.pendientes)} />
          </div>
          <ul className="mt-4 grid gap-1 text-xs text-muted">
            <li>{gps.pantalla ? "✓ La pantalla se mantiene encendida." : "Mantén esta pantalla abierta y encendida durante el recorrido."}</li>
            {gps.precision != null && <li>Precisión actual: ±{gps.precision} m</li>}
            {gps.estado === "denegado" && <li className="text-red-200">Sin permiso de ubicación: actívalo en los ajustes del navegador.</li>}
            <li>Si no hay señal, los puntos se guardan en el teléfono y se envían al volver la conexión.</li>
          </ul>
        </Card>
      )}

      {/* Fotos */}
      <Card title={`Fotos (${data.fotos.length})`} actions={<Badge tone={fotosOk ? "green" : "amber"}>Mínimo {MIN_FOTOS[linea]}</Badge>}>
        {data.fotos.length > 0 && (
          <ul className="mb-4 grid grid-cols-3 gap-2">
            {data.fotos.map((f) => (
              <li key={f.id} className="overflow-hidden rounded-lg ring-1 ring-inset ring-line">
                {f.url ? <img src={f.url} alt={momentoLabel[f.momento ?? "otro"] ?? "Foto"} className="aspect-square w-full object-cover" loading="lazy" /> : <div className="aspect-square bg-white/5" />}
                <p className="px-1.5 py-1 text-[0.7rem] text-muted" aria-hidden>{momentoLabel[f.momento ?? "otro"]}</p>
              </li>
            ))}
          </ul>
        )}
        {activa ? (
          <div className="grid gap-3">
            <Field label="¿Qué muestra la foto?">
              <Select value={momentoSel} onChange={(e) => setMomento(e.target.value)} options={MOMENTOS[linea].map((m) => [m, momentoLabel[m]])} />
            </Field>
            <label className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-green text-base font-semibold text-brand-blue-dark hover:bg-brand-green-light ${foto.busy ? "pointer-events-none opacity-60" : ""}`}>
              <Camera className="size-5" aria-hidden />
              {foto.busy ? "Subiendo…" : "Tomar o subir foto"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(ev) => {
                  const files = [...(ev.target.files ?? [])];
                  ev.target.value = "";
                  if (!files.length) return;
                  foto.run(async () => {
                    const p = await ubicacion(8000);
                    for (const file of files) {
                      const blob = await comprimir(file);
                      const tipo = blob.type || file.type;
                      if (!["image/jpeg", "image/webp", "image/heic"].includes(tipo)) throw new Error("Formato de imagen no permitido. Usa la cámara del teléfono.");
                      const ext = tipo === "image/jpeg" ? "jpg" : tipo.split("/")[1];
                      const path = `${id}/${crypto.randomUUID()}.${ext}`;
                      const up = await sb.storage.from("evidencias").upload(path, blob, { contentType: tipo, upsert: false });
                      if (up.error) throw up.error;
                      must(
                        await sb
                          .from("evidencias")
                          .insert({ ejecucion_id: id, storage_path: path, sha256: await sha256(blob), tipo: "foto", momento: momentoSel, capturado_en: new Date(file.lastModified || Date.now()).toISOString(), lat: p?.lat ?? null, lng: p?.lng ?? null, subida_por: perfil?.id })
                          .select("id")
                          .single(),
                      );
                    }
                    acc.setError(null); // quita el aviso de "faltan fotos"
                    await reload();
                  }, files.length > 1 ? `${files.length} fotos subidas.` : "Foto subida.");
                }}
              />
            </label>
            <ErrorBox msg={foto.error} />
            <OkBox msg={foto.ok} />
          </div>
        ) : (
          !data.fotos.length && <p className="text-sm text-muted">Sin fotos.</p>
        )}
      </Card>

      {/* Incidencias */}
      {activa && (
        <Card>
          {!incidencia.abierta ? (
            <Btn variant="secondary" icon={<TriangleAlert className="size-4" aria-hidden />} onClick={() => setIncidencia({ ...incidencia, abierta: true })}>
              Reportar un problema
            </Btn>
          ) : (
            <form
              className="grid gap-3"
              onSubmit={(ev) => {
                ev.preventDefault();
                inc.run(async () => {
                  const p = await ubicacion(8000);
                  // sin .select(): el operador puede crear incidencias pero no leerlas (solo el staff)
                  const r = await sb.from("incidencias").insert({ ejecucion_id: id, tipo: incidencia.tipo, descripcion: incidencia.descripcion.trim(), lat: p?.lat ?? null, lng: p?.lng ?? null, registrado_por: perfil?.id });
                  if (r.error) throw r.error;
                  setIncidencia({ abierta: false, tipo: "mecanica", descripcion: "" });
                }, "Problema reportado. El equipo lo verá en el panel.");
              }}
            >
              <p className="font-semibold">Reportar un problema</p>
              <Field label="Tipo"><Select value={incidencia.tipo} onChange={(e) => setIncidencia({ ...incidencia, tipo: e.target.value })} options={TIPOS_INCIDENCIA} /></Field>
              <Field label="¿Qué pasó?"><Textarea required minLength={3} maxLength={1000} value={incidencia.descripcion} onChange={(e) => setIncidencia({ ...incidencia, descripcion: e.target.value })} /></Field>
              <ErrorBox msg={inc.error} />
              <div className="flex gap-2">
                <Btn type="submit" loading={inc.busy}>Enviar</Btn>
                <Btn variant="ghost" onClick={() => setIncidencia({ ...incidencia, abierta: false })}>Cancelar</Btn>
              </div>
            </form>
          )}
          <OkBox msg={inc.ok} />
        </Card>
      )}

      {data.eventos.length > 0 && (
        <Card title="Registros">
          <ol className="grid gap-2 text-sm">
            {data.eventos.map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span>{EVENTO_LABEL[e.tipo]}</span>
                <span className="text-muted">{fechaHora(e.registrado_en)}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </Page>
  );
}

function Grande({ children, icon, onClick, busy, variant = "primary" }: { children: string; icon: React.ReactNode; onClick: () => void; busy: boolean; variant?: "primary" | "secondary" }) {
  return (
    <Btn variant={variant} loading={busy} onClick={onClick} icon={icon} className="min-h-14 w-full text-base [&_svg]:size-5">
      {children}
    </Btn>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-inset ring-line">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-[0.7rem] text-muted">{label}</p>
    </div>
  );
}

function GpsBadge({ estado }: { estado: string }) {
  const map: Record<string, [string, "green" | "amber" | "red" | "gray"]> = {
    activo: ["Activo", "green"], buscando: ["Buscando señal…", "amber"], denegado: ["Sin permiso", "red"], no_disponible: ["No disponible", "red"], apagado: ["Apagado", "gray"],
  };
  const [l, t] = map[estado] ?? ["—", "gray"];
  return <Badge tone={t}>{l}</Badge>;
}
