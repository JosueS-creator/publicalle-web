import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { sb } from "../supabase";
import { fecha, hora } from "../labels";
import type { Row } from "../database.types";
import { Badge, Btn, Card, Empty, ErrorBox, Field, Input, Loading, OkBox, Page, Select, Table, Td, must, useAction, useAsync } from "../ui";
import { cn } from "@/lib/cn";

type F = Row<"agenda_franjas">;
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const vacia = { nombre: "", hora_inicio: "06:00", hora_fin: "08:00", dias_semana: [1, 2, 3, 4, 5], cupos: "1", orden: "0" };

const isoHN = (d: Date) => new Date(d.getTime() - 6 * 3600_000).toISOString().slice(0, 10);
const sumar = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
const diaSemana = (iso: string) => DIAS[(new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7];

/**
 * Agenda de PubliEscuela: horarios que el cliente puede elegir, cupos y días sin servicio.
 * La disponibilidad se calcula en el servidor (reservas de solicitudes + vehículos programados).
 */
export default function Agenda() {
  const [desde, setDesde] = useState(() => isoHN(new Date()));
  const hasta = sumar(desde, 13);
  const { data, error, loading, reload } = useAsync(async () => {
    const [f, b, o] = await Promise.all([
      sb.from("agenda_franjas").select("*").order("orden").order("hora_inicio"),
      sb.from("agenda_bloqueos").select("*, agenda_franjas(nombre)").gte("fecha", isoHN(new Date())).order("fecha"),
      sb.rpc("agenda_ocupacion", { p_desde: desde, p_hasta: hasta }),
    ]);
    return { franjas: must(f), bloqueos: must(b), ocupacion: must(o) };
  }, [desde]);

  const [f, setF] = useState(vacia);
  const [editId, setEditId] = useState<string | null>(null);
  const [bl, setBl] = useState({ fecha: "", franja: "", motivo: "" });
  const acc = useAction();

  const dias = useMemo(() => [...new Set((data?.ocupacion ?? []).map((o) => o.fecha))], [data]);
  const celda = (d: string, franja: string) => data?.ocupacion.find((o) => o.fecha === d && o.franja_id === franja);

  const editar = (x: F) => {
    setEditId(x.id);
    setF({ nombre: x.nombre, hora_inicio: hora(x.hora_inicio), hora_fin: hora(x.hora_fin), dias_semana: x.dias_semana, cupos: String(x.cupos), orden: String(x.orden) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Page title="Agenda" subtitle="Horarios de PubliEscuela que el cliente puede elegir en la web, con su cupo y los días sin servicio.">
      <ErrorBox msg={error ?? acc.error} />
      <OkBox msg={acc.ok} />

      <Card title="Ocupación" actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" className="min-h-9 px-2" aria-label="Semanas anteriores" onClick={() => setDesde(sumar(desde, -14))}><ChevronLeft className="size-4" aria-hidden /></Btn>
          <span className="text-sm text-muted">{fecha(desde)} – {fecha(hasta)}</span>
          <Btn variant="ghost" className="min-h-9 px-2" aria-label="Semanas siguientes" onClick={() => setDesde(sumar(desde, 14))}><ChevronRight className="size-4" aria-hidden /></Btn>
        </div>
      }>
        {loading ? <Loading /> : !data?.franjas.length ? (
          <Empty>Crea un horario para empezar.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Día</th>
                  {data.franjas.filter((x) => x.activa).map((x) => (
                    <th key={x.id} scope="col" className="px-3 py-2.5 font-medium">{x.nombre}<span className="block font-normal">{hora(x.hora_inicio)}–{hora(x.hora_fin)} · {x.cupos} cupo{x.cupos === 1 ? "" : "s"}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dias.map((d) => (
                  <tr key={d} className="border-b border-line/60 last:border-0">
                    <td className="whitespace-nowrap px-5 py-2.5 sm:px-6"><span className="text-muted">{diaSemana(d)}</span> {fecha(d)}</td>
                    {data.franjas.filter((x) => x.activa).map((x) => {
                      const c = celda(d, x.id);
                      if (!c) return <td key={x.id} className="px-3 py-2.5 text-muted">—</td>;
                      const usados = c.cupos - c.libres;
                      return (
                        <td key={x.id} className="px-3 py-2.5 align-top">
                          {c.bloqueado ? <Badge tone="gray">Sin servicio</Badge> : (
                            <Badge tone={c.libres > 0 ? (usados > 0 ? "amber" : "green") : "red"}>{c.libres > 0 ? `${c.libres} libre${c.libres === 1 ? "" : "s"}` : "Lleno"}</Badge>
                          )}
                          {c.reservas.map((r) => (
                            <Link key={r.id} to={`/admin/solicitudes/${r.id}`} className="mt-1 block text-xs text-brand-green-light underline-offset-2 hover:underline">
                              {r.folio} · {r.contacto}
                            </Link>
                          ))}
                          {!c.bloqueado && usados > c.reservas.length && <span className="mt-1 block text-xs text-muted">Vehículo en otra jornada</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted">Una solicitud de PubliEscuela aparta su cupo mientras está nueva, en revisión o convertida en campaña. Si la descartas, el cupo se libera. Los vehículos programados en Jornadas en ese horario también ocupan cupo.</p>
      </Card>

      <Card title={editId ? "Editar horario" : "Nuevo horario"}>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
          onSubmit={(ev) => {
            ev.preventDefault();
            acc.run(async () => {
              if (f.hora_fin <= f.hora_inicio) throw new Error("La hora final debe ser posterior a la de inicio.");
              if (!f.dias_semana.length) throw new Error("Elige al menos un día.");
              const row = { nombre: f.nombre.trim(), hora_inicio: f.hora_inicio, hora_fin: f.hora_fin, dias_semana: [...f.dias_semana].sort(), cupos: Number(f.cupos), orden: Number(f.orden) || 0 };
              if (editId) must(await sb.from("agenda_franjas").update(row).eq("id", editId).select("id").single());
              else must(await sb.from("agenda_franjas").insert(row).select("id").single());
              setF(vacia);
              setEditId(null);
              await reload();
            }, editId ? "Horario actualizado." : "Horario creado.");
          }}
        >
          <Field label="Nombre" className="lg:col-span-2"><Input required minLength={2} maxLength={60} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Entrada de la mañana" /></Field>
          <Field label="Desde"><Input type="time" step={900} required value={f.hora_inicio} onChange={(e) => setF({ ...f, hora_inicio: e.target.value })} /></Field>
          <Field label="Hasta"><Input type="time" step={900} required value={f.hora_fin} onChange={(e) => setF({ ...f, hora_fin: e.target.value })} /></Field>
          <Field label="Cupos" hint="Campañas a la vez"><Input type="number" min={0} max={50} required value={f.cupos} onChange={(e) => setF({ ...f, cupos: e.target.value })} /></Field>
          <Field label="Orden"><Input type="number" min={0} value={f.orden} onChange={(e) => setF({ ...f, orden: e.target.value })} /></Field>
          <div className="grid gap-1.5 sm:col-span-2 lg:col-span-6">
            <span className="text-sm font-medium text-brand-white/90">Días</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Días de la semana">
              {DIAS.map((d, i) => {
                const n = i + 1;
                const on = f.dias_semana.includes(n);
                return (
                  <button key={d} type="button" aria-pressed={on} onClick={() => setF({ ...f, dias_semana: on ? f.dias_semana.filter((x) => x !== n) : [...f.dias_semana, n] })}
                    className={cn("min-h-9 rounded-full px-3 text-sm ring-1 ring-inset", on ? "bg-brand-green font-semibold text-brand-blue-dark ring-brand-green" : "ring-white/20 hover:bg-white/10")}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
            <Btn type="submit" loading={acc.busy} icon={<Plus className="size-4" aria-hidden />}>{editId ? "Guardar" : "Crear horario"}</Btn>
            {editId && <Btn type="button" variant="ghost" onClick={() => { setEditId(null); setF(vacia); }}>Cancelar</Btn>}
          </div>
        </form>
      </Card>

      <Card title="Horarios">
        {!data?.franjas.length ? <Empty>Sin horarios.</Empty> : (
          <Table head={["Horario", "Días", "Cupos", "Estado", ""]}>
            {data.franjas.map((x) => (
              <tr key={x.id}>
                <Td><p className="font-semibold">{x.nombre}</p><p className="text-xs text-muted">{hora(x.hora_inicio)} – {hora(x.hora_fin)}</p></Td>
                <Td className="text-muted">{x.dias_semana.map((n) => DIAS[n - 1]).join(", ")}</Td>
                <Td>{x.cupos}</Td>
                <Td>{x.activa ? <Badge tone="green">Visible en la web</Badge> : <Badge tone="gray">Oculto</Badge>}</Td>
                <Td className="whitespace-nowrap text-right">
                  <Btn variant="ghost" className="min-h-8 px-3 text-xs" onClick={() => editar(x)}>Editar</Btn>
                  <Btn variant="ghost" className="min-h-8 px-3 text-xs" onClick={() => acc.run(async () => { must(await sb.from("agenda_franjas").update({ activa: !x.activa }).eq("id", x.id).select("id").single()); await reload(); })}>
                    {x.activa ? "Ocultar" : "Mostrar"}
                  </Btn>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Días sin servicio">
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            acc.run(async () => {
              must(await sb.from("agenda_bloqueos").insert({ fecha: bl.fecha, franja_id: bl.franja || null, motivo: bl.motivo.trim() || null }).select("id").single());
              setBl({ fecha: "", franja: "", motivo: "" });
              await reload();
            }, "Día bloqueado.");
          }}
        >
          <Field label="Fecha"><Input type="date" required min={isoHN(new Date())} value={bl.fecha} onChange={(e) => setBl({ ...bl, fecha: e.target.value })} /></Field>
          <Field label="Horario"><Select value={bl.franja} onChange={(e) => setBl({ ...bl, franja: e.target.value })} placeholder="Todo el día" options={(data?.franjas ?? []).map((x) => [x.id, x.nombre])} /></Field>
          <Field label="Motivo"><Input maxLength={120} value={bl.motivo} onChange={(e) => setBl({ ...bl, motivo: e.target.value })} placeholder="Feriado, vacaciones…" /></Field>
          <div className="flex items-end"><Btn type="submit" loading={acc.busy}>Bloquear</Btn></div>
        </form>
        <p className="mt-3 text-xs text-muted">Bloquear un día no cancela reservas ya hechas: revísalas en Ocupación.</p>
        {!!data?.bloqueos.length && (
          <ul className="mt-5 divide-y divide-line">
            {data.bloqueos.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span><b>{diaSemana(b.fecha)} {fecha(b.fecha)}</b> · {(b as typeof b & { agenda_franjas: { nombre: string } | null }).agenda_franjas?.nombre ?? "Todo el día"}{b.motivo ? ` · ${b.motivo}` : ""}</span>
                <Btn variant="ghost" className="min-h-8 px-2" aria-label="Quitar bloqueo" onClick={() => acc.run(async () => { must(await sb.from("agenda_bloqueos").delete().eq("id", b.id).select("id").single()); await reload(); })}>
                  <Trash2 className="size-4" aria-hidden />
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
