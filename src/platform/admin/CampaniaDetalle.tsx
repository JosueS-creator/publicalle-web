import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CalendarPlus, Plus, Save, Trash2 } from "lucide-react";
import { sb } from "../supabase";
import { catalogo, estadoCampania, estadoEjecucion, fecha, hora, lineaLabel, lista, servicioLabel } from "../labels";
import type { Enum } from "../database.types";
import { Btn, Card, Chips, Empty, ErrorBox, Estado, Field, Input, Loading, OkBox, Page, Select, Table, Td, must, useAction, useAsync } from "../ui";

const UNIDADES_MEDIDA: [string, string][] = [
  ["jornada", "Jornadas"], ["dia", "Días"], ["hora", "Horas"], ["evento", "Eventos"], ["ubicacion", "Ubicaciones"],
];
const catalogoOpts: [string, string][] = catalogo.flatMap((l) => l.opciones.map((o) => [`${l.linea}:${o.servicio}`, `${lineaLabel[l.linea]} · ${o.label}`] as [string, string]));

/** Días entre dos fechas AAAA-MM-DD (inclusive). */
function rangoDias(desde: string, hasta: string) {
  const out: string[] = [];
  const d = new Date(`${desde}T00:00:00Z`);
  const fin = new Date(`${(hasta || desde)}T00:00:00Z`);
  while (d <= fin && out.length < 92) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export default function CampaniaDetalle() {
  const { id = "" } = useParams();
  const { data, error, loading, reload } = useAsync(async () => {
    const [c, serv, jor, unidades, operadores] = await Promise.all([
      sb.from("campanias").select("*, empresas(id, nombre)").eq("id", id).single(),
      sb.from("campania_servicios").select("*").eq("campania_id", id).order("linea"),
      sb
        .from("ejecuciones")
        .select("id, fecha, hora_inicio_prog, hora_fin_prog, linea, servicio, estado, zonas, punto_nombre, unidades(nombre), operador:perfiles!ejecuciones_operador_id_fkey(nombre)")
        .eq("campania_id", id)
        .order("fecha")
        .order("hora_inicio_prog"),
      sb.from("unidades").select("id, nombre, tipo").eq("activa", true).order("nombre"),
      sb.from("perfiles").select("id, nombre").eq("rol", "operador").eq("activo", true).order("nombre"),
    ]);
    return { c: must(c), serv: must(serv), jor: must(jor), unidades: must(unidades), operadores: must(operadores) };
  }, [id]);

  const [f, setF] = useState({ nombre: "", estado: "borrador" as Enum<"estado_campania">, objetivo: "", ciudades: "", zonas: "", fecha_inicio: "", fecha_fin: "" });
  const guardar = useAction();
  const servAcc = useAction();
  const [ns, setNs] = useState({ id: "", cantidad: "1", unidad_medida: "jornada" });

  useEffect(() => {
    if (!data) return;
    const c = data.c;
    setF({
      nombre: c.nombre, estado: c.estado, objetivo: c.objetivo ?? "", ciudades: c.ciudades.join(", "), zonas: c.zonas.join(", "),
      fecha_inicio: c.fecha_inicio ?? "", fecha_fin: c.fecha_fin ?? "",
    });
  }, [data]);

  if (loading) return <Page title="Campaña" back="/admin/campanias"><Loading /></Page>;
  if (!data) return <Page title="Campaña" back="/admin/campanias"><ErrorBox msg={error} /></Page>;
  const { c } = data;

  return (
    <Page
      title={c.nombre}
      back="/admin/campanias"
      subtitle={
        <>
          <Link to={`/admin/clientes/${c.empresas?.id}`} className="underline-offset-4 hover:underline">{c.empresas?.nombre}</Link> · <Estado map={estadoCampania} value={c.estado} />
        </>
      }
    >
      <Card title="Datos de la campaña">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            guardar.run(async () => {
              must(
                await sb
                  .from("campanias")
                  .update({
                    nombre: f.nombre.trim(), estado: f.estado, objetivo: f.objetivo.trim() || null, ciudades: lista(f.ciudades), zonas: lista(f.zonas),
                    fecha_inicio: f.fecha_inicio || null, fecha_fin: f.fecha_fin || null,
                  })
                  .eq("id", id)
                  .select("id")
                  .single(),
              );
              await reload();
            }, "Campaña guardada.");
          }}
        >
          <Field label="Nombre"><Input required maxLength={120} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
          <Field label="Estado">
            <Select value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value as Enum<"estado_campania"> })} options={(Object.keys(estadoCampania) as Enum<"estado_campania">[]).map((k) => [k, estadoCampania[k][0]])} />
          </Field>
          <Field label="Objetivo" className="sm:col-span-2"><Input maxLength={200} value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })} /></Field>
          <Field label="Ciudades" hint="Separadas por coma."><Input value={f.ciudades} onChange={(e) => setF({ ...f, ciudades: e.target.value })} /></Field>
          <Field label="Zonas contratadas" hint="Separadas por coma. El cliente ve «zonas cubiertas x de y» con esta lista.">
            <Input value={f.zonas} onChange={(e) => setF({ ...f, zonas: e.target.value })} placeholder="Col. Kennedy, Centro, Miraflores" />
          </Field>
          <Field label="Fecha de inicio"><Input type="date" value={f.fecha_inicio} onChange={(e) => setF({ ...f, fecha_inicio: e.target.value })} /></Field>
          <Field label="Fecha final"><Input type="date" min={f.fecha_inicio || undefined} value={f.fecha_fin} onChange={(e) => setF({ ...f, fecha_fin: e.target.value })} /></Field>
          <div className="grid gap-3 sm:col-span-2">
            <ErrorBox msg={guardar.error} />
            <OkBox msg={guardar.ok} />
            <div><Btn type="submit" loading={guardar.busy} icon={<Save className="size-4" aria-hidden />}>Guardar</Btn></div>
          </div>
        </form>
      </Card>

      <Card title="Servicios contratados">
        {!data.serv.length ? (
          <Empty>Sin servicios todavía.</Empty>
        ) : (
          <ul className="mb-5 divide-y divide-line">
            {data.serv.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{servicioLabel(s.linea, s.servicio)}</p>
                  <p className="text-xs text-muted">{lineaLabel[s.linea]} · Cantidad: {s.cantidad} ({UNIDADES_MEDIDA.find(([k]) => k === s.unidad_medida)?.[1].toLowerCase() ?? s.unidad_medida})</p>
                </div>
                <Btn
                  variant="ghost"
                  aria-label={`Quitar ${servicioLabel(s.linea, s.servicio)}`}
                  icon={<Trash2 className="size-4" aria-hidden />}
                  onClick={() => servAcc.run(async () => { must(await sb.from("campania_servicios").delete().eq("id", s.id).select("id")); await reload(); })}
                >
                  Quitar
                </Btn>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
          onSubmit={(ev) => {
            ev.preventDefault();
            const [linea, servicio] = ns.id.split(":");
            servAcc.run(async () => {
              must(await sb.from("campania_servicios").insert({ campania_id: id, linea: linea as Enum<"linea_servicio">, servicio, cantidad: Number(ns.cantidad) || 1, unidad_medida: ns.unidad_medida }).select("id"));
              setNs({ ...ns, id: "" });
              await reload();
            });
          }}
        >
          <Field label="Agregar servicio"><Select required value={ns.id} onChange={(e) => setNs({ ...ns, id: e.target.value })} placeholder="Elige un servicio" options={catalogoOpts} /></Field>
          <Field label="Cantidad"><Input type="number" min={1} step="any" value={ns.cantidad} onChange={(e) => setNs({ ...ns, cantidad: e.target.value })} /></Field>
          <Field label="Medida"><Select value={ns.unidad_medida} onChange={(e) => setNs({ ...ns, unidad_medida: e.target.value })} options={UNIDADES_MEDIDA} /></Field>
          <Btn type="submit" variant="secondary" loading={servAcc.busy} icon={<Plus className="size-4" aria-hidden />}>Agregar</Btn>
        </form>
        <div className="mt-3"><ErrorBox msg={servAcc.error} /></div>
      </Card>

      <Card title="Jornadas">
        {!data.jor.length ? (
          <Empty>Aún no hay jornadas programadas.</Empty>
        ) : (
          <Table head={["Fecha", "Horario", "Servicio", "Unidad / operador", "Lugar", "Estado"]}>
            {data.jor.map((j) => (
              <tr key={j.id} className="hover:bg-white/[0.03]">
                <Td className="whitespace-nowrap">
                  <Link to={`/admin/jornadas/${j.id}`} className="font-semibold text-brand-green-light underline-offset-4 hover:underline">{fecha(j.fecha)}</Link>
                </Td>
                <Td className="whitespace-nowrap text-muted">{j.hora_inicio_prog ? `${hora(j.hora_inicio_prog)}–${hora(j.hora_fin_prog)}` : "Todo el día"}</Td>
                <Td>{servicioLabel(j.linea, j.servicio)}</Td>
                <Td className="text-muted">{[j.unidades?.nombre, j.operador?.nombre].filter(Boolean).join(" · ") || "Sin asignar"}</Td>
                <Td className="text-muted">{j.linea === "move" ? j.zonas.join(", ") : j.punto_nombre}</Td>
                <Td><Estado map={estadoEjecucion} value={j.estado} /></Td>
              </tr>
            ))}
          </Table>
        )}
        <NuevaJornada campaniaId={id} zonasCampania={c.zonas} servicios={data.serv} unidades={data.unidades} operadores={data.operadores} onDone={reload} />
      </Card>

      <EliminarCampania id={id} nombre={c.nombre} solicitudId={c.solicitud_id} validadas={data.jor.filter((j) => j.estado === "validada").length} />
    </Page>
  );
}

function NuevaJornada({
  campaniaId, zonasCampania, servicios, unidades, operadores, onDone,
}: {
  campaniaId: string;
  zonasCampania: string[];
  servicios: { linea: Enum<"linea_servicio">; servicio: string }[];
  unidades: { id: string; nombre: string }[];
  operadores: { id: string; nombre: string }[];
  onDone: () => Promise<void>;
}) {
  const opts = useMemo<[string, string][]>(() => {
    const propios = servicios.map((s) => [`${s.linea}:${s.servicio}`, `${lineaLabel[s.linea]} · ${servicioLabel(s.linea, s.servicio)}`] as [string, string]);
    const uniq = new Map(propios);
    return uniq.size ? [...uniq] : catalogoOpts;
  }, [servicios]);
  const [j, setJ] = useState({ serv: "", desde: "", hasta: "", hi: "", hf: "", unidad: "", operador: "", zonas: [] as string[], punto: "" });
  const acc = useAction();
  const linea = j.serv.split(":")[0] as Enum<"linea_servicio"> | "";
  const dias = j.desde ? rangoDias(j.desde, j.hasta) : [];

  return (
    <form
      className="mt-6 grid gap-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-line sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        const [l, servicio] = j.serv.split(":");
        acc.run(async () => {
          if (j.hi && j.hf && j.hf <= j.hi) throw new Error("La hora final debe ser posterior a la de inicio.");
          const rows = dias.map((d) => ({
            campania_id: campaniaId, linea: l as Enum<"linea_servicio">, servicio, fecha: d,
            hora_inicio_prog: j.hi || null, hora_fin_prog: j.hf || null,
            unidad_id: j.unidad || null, operador_id: j.operador || null,
            zonas: l === "move" ? j.zonas : [], punto_nombre: l !== "move" ? j.punto.trim() || null : null,
          }));
          must(await sb.from("ejecuciones").insert(rows).select("id"));
          setJ({ ...j, desde: "", hasta: "" });
          await onDone();
        }, dias.length > 1 ? `${dias.length} jornadas programadas.` : "Jornada programada.");
      }}
    >
      <p className="font-semibold sm:col-span-2 lg:col-span-4">Programar jornada</p>
      <Field label="Servicio" className="sm:col-span-2"><Select required value={j.serv} onChange={(e) => setJ({ ...j, serv: e.target.value })} placeholder="Elige un servicio" options={opts} /></Field>
      <Field label="Fecha"><Input type="date" required value={j.desde} onChange={(e) => setJ({ ...j, desde: e.target.value })} /></Field>
      <Field label="Repetir hasta (opcional)" hint="Crea una jornada por día."><Input type="date" min={j.desde || undefined} value={j.hasta} onChange={(e) => setJ({ ...j, hasta: e.target.value })} /></Field>
      <Field label="Hora de inicio"><Input type="time" step={900} value={j.hi} onChange={(e) => setJ({ ...j, hi: e.target.value })} /></Field>
      <Field label="Hora final"><Input type="time" step={900} value={j.hf} onChange={(e) => setJ({ ...j, hf: e.target.value })} /></Field>
      <Field label="Unidad"><Select value={j.unidad} onChange={(e) => setJ({ ...j, unidad: e.target.value })} placeholder="Sin unidad" options={unidades.map((u) => [u.id, u.nombre])} /></Field>
      <Field label="Operador"><Select value={j.operador} onChange={(e) => setJ({ ...j, operador: e.target.value })} placeholder="Sin operador" options={operadores.map((o) => [o.id, o.nombre])} /></Field>
      {linea === "move" ? (
        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-4">
          <span className="text-sm font-medium text-brand-white/90">Zonas a recorrer</span>
          {zonasCampania.length ? (
            <Chips label="Zonas a recorrer" options={zonasCampania} value={j.zonas} onChange={(z) => setJ({ ...j, zonas: z })} />
          ) : (
            <span className="text-xs text-muted">Agrega las zonas contratadas en «Datos de la campaña» para poder elegirlas.</span>
          )}
        </div>
      ) : linea ? (
        <Field label="Lugar / punto" className="sm:col-span-2"><Input maxLength={160} value={j.punto} onChange={(e) => setJ({ ...j, punto: e.target.value })} placeholder="Ej.: Mall Multiplaza, entrada principal" /></Field>
      ) : null}
      <div className="grid gap-3 sm:col-span-2 lg:col-span-4">
        <ErrorBox msg={acc.error} />
        <OkBox msg={acc.ok} />
        <div>
          <Btn type="submit" loading={acc.busy} icon={<CalendarPlus className="size-4" aria-hidden />}>
            {dias.length > 1 ? `Programar ${dias.length} jornadas` : "Programar jornada"}
          </Btn>
        </div>
      </div>
    </form>
  );
}

/** Borra la campaña con sus servicios, jornadas, registros y evidencias (incluidos los archivos). No se puede deshacer. */
function EliminarCampania({ id, nombre, solicitudId, validadas }: { id: string; nombre: string; solicitudId: string | null; validadas: number }) {
  const nav = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [confirma, setConfirma] = useState("");
  const acc = useAction();

  return (
    <Card title="Eliminar campaña" className="ring-red-400/25">
      {!abierto ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Borra la campaña, sus jornadas y todas sus evidencias. No se puede deshacer.</p>
          <Btn variant="danger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setAbierto(true)}>Eliminar campaña</Btn>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            acc.run(async () => {
              if (confirma.trim() !== nombre.trim()) throw new Error("El nombre no coincide.");
              // 1) rutas de los archivos de evidencia (Storage no se borra en cascada)
              const jor = must(await sb.from("ejecuciones").select("id").eq("campania_id", id));
              const paths = jor.length ? must(await sb.from("evidencias").select("storage_path").in("ejecucion_id", jor.map((j) => j.id))).map((e) => e.storage_path) : [];
              // 2) campaña: servicios, jornadas, eventos, GPS, evidencias e incidencias se borran en cascada
              must(await sb.from("campanias").delete().eq("id", id).select("id").single());
              // 3) archivos (si esto falla, solo quedan archivos huérfanos; los datos ya se borraron)
              for (let i = 0; i < paths.length; i += 100) await sb.storage.from("evidencias").remove(paths.slice(i, i + 100));
              // 4) la solicitud de origen vuelve a "en revisión" para poder convertirla otra vez
              if (solicitudId) await sb.from("solicitudes").update({ estado: "en_revision" }).eq("id", solicitudId);
              nav("/admin/campanias", { replace: true });
            });
          }}
        >
          {validadas > 0 && (
            <ErrorBox msg={`Esta campaña tiene ${validadas} ${validadas === 1 ? "jornada validada" : "jornadas validadas"} que el cliente ya ve en su portal. Si solo quieres detenerla, cambia su estado a «Cancelada».`} />
          )}
          <Field label={`Para confirmar, escribe el nombre de la campaña: ${nombre}`}>
            <Input value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="off" />
          </Field>
          <ErrorBox msg={acc.error} />
          <div className="flex flex-wrap gap-2">
            <Btn type="submit" variant="danger" loading={acc.busy} disabled={confirma.trim() !== nombre.trim()} icon={<Trash2 className="size-4" aria-hidden />}>
              Eliminar definitivamente
            </Btn>
            <Btn variant="ghost" onClick={() => { setAbierto(false); setConfirma(""); }}>Cancelar</Btn>
          </div>
        </form>
      )}
    </Card>
  );
}
