import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, FilePlus2, Link2, Link2Off, Plus, Save, Send, Trash2, XCircle, Settings2 } from "lucide-react";
import { sb } from "../supabase";
import { estadoCotizacion, fecha, fechaHora, hoyISO, lineaLabel, servicioLabel } from "../labels";
import type { Row } from "../database.types";
import { Btn, Card, Empty, ErrorBox, Estado, Field, Input, Loading, OkBox, Select, Textarea, must, useAction, useAsync } from "../ui";
import { aEscala, calcLinea, calcTotales, centavosANumero, lempiras, type LineaOut } from "../cotizacion/dinero";
import { comoDoc, UNIDADES, unidadDesdeMedida, type CotizacionDoc } from "../cotizacion/tipos";
import { Documento } from "../cotizacion/Documento";
import { descargarPdf } from "../cotizacion/pdf";

type Cot = Row<"cotizaciones"> & { cotizacion_conceptos: Row<"cotizacion_conceptos">[] };
type Fila = { key: string; id: string; servId: string | null; concepto: string; descripcion: string; cantidad: string; unidad: string; precio: string; desc: string };
type Cfg = Row<"config_comercial">;

const num2 = (n: number) => String(n);
/** Lanza el error de una respuesta sin datos (funciones que no devuelven nada). */
const chk = (r: { error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
};
const nuevaFila = (p: Partial<Fila> = {}): Fila => {
  const id = crypto.randomUUID();
  return { key: id, id, servId: null, concepto: "", descripcion: "", cantidad: "1", unidad: "UN", precio: "", desc: "0", ...p };
};
const filaDesdeDb = (k: Row<"cotizacion_conceptos">): Fila => ({
  key: k.id, id: k.id, servId: k.campania_servicio_id, concepto: k.concepto, descripcion: k.descripcion ?? "", cantidad: num2(k.cantidad),
  unidad: k.unidad, precio: k.precio_unitario.toFixed(2), desc: num2(k.descuento_porcentaje),
});

const eventoTxt = (e: Row<"cotizacion_eventos">) => {
  const d = e.detalle as Record<string, unknown>;
  if (e.evento === "creada") return `Creada (versión ${d.version ?? 1})`;
  if (e.evento === "estado") return `Estado: ${estadoCotizacion[d.de as keyof typeof estadoCotizacion]?.[0] ?? d.de} → ${estadoCotizacion[d.a as keyof typeof estadoCotizacion]?.[0] ?? d.a}`;
  if (e.evento === "enlace_generado") return "Enlace público generado";
  if (e.evento === "enlace_revocado") return "Enlace público revocado";
  return e.evento;
};

export default function CotizacionCard({ campania, serv, onChange }: { campania: Row<"campanias">; serv: Row<"campania_servicios">[]; onChange: () => Promise<void> }) {
  const { data, error, loading, reload } = useAsync(async () => {
    const [cots, cfg, emp] = await Promise.all([
      sb.from("cotizaciones").select("*, cotizacion_conceptos(*)").eq("campania_id", campania.id).order("version", { ascending: false }),
      sb.from("config_comercial").select("*").maybeSingle(),
      sb.from("empresas").select("nombre, rtn, telefono, correo").eq("id", campania.empresa_id).single(),
    ]);
    const lista = must(cots) as Cot[];
    const eventos = lista.length ? must(await sb.from("cotizacion_eventos").select("*").in("cotizacion_id", lista.map((c) => c.id)).order("creado_en")) : [];
    return { cots: lista, cfg: cfg.data ?? null, emp: must(emp), eventos };
  }, [campania.id]);

  const [selId, setSelId] = useState<string | null>(null);
  const [f, setF] = useState({ proyecto: "", contacto: "", vigencia: "", impuesto: "0", condiciones: "" });
  const [rows, setRows] = useState<Fila[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const [confirma, setConfirma] = useState<"emitir" | "cancelar" | "borrar" | null>(null);
  const acc = useAction();
  const vencidasRef = useRef(false);

  const sel = useMemo(() => data?.cots.find((c) => c.id === selId) ?? data?.cots.find((c) => c.estado === "borrador") ?? data?.cots[0] ?? null, [data, selId]);

  // Cargar el editor cuando cambia el borrador seleccionado (o se guarda)
  const clave = sel ? `${sel.id}:${sel.actualizado_en}` : "";
  useEffect(() => {
    if (!sel || sel.estado !== "borrador") return;
    setF({ proyecto: sel.proyecto ?? campania.nombre, contacto: sel.cliente_contacto ?? "", vigencia: sel.vigencia_dias ? String(sel.vigencia_dias) : "", impuesto: num2(sel.impuesto_porcentaje), condiciones: sel.condiciones ?? "" });
    setRows([...sel.cotizacion_conceptos].sort((a, b) => a.orden - b.orden).map(filaDesdeDb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  useEffect(() => { setLink(null); setConfirma(null); }, [sel?.id]);

  // Marca como vencidas las cotizaciones emitidas cuya fecha ya pasó
  useEffect(() => {
    if (!data || vencidasRef.current) return;
    const hoy = hoyISO();
    if (data.cots.some((c) => (c.estado === "emitida" || c.estado === "compartida") && c.fecha_vencimiento && c.fecha_vencimiento < hoy)) {
      vencidasRef.current = true;
      sb.rpc("marcar_cotizaciones_vencidas").then(() => reload());
    }
  }, [data, reload]);

  // Cálculo exacto (mismo redondeo que la base de datos)
  const calc = useMemo(() => {
    const errores: string[] = [];
    const porFila: (LineaOut | null)[] = rows.map((r, i) => {
      const n = i + 1;
      const q = aEscala(r.cantidad, 2);
      const p = aEscala(r.precio, 2);
      const d = aEscala(r.desc || "0", 2);
      if (!r.concepto.trim()) errores.push(`Concepto ${n}: escribe el nombre.`);
      if (q === null || q <= 0n) errores.push(`Concepto ${n}: la cantidad debe ser mayor que 0 (máximo 2 decimales).`);
      if (p === null) errores.push(`Concepto ${n}: escribe el precio unitario (máximo 2 decimales).`);
      if (d === null || d > 10000n) errores.push(`Concepto ${n}: el descuento debe estar entre 0 y 100.`);
      return q !== null && q > 0n && p !== null && d !== null && d <= 10000n ? calcLinea({ cantidadH: q, precioC: p, descH: d }) : null;
    });
    const imp = aEscala(f.impuesto || "0", 2);
    if (imp === null || imp > 10000n) errores.push("ISV: el porcentaje debe estar entre 0 y 100.");
    const vig = f.vigencia.trim() ? Number(f.vigencia) : null;
    if (vig !== null && (!Number.isInteger(vig) || vig < 1 || vig > 3650)) errores.push("Vigencia: escribe un número de días entero (1 a 3650).");
    const t = calcTotales(porFila.map((l) => l ?? { brutoC: 0n, netoC: 0n }), imp ?? 0n);
    const ceros = rows.filter((r) => aEscala(r.precio, 2) === 0n).length;
    return { errores, porFila, t, imp: imp ?? 0n, vig, ceros };
  }, [rows, f.impuesto, f.vigencia]);

  const faltantes = useMemo(() => {
    const c = data?.cfg;
    if (!c) return ["razón social", "RTN", "teléfono", "correo", "condiciones"];
    return ([["razón social", c.razon_social], ["RTN", c.rtn], ["teléfono", c.telefono], ["correo", c.correo], ["condiciones por defecto", c.condiciones_defecto]] as [string, string | null][]).filter(([, v]) => !v?.trim()).map(([k]) => k);
  }, [data]);

  if (loading) return <Card title="Cotización comercial"><Loading /></Card>;
  if (!data) return <Card title="Cotización comercial"><ErrorBox msg={error} /></Card>;
  const { cfg, emp } = data;

  const docBorrador = (): CotizacionDoc => ({
    numero: null, version: sel?.version ?? 1, fecha_emision: null, fecha_vencimiento: null, moneda: "HNL",
    emisor: { razon_social: cfg?.razon_social ?? null, rtn: cfg?.rtn ?? null, telefono: cfg?.telefono ?? null, correo: cfg?.correo ?? null, direccion: cfg?.direccion ?? null, sitio_web: cfg?.sitio_web ?? null },
    cliente: { nombre: emp.nombre, rtn: emp.rtn, telefono: emp.telefono, correo: emp.correo, contacto: f.contacto.trim() || null },
    campania: { nombre: campania.nombre, objetivo: campania.objetivo, ciudades: campania.ciudades, zonas: campania.zonas, fecha_inicio: campania.fecha_inicio, fecha_fin: campania.fecha_fin },
    proyecto: f.proyecto.trim() || campania.nombre,
    conceptos: rows.map((r, i) => ({
      concepto: r.concepto, descripcion: r.descripcion.trim() || null, cantidad: Number(r.cantidad) || 0, unidad: r.unidad, precio_unitario: Number(r.precio.replace(/,/g, "")) || 0,
      descuento_porcentaje: Number(r.desc) || 0, subtotal: centavosANumero(calc.porFila[i]?.netoC ?? 0n),
    })),
    totales: { subtotal: centavosANumero(calc.t.subtotalC), descuento_total: centavosANumero(calc.t.descuentoC), impuesto_porcentaje: Number(calc.imp) / 100, impuesto_total: centavosANumero(calc.t.impuestoC), total: centavosANumero(calc.t.totalC) },
    condiciones: f.condiciones.trim() || cfg?.condiciones_defecto || null,
  });

  const setFila = (key: string, p: Partial<Fila>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const mover = (i: number, d: -1 | 1) => setRows((rs) => { const j = i + d; if (j < 0 || j >= rs.length) return rs; const c = [...rs]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const filasServicios = (ya: Fila[]) =>
    serv.filter((s) => !ya.some((r) => r.servId === s.id)).map((s) =>
      nuevaFila({ servId: s.id, concepto: `${lineaLabel[s.linea]} · ${servicioLabel(s.linea, s.servicio)}`, cantidad: num2(Math.max(0.01, Math.round(s.cantidad * 100) / 100)), unidad: unidadDesdeMedida(s.unidad_medida), precio: "" }),
    );

  /** Guarda campos y conceptos del borrador (los totales los recalcula la base de datos). */
  const persistir = async () => {
    if (!sel) return;
    if (calc.errores.length) throw new Error(calc.errores[0]);
    const payload = rows.map((r, i) => ({
      id: r.id, cotizacion_id: sel.id, campania_servicio_id: r.servId, orden: i, concepto: r.concepto.trim(), descripcion: r.descripcion.trim() || null,
      cantidad: Number(aEscala(r.cantidad, 2)) / 100, unidad: r.unidad, precio_unitario: Number(aEscala(r.precio, 2)) / 100, descuento_porcentaje: Number(aEscala(r.desc || "0", 2)) / 100,
    }));
    if (payload.length) must(await sb.from("cotizacion_conceptos").upsert(payload, { onConflict: "id" }).select("id"));
    let del = sb.from("cotizacion_conceptos").delete().eq("cotizacion_id", sel.id);
    if (payload.length) del = del.not("id", "in", `(${payload.map((p) => p.id).join(",")})`);
    must(await del.select("id"));
    must(
      await sb.from("cotizaciones").update({
        proyecto: f.proyecto.trim() || null, cliente_contacto: f.contacto.trim() || null, vigencia_dias: calc.vig, impuesto_porcentaje: Number(calc.imp) / 100, condiciones: f.condiciones.trim() || null,
      }).eq("id", sel.id).select("id").single(),
    );
  };

  const crear = (origen?: Cot) =>
    acc.run(async () => {
      if (origen) {
        const n = must(await sb.rpc("crear_revision_cotizacion", { p_id: origen.id }));
        await reload();
        setSelId(n.id);
        return;
      }
      const ins = await sb
        .from("cotizaciones")
        .insert({
          campania_id: campania.id, proyecto: campania.nombre, impuesto_porcentaje: cfg?.isv_porcentaje ?? 0,
          vigencia_dias: cfg?.vigencia_dias_defecto ?? null, condiciones: cfg?.condiciones_defecto ?? null,
        })
        .select("id")
        .single();
      if (ins.error) throw new Error(ins.error.message);
      const nuevaId: string = ins.data.id;
      const pre = filasServicios([]);
      if (pre.length) {
        must(await sb.from("cotizacion_conceptos").insert(pre.map((r, i) => ({ id: r.id, cotizacion_id: nuevaId, campania_servicio_id: r.servId, orden: i, concepto: r.concepto, cantidad: Number(r.cantidad), unidad: r.unidad, precio_unitario: 0 }))).select("id"));
      }
      await reload();
      setSelId(nuevaId);
    });

  const dl = () => {
    const d = comoDoc(sel?.snapshot);
    if (d) acc.run(() => descargarPdf(d));
  };

  return (
    <Card
      title="Cotización comercial"
      actions={
        !data.cots.some((c) => c.estado === "borrador") && data.cots.length === 0 ? (
          <Btn loading={acc.busy} icon={<FilePlus2 className="size-4" aria-hidden />} onClick={() => crear()}>Crear cotización</Btn>
        ) : undefined
      }
    >
      <div className="grid gap-5">
        <ConfigComercial cfg={cfg} faltantes={faltantes} onSaved={reload} />
        <ErrorBox msg={acc.error} />
        <OkBox msg={acc.ok} />

        {!data.cots.length ? (
          <Empty>Esta campaña aún no tiene cotización. Al crearla se precargan los servicios contratados y solo agregas los precios.</Empty>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Versiones de la cotización">
              {data.cots.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={sel?.id === c.id}
                  onClick={() => setSelId(c.id)}
                  className={`flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm ring-1 ring-inset transition-colors ${sel?.id === c.id ? "bg-white/[0.12] ring-brand-green" : "ring-white/20 hover:bg-white/[0.07]"}`}
                >
                  <span className="font-mono text-xs">{c.numero ?? "Borrador"}</span>
                  <span className="text-xs text-muted">v{c.version}</span>
                  <Estado map={estadoCotizacion} value={c.estado} />
                </button>
              ))}
            </div>

            {sel?.estado === "borrador" ? (
              <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
                <form
                  className="grid content-start gap-4"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    acc.run(async () => { await persistir(); await reload(); }, "Borrador guardado.");
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Campaña / proyecto"><Input maxLength={160} value={f.proyecto} onChange={(e) => setF({ ...f, proyecto: e.target.value })} /></Field>
                    <Field label="Contacto del cliente" hint={`Cliente: ${emp.nombre}`}><Input maxLength={160} value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} placeholder="Nombre de quien recibe la cotización" /></Field>
                    <Field label="Vigencia (días)" hint="Vacío = sin fecha de vencimiento."><Input inputMode="numeric" value={f.vigencia} onChange={(e) => setF({ ...f, vigencia: e.target.value })} placeholder="15" /></Field>
                    <Field label="ISV (%)" hint="0 = sin impuesto. Solo se aplica el que escribas aquí."><Input inputMode="decimal" value={f.impuesto} onChange={(e) => setF({ ...f, impuesto: e.target.value })} /></Field>
                  </div>

                  <fieldset className="grid gap-3">
                    <legend className="mb-1 text-sm font-semibold">Conceptos</legend>
                    {!rows.length && <Empty>Sin conceptos. Agrega uno o precarga los servicios de la campaña.</Empty>}
                    {rows.map((r, i) => (
                      <div key={r.key} className="grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-line">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                          <Field label={`Concepto ${i + 1}`}><Input maxLength={160} value={r.concepto} onChange={(e) => setFila(r.key, { concepto: e.target.value })} /></Field>
                          <div className="flex gap-1" role="group" aria-label={`Acciones del concepto ${i + 1}`}>
                            <Btn variant="ghost" aria-label={`Subir concepto ${i + 1}`} disabled={i === 0} onClick={() => mover(i, -1)} icon={<ArrowUp className="size-4" aria-hidden />} />
                            <Btn variant="ghost" aria-label={`Bajar concepto ${i + 1}`} disabled={i === rows.length - 1} onClick={() => mover(i, 1)} icon={<ArrowDown className="size-4" aria-hidden />} />
                            <Btn variant="ghost" aria-label={`Quitar concepto ${i + 1}`} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} icon={<Trash2 className="size-4" aria-hidden />} />
                          </div>
                        </div>
                        <Field label="Descripción (opcional)"><Textarea rows={2} maxLength={500} value={r.descripcion} onChange={(e) => setFila(r.key, { descripcion: e.target.value })} /></Field>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                          <Field label="Cantidad"><Input inputMode="decimal" value={r.cantidad} onChange={(e) => setFila(r.key, { cantidad: e.target.value })} /></Field>
                          <Field label="Unidad"><Select value={r.unidad} onChange={(e) => setFila(r.key, { unidad: e.target.value })} options={UNIDADES.map((u) => [u, u])} /></Field>
                          <Field label="Precio unit. (L)"><Input inputMode="decimal" value={r.precio} onChange={(e) => setFila(r.key, { precio: e.target.value })} placeholder="0.00" /></Field>
                          <Field label="Descuento (%)"><Input inputMode="decimal" value={r.desc} onChange={(e) => setFila(r.key, { desc: e.target.value })} /></Field>
                          <div className="grid content-start gap-1.5">
                            <span className="text-sm font-medium text-brand-white/90">Subtotal</span>
                            <output className="rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[0.95rem] tabular-nums ring-1 ring-inset ring-white/10">{lempiras(centavosANumero(calc.porFila[i]?.netoC ?? 0n))}</output>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <Btn variant="secondary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setRows((rs) => [...rs, nuevaFila()])}>Agregar concepto</Btn>
                      {filasServicios(rows).length > 0 && (
                        <Btn variant="ghost" onClick={() => setRows((rs) => [...rs, ...filasServicios(rs)])}>Precargar servicios de la campaña</Btn>
                      )}
                    </div>
                  </fieldset>

                  <Field label="Condiciones comerciales" hint={cfg?.condiciones_defecto ? "Vacío = se usan las condiciones por defecto." : "Vacío = la cotización sale sin condiciones."}>
                    <Textarea rows={4} maxLength={3000} value={f.condiciones} onChange={(e) => setF({ ...f, condiciones: e.target.value })} placeholder={cfg?.condiciones_defecto ?? "Forma de pago, alcance, exclusiones, observaciones…"} />
                  </Field>

                  <dl className="grid gap-1 rounded-2xl bg-brand-green/10 p-4 text-sm ring-1 ring-inset ring-brand-green/30" aria-label="Totales">
                    <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{lempiras(centavosANumero(calc.t.subtotalC))}</dd></div>
                    <div className="flex justify-between"><dt>Descuento total</dt><dd className="tabular-nums">− {lempiras(centavosANumero(calc.t.descuentoC))}</dd></div>
                    {calc.imp > 0n && <div className="flex justify-between"><dt>ISV ({Number(calc.imp) / 100}%)</dt><dd className="tabular-nums">{lempiras(centavosANumero(calc.t.impuestoC))}</dd></div>}
                    <div className="mt-1 flex justify-between text-lg font-extrabold"><dt>Total</dt><dd className="tabular-nums">{lempiras(centavosANumero(calc.t.totalC))}</dd></div>
                  </dl>

                  {calc.errores.length > 0 && <ErrorBox msg={calc.errores[0] + (calc.errores.length > 1 ? ` (y ${calc.errores.length - 1} más)` : "")} />}
                  {calc.ceros > 0 && <p className="rounded-xl bg-[#f5b544]/10 px-4 py-3 text-sm text-[#ffd48a] ring-1 ring-inset ring-[#f5b544]/30">Hay {calc.ceros} {calc.ceros === 1 ? "concepto" : "conceptos"} con precio L 0.00.</p>}

                  {confirma === "emitir" ? (
                    <div className="grid gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/20">
                      <p className="text-sm">Al emitir se asigna el número y la cotización queda <strong>congelada</strong>: para cambiarla tendrás que crear una revisión.</p>
                      <div className="flex flex-wrap gap-2">
                        <Btn loading={acc.busy} icon={<Send className="size-4" aria-hidden />} onClick={() => acc.run(async () => {
                          await persistir();
                          const e = must(await sb.rpc("emitir_cotizacion", { p_id: sel.id }));
                          setConfirma(null);
                          await reload();
                          setSelId(e.id);
                          await onChange();
                        }, "Cotización emitida.")}>Sí, emitir</Btn>
                        <Btn variant="ghost" onClick={() => setConfirma(null)}>Cancelar</Btn>
                      </div>
                    </div>
                  ) : confirma === "borrar" ? (
                    <div className="grid gap-3 rounded-2xl bg-red-500/10 p-4 ring-1 ring-inset ring-red-400/30">
                      <p className="text-sm">¿Eliminar este borrador y sus conceptos? No se puede deshacer.</p>
                      <div className="flex flex-wrap gap-2">
                        <Btn variant="danger" loading={acc.busy} icon={<Trash2 className="size-4" aria-hidden />} onClick={() => acc.run(async () => { must(await sb.from("cotizaciones").delete().eq("id", sel.id).select("id").single()); setConfirma(null); setSelId(null); await reload(); })}>Sí, eliminar borrador</Btn>
                        <Btn variant="ghost" onClick={() => setConfirma(null)}>Cancelar</Btn>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Btn type="submit" variant="secondary" loading={acc.busy} icon={<Save className="size-4" aria-hidden />}>Guardar borrador</Btn>
                      <Btn disabled={!rows.length || calc.errores.length > 0 || calc.t.totalC <= 0n} icon={<Send className="size-4" aria-hidden />} onClick={() => setConfirma("emitir")}>Emitir cotización</Btn>
                      <Btn variant="ghost" onClick={() => setConfirma("borrar")} icon={<Trash2 className="size-4" aria-hidden />}>Eliminar borrador</Btn>
                    </div>
                  )}
                </form>

                <div className="min-w-0">
                  <p className="mb-2 text-sm font-semibold">Vista previa</p>
                  <Documento doc={docBorrador()} borrador />
                </div>
              </div>
            ) : sel ? (
              <EmitidaVista
                cot={sel}
                eventos={data.eventos.filter((e) => e.cotizacion_id === sel.id)}
                link={link}
                busy={acc.busy}
                confirma={confirma}
                setConfirma={setConfirma}
                onPdf={dl}
                onCompartir={() => acc.run(async () => {
                  const t = must(await sb.rpc("compartir_cotizacion", { p_id: sel.id }));
                  setLink(`${window.location.origin}/cotizacion/${t}`);
                  await reload();
                })}
                onRevocar={() => acc.run(async () => { chk(await sb.rpc("revocar_enlace_cotizacion", { p_id: sel.id })); setLink(null); await reload(); }, "Enlace revocado.")}
                onRevision={() => crear(sel)}
                onCancelar={() => acc.run(async () => { chk(await sb.rpc("cancelar_cotizacion", { p_id: sel.id })); setConfirma(null); setLink(null); await reload(); await onChange(); }, "Cotización cancelada.")}
              />
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}

function EmitidaVista({
  cot, eventos, link, busy, confirma, setConfirma, onPdf, onCompartir, onRevocar, onRevision, onCancelar,
}: {
  cot: Cot; eventos: Row<"cotizacion_eventos">[]; link: string | null; busy: boolean; confirma: "emitir" | "cancelar" | "borrar" | null;
  setConfirma: (c: "emitir" | "cancelar" | "borrar" | null) => void; onPdf: () => void; onCompartir: () => void; onRevocar: () => void; onRevision: () => void; onCancelar: () => void;
}) {
  const doc = comoDoc(cot.snapshot);
  const activa = cot.estado === "emitida" || cot.estado === "compartida";
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="secondary" disabled={!doc} icon={<Download className="size-4" aria-hidden />} onClick={onPdf}>Descargar PDF</Btn>
        {activa && <Btn variant="secondary" loading={busy} icon={<Link2 className="size-4" aria-hidden />} onClick={onCompartir}>{cot.token_hash ? "Generar enlace nuevo" : "Generar enlace para compartir"}</Btn>}
        {activa && cot.token_hash && <Btn variant="ghost" loading={busy} icon={<Link2Off className="size-4" aria-hidden />} onClick={onRevocar}>Revocar enlace</Btn>}
        {cot.estado !== "borrador" && <Btn variant="ghost" loading={busy} icon={<FilePlus2 className="size-4" aria-hidden />} onClick={onRevision}>Crear revisión</Btn>}
        {cot.estado !== "cancelada" && confirma !== "cancelar" && <Btn variant="danger" icon={<XCircle className="size-4" aria-hidden />} onClick={() => setConfirma("cancelar")}>Cancelar cotización</Btn>}
      </div>
      {confirma === "cancelar" && (
        <div className="grid gap-3 rounded-2xl bg-red-500/10 p-4 ring-1 ring-inset ring-red-400/30">
          <p className="text-sm">Se cancela la cotización y su enlace público deja de funcionar. El historial se conserva.</p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="danger" loading={busy} onClick={onCancelar}>Sí, cancelar cotización</Btn>
            <Btn variant="ghost" onClick={() => setConfirma(null)}>Volver</Btn>
          </div>
        </div>
      )}
      {link && (
        <div className="grid gap-2 rounded-2xl bg-brand-green/10 p-4 ring-1 ring-inset ring-brand-green/30">
          <p className="text-sm font-medium">Enlace de solo lectura (cópialo ahora: no se puede volver a mostrar; si lo pierdes, genera uno nuevo y el anterior dejará de funcionar).</p>
          <div className="flex flex-wrap gap-2">
            <Input readOnly value={link} aria-label="Enlace público de la cotización" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1" />
            <Btn variant="secondary" icon={<Copy className="size-4" aria-hidden />} onClick={() => navigator.clipboard?.writeText(link)}>Copiar</Btn>
          </div>
        </div>
      )}
      {!link && cot.token_hash && <p className="text-sm text-muted">Hay un enlace público activo. Por seguridad no se puede volver a mostrar; genera uno nuevo si lo necesitas (el anterior dejará de funcionar).</p>}
      {cot.estado === "vencida" && <p className="text-sm text-[#ffd48a]">Esta cotización venció el {fecha(cot.fecha_vencimiento)}.</p>}
      {doc ? <Documento doc={doc} /> : <ErrorBox msg="No se pudo leer la copia de esta cotización." />}
      {eventos.length > 0 && (
        <details className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-line">
          <summary className="cursor-pointer text-sm font-semibold">Historial</summary>
          <ul className="mt-3 grid gap-1.5 text-sm text-muted">
            {eventos.map((e) => <li key={e.id}><span className="tabular-nums">{fechaHora(e.creado_en)}</span> · {eventoTxt(e)}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function ConfigComercial({ cfg, faltantes, onSaved }: { cfg: Cfg | null; faltantes: string[]; onSaved: () => Promise<void> }) {
  const [v, setV] = useState({ razon_social: "", rtn: "", telefono: "", correo: "", direccion: "", sitio_web: "", condiciones_defecto: "", vigencia: "", isv: "" });
  const acc = useAction();
  useEffect(() => {
    setV({
      razon_social: cfg?.razon_social ?? "", rtn: cfg?.rtn ?? "", telefono: cfg?.telefono ?? "", correo: cfg?.correo ?? "", direccion: cfg?.direccion ?? "", sitio_web: cfg?.sitio_web ?? "",
      condiciones_defecto: cfg?.condiciones_defecto ?? "", vigencia: cfg?.vigencia_dias_defecto ? String(cfg.vigencia_dias_defecto) : "", isv: cfg?.isv_porcentaje != null ? String(cfg.isv_porcentaje) : "",
    });
  }, [cfg]);
  const t = (s: string) => s.trim() || null;
  return (
    <details className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-line">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm font-semibold">
        <Settings2 className="size-4" aria-hidden /> Datos comerciales de Publicalle
        {faltantes.length > 0 && <span className="text-xs font-normal text-[#ffd48a]">Pendiente: {faltantes.join(", ")}</span>}
      </summary>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          acc.run(async () => {
            const vig = v.vigencia.trim() ? Number(v.vigencia) : null;
            if (vig !== null && (!Number.isInteger(vig) || vig < 1)) throw new Error("La vigencia por defecto debe ser un número entero de días.");
            const isv = v.isv.trim() ? aEscala(v.isv, 2) : null;
            if (v.isv.trim() && (isv === null || isv > 10000n)) throw new Error("El ISV por defecto debe estar entre 0 y 100.");
            must(await sb.from("config_comercial").update({
              razon_social: t(v.razon_social), rtn: t(v.rtn), telefono: t(v.telefono), correo: t(v.correo), direccion: t(v.direccion), sitio_web: t(v.sitio_web),
              condiciones_defecto: t(v.condiciones_defecto), vigencia_dias_defecto: vig, isv_porcentaje: isv === null ? null : Number(isv) / 100, actualizado_en: new Date().toISOString(),
            }).eq("id", true).select("id").single());
            await onSaved();
          }, "Datos comerciales guardados. Se aplican a las cotizaciones que emitas desde ahora; las ya emitidas no cambian.");
        }}
      >
        <Field label="Razón social"><Input maxLength={160} value={v.razon_social} onChange={(e) => setV({ ...v, razon_social: e.target.value })} /></Field>
        <Field label="RTN"><Input maxLength={40} value={v.rtn} onChange={(e) => setV({ ...v, rtn: e.target.value })} /></Field>
        <Field label="Teléfono"><Input maxLength={40} value={v.telefono} onChange={(e) => setV({ ...v, telefono: e.target.value })} /></Field>
        <Field label="Correo"><Input type="email" maxLength={120} value={v.correo} onChange={(e) => setV({ ...v, correo: e.target.value })} /></Field>
        <Field label="Dirección"><Input maxLength={200} value={v.direccion} onChange={(e) => setV({ ...v, direccion: e.target.value })} /></Field>
        <Field label="Sitio web"><Input maxLength={120} value={v.sitio_web} onChange={(e) => setV({ ...v, sitio_web: e.target.value })} /></Field>
        <Field label="Vigencia por defecto (días)"><Input inputMode="numeric" value={v.vigencia} onChange={(e) => setV({ ...v, vigencia: e.target.value })} /></Field>
        <Field label="ISV por defecto (%)" hint="Vacío = las cotizaciones nuevas salen sin impuesto."><Input inputMode="decimal" value={v.isv} onChange={(e) => setV({ ...v, isv: e.target.value })} /></Field>
        <Field label="Condiciones comerciales por defecto" className="sm:col-span-2"><Textarea rows={4} maxLength={3000} value={v.condiciones_defecto} onChange={(e) => setV({ ...v, condiciones_defecto: e.target.value })} /></Field>
        <div className="grid gap-3 sm:col-span-2">
          <ErrorBox msg={acc.error} />
          <OkBox msg={acc.ok} />
          <div><Btn type="submit" loading={acc.busy} icon={<Save className="size-4" aria-hidden />}>Guardar datos comerciales</Btn></div>
        </div>
      </form>
    </details>
  );
}
