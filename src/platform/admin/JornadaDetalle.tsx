import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Check, ShieldCheck, Save, Upload, X } from "lucide-react";
import { useAuth } from "../auth";
import { sb } from "../supabase";
import { estadoEjecucion, estadoEvidencia, fecha, fechaHora, hora, momentoLabel, servicioLabel } from "../labels";
import type { Database, Enum } from "../database.types";
import { kmRecorrido } from "../operador/geo";
import { Mapa, tramos } from "../MapaLazy";
import { Badge, Btn, Card, Chips, Dl, Empty, ErrorBox, Estado, Field, Input, Loading, OkBox, Page, Select, Textarea, must, useAction, useAsync } from "../ui";

const MIMES = ["image/jpeg", "image/webp", "image/heic", "video/mp4"];
const EDITABLES: Enum<"estado_ejecucion">[] = ["programada", "en_curso", "pausada", "finalizada", "incompleta"];

async function sha256(file: File) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function JornadaDetalle() {
  const { id = "" } = useParams();
  const { perfil } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const [j, ev, t, gps, incid, unidades, operadores, enZona, cob, punto] = await Promise.all([
      sb
        .from("ejecuciones")
        .select("*, campanias(id, nombre, zonas, empresas(nombre)), unidades(nombre), operador:perfiles!ejecuciones_operador_id_fkey(nombre), validador:perfiles!ejecuciones_validada_por_fkey(nombre)")
        .eq("id", id)
        .single(),
      sb.from("evidencias").select("*").eq("ejecucion_id", id).order("registrado_en"),
      sb.from("v_tiempos_ejecucion").select("*").eq("ejecucion_id", id).maybeSingle(),
      sb.from("gps_puntos").select("lat, lng, capturado_en").eq("ejecucion_id", id).order("capturado_en").limit(20000),
      sb.from("incidencias").select("id, tipo, descripcion, registrado_en").eq("ejecucion_id", id).order("registrado_en"),
      sb.from("unidades").select("id, nombre").eq("activa", true).order("nombre"),
      sb.from("perfiles").select("id, nombre").eq("rol", "operador").eq("activo", true).order("nombre"),
      sb.rpc("recorrido_en_zonas", { p_ejecucion: id }),
      sb.rpc("cobertura_jornada", { p_ejecucion: id }),
      sb.rpc("punto_jornada", { p_ejecucion: id }),
    ]);
    const evid = must(ev);
    const urls = evid.length ? must(await sb.storage.from("evidencias").createSignedUrls(evid.map((e) => e.storage_path), 3600)) : [];
    const puntos = must(gps);
    const jj = must(j);
    const nombresZonas = [...new Set([...jj.zonas, ...(jj.campanias?.zonas ?? [])])];
    const zonasMapa = nombresZonas.length ? must(await sb.from("zonas").select("nombre, contorno").in("nombre", nombresZonas)) : [];
    const mapa = { zonas: zonasMapa, todo: tramos(puntos), enZona: tramos(must(enZona)), punto: must(punto)[0] ?? null, cobertura: must(cob) };
    return { mapa, j: jj, ev: evid.map((e, i) => ({ ...e, url: urls[i]?.signedUrl ?? null })), t: t.data, gps: { n: puntos.length, km: kmRecorrido(puntos) }, incid: must(incid), unidades: must(unidades), operadores: must(operadores) };
  }, [id]);

  const [p, setP] = useState({ fecha: "", hi: "", hf: "", unidad: "", operador: "", punto: "" });
  const [val, setVal] = useState({ zonas: [] as string[], km: "", motivo: "" });
  const [momento, setMomento] = useState("actividad");
  const prog = useAction();
  const est = useAction();
  const sube = useAction();
  const evAcc = useAction();

  useEffect(() => {
    if (!data) return;
    const j = data.j;
    setP({ fecha: j.fecha, hi: hora(j.hora_inicio_prog), hf: hora(j.hora_fin_prog), unidad: j.unidad_id ?? "", operador: j.operador_id ?? "", punto: j.punto_nombre ?? "" });
    setVal({ zonas: j.zonas_cubiertas.length ? j.zonas_cubiertas : j.zonas, km: j.km_en_zonas?.toString() ?? "", motivo: j.motivo_rechazo ?? "" });
    setMomento(j.linea === "move" ? "recorrido" : j.linea === "place" ? "instalacion" : "montaje");
  }, [data]);

  if (loading) return <Page title="Jornada" back="/admin/jornadas"><Loading /></Page>;
  if (!data) return <Page title="Jornada" back="/admin/jornadas"><ErrorBox msg={error} /></Page>;
  const { j } = data;
  const cerrada = j.estado === "validada";
  const zonasOpts = [...new Set([...j.zonas, ...(j.campanias?.zonas ?? [])])];
  const evValidadas = data.ev.filter((e) => e.estado === "validada").length;

  const update = (fields: Database["public"]["Tables"]["ejecuciones"]["Update"]) =>
    sb.from("ejecuciones").update(fields).eq("id", id).select("id").single().then(must);

  return (
    <Page
      title={`${servicioLabel(j.linea, j.servicio)} · ${fecha(j.fecha)}`}
      back={j.campanias ? `/admin/campanias/${j.campanias.id}` : "/admin/jornadas"}
      subtitle={
        <>
          <Link to={`/admin/campanias/${j.campanias?.id}`} className="underline-offset-4 hover:underline">{j.campanias?.nombre}</Link> · {j.campanias?.empresas?.nombre} · <Estado map={estadoEjecucion} value={j.estado} />
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Programación">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              prog.run(async () => {
                if (p.hi && p.hf && p.hf <= p.hi) throw new Error("La hora final debe ser posterior a la de inicio.");
                await update({ fecha: p.fecha, hora_inicio_prog: p.hi || null, hora_fin_prog: p.hf || null, unidad_id: p.unidad || null, operador_id: p.operador || null, punto_nombre: j.linea !== "move" ? p.punto.trim() || null : j.punto_nombre });
                await reload();
              }, "Programación guardada.");
            }}
          >
            <Field label="Fecha" className="sm:col-span-2"><Input type="date" required disabled={cerrada} value={p.fecha} onChange={(e) => setP({ ...p, fecha: e.target.value })} /></Field>
            <Field label="Desde"><Input type="time" step={900} disabled={cerrada} value={p.hi} onChange={(e) => setP({ ...p, hi: e.target.value })} /></Field>
            <Field label="Hasta"><Input type="time" step={900} disabled={cerrada} value={p.hf} onChange={(e) => setP({ ...p, hf: e.target.value })} /></Field>
            <Field label="Unidad"><Select disabled={cerrada} value={p.unidad} onChange={(e) => setP({ ...p, unidad: e.target.value })} placeholder="Sin unidad" options={data.unidades.map((u) => [u.id, u.nombre])} /></Field>
            <Field label="Operador"><Select disabled={cerrada} value={p.operador} onChange={(e) => setP({ ...p, operador: e.target.value })} placeholder="Sin operador" options={data.operadores.map((o) => [o.id, o.nombre])} /></Field>
            {j.linea === "move" ? (
              <div className="sm:col-span-2"><Dl items={[["Zonas a recorrer", j.zonas.join(", ") || "—"]]} /></div>
            ) : (
              <Field label="Lugar / punto" className="sm:col-span-2"><Input disabled={cerrada} maxLength={160} value={p.punto} onChange={(e) => setP({ ...p, punto: e.target.value })} /></Field>
            )}
            {!cerrada && (
              <div className="grid gap-3 sm:col-span-2">
                <ErrorBox msg={prog.error} />
                <OkBox msg={prog.ok} />
                <div><Btn type="submit" variant="secondary" loading={prog.busy} icon={<Save className="size-4" aria-hidden />}>Guardar programación</Btn></div>
              </div>
            )}
          </form>
        </Card>

        <Card title="Validación" actions={<Badge tone="gray">Lo validado lo ve el cliente</Badge>}>
          {cerrada ? (
            <div className="grid gap-4">
              <Dl
                items={[
                  ["Zonas cubiertas", j.zonas_cubiertas.join(", ") || "—"],
                  ["Km dentro de las zonas", j.km_en_zonas != null ? `${j.km_en_zonas} km` : ""],
                  ["Validada por", j.validador?.nombre],
                  ["Validada el", fechaHora(j.validada_en)],
                ]}
              />
              <ErrorBox msg={est.error} />
              <div>
                <Btn variant="secondary" loading={est.busy} onClick={() => est.run(async () => { await update({ estado: "finalizada", validada_por: null, validada_en: null }); await reload(); })}>
                  Quitar validación
                </Btn>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <Field label="Estado de la jornada" hint="Mientras no exista la app del operador, el estado se marca aquí.">
                <Select
                  value={j.estado}
                  onChange={(e) => est.run(async () => { await update({ estado: e.target.value as Enum<"estado_ejecucion"> }); await reload(); })}
                  options={(j.estado === "rechazada" ? [...EDITABLES, "rechazada" as const] : EDITABLES).map((k) => [k, estadoEjecucion[k][0]])}
                />
              </Field>
              {j.linea === "move" && (
                <>
                  <div className="grid gap-1.5">
                    <span className="text-sm font-medium text-brand-white/90">Zonas cubiertas</span>
                    {zonasOpts.length ? <Chips label="Zonas cubiertas" options={zonasOpts} value={val.zonas} onChange={(z) => setVal({ ...val, zonas: z })} /> : <span className="text-xs text-muted">La campaña no tiene zonas contratadas.</span>}
                  </div>
                  <Field label="Km dentro de las zonas"><Input type="number" min={0} step="0.1" inputMode="decimal" value={val.km} onChange={(e) => setVal({ ...val, km: e.target.value })} /></Field>
                  {data.mapa.cobertura.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm ring-1 ring-inset ring-line">
                      <span className="text-muted">
                        Calculado con GPS: {data.mapa.cobertura.map((c) => `${c.zona} ${Number(c.km).toFixed(2)} km`).join(" · ")}
                      </span>
                      <Btn variant="secondary" className="min-h-8 px-3 text-xs"
                        onClick={() => setVal({ ...val, zonas: data.mapa.cobertura.map((c) => c.zona), km: data.mapa.cobertura.reduce((a, c) => a + Number(c.km), 0).toFixed(2) })}>
                        Usar cálculo
                      </Btn>
                    </div>
                  )}
                </>
              )}
              <Field label="Motivo (solo si se rechaza)"><Textarea rows={2} maxLength={500} value={val.motivo} onChange={(e) => setVal({ ...val, motivo: e.target.value })} /></Field>
              <p className="text-xs text-muted">Evidencias validadas: {evValidadas} de {data.ev.length}. El cliente solo ve las evidencias validadas de jornadas validadas.</p>
              <ErrorBox msg={est.error} />
              <div className="flex flex-wrap gap-2">
                <Btn
                  icon={<ShieldCheck className="size-4" aria-hidden />}
                  loading={est.busy}
                  onClick={() =>
                    est.run(async () => {
                      await update({
                        estado: "validada", zonas_cubiertas: j.linea === "move" ? val.zonas : [], km_en_zonas: j.linea === "move" && val.km ? Number(val.km) : null,
                        validada_por: perfil?.id ?? null, validada_en: new Date().toISOString(), motivo_rechazo: null,
                      });
                      await reload();
                    })
                  }
                >
                  Validar jornada
                </Btn>
                <Btn
                  variant="danger"
                  loading={est.busy}
                  onClick={() =>
                    est.run(async () => {
                      if (val.motivo.trim().length < 3) throw new Error("Escribe el motivo del rechazo.");
                      await update({ estado: "rechazada", motivo_rechazo: val.motivo.trim() });
                      await reload();
                    })
                  }
                >
                  Rechazar
                </Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {(data.mapa.zonas.length > 0 || data.mapa.todo.length > 0 || data.mapa.punto) && (
        <Card title="Mapa" actions={<span className="text-xs text-muted">Verde: dentro de zonas (lo ve el cliente) · Gris: fuera de zonas (solo interno)</span>}>
          <Mapa
            alto={380}
            etiqueta="Recorrido de la jornada"
            zonas={data.mapa.zonas}
            rutasSecundarias={data.mapa.todo}
            rutas={data.mapa.enZona}
            puntos={data.mapa.punto ? [{ lat: data.mapa.punto.lat, lng: data.mapa.punto.lng, label: "Punto registrado" }] : []}
          />
        </Card>
      )}

      <Card title="Registro del operador (interno)" actions={<Badge tone="amber">No visible para el cliente</Badge>}>
        {data.t?.inicio || data.gps.n ? (
          <Dl
            items={[
              ["Inicio", fechaHora(data.t?.inicio)],
              ["Fin", fechaHora(data.t?.fin)],
              ["Tiempo efectivo", data.t?.tiempo_efectivo],
              ["Tiempo en pausa", data.t?.tiempo_pausado],
              ["Recorrido GPS (total)", data.gps.n ? `${data.gps.km.toFixed(1)} km · ${data.gps.n} puntos` : ""],
            ]}
          />
        ) : (
          <p className="text-sm text-muted">Sin registros del operador todavía.</p>
        )}
        {j.linea === "move" && data.gps.n > 0 && <p className="mt-3 text-xs text-muted">Referencia para «Km dentro de las zonas»: el total incluye traslados fuera de las zonas.</p>}
        {data.incid.length > 0 && (
          <div className="mt-4 grid gap-2">
            <p className="text-sm font-semibold text-[#ffd48a]">Problemas reportados ({data.incid.length})</p>
            <ul className="grid gap-2">
              {data.incid.map((x) => (
                <li key={x.id} className="rounded-xl bg-[#f5b544]/10 px-3 py-2 text-sm ring-1 ring-inset ring-[#f5b544]/25">
                  <span className="font-semibold">{x.tipo}</span> · <span className="text-muted">{fechaHora(x.registrado_en)}</span>
                  <p className="mt-0.5">{x.descripcion}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title={`Evidencias (${data.ev.length})`}>
        {!data.ev.length ? (
          <Empty>Sin evidencias. Súbelas aquí (por ejemplo, las fotos que envía el operador por WhatsApp).</Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.ev.map((e) => (
              <li key={e.id} className="overflow-hidden rounded-xl bg-white/[0.03] ring-1 ring-inset ring-line">
                {e.url ? (
                  e.tipo === "video" ? (
                    <video src={e.url} controls preload="metadata" className="aspect-[4/3] w-full bg-black object-cover" />
                  ) : (
                    <a href={e.url} target="_blank" rel="noreferrer">
                      <img src={e.url} alt={`Evidencia: ${momentoLabel[e.momento ?? "otro"] ?? "otro"}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    </a>
                  )
                ) : (
                  <div className="grid aspect-[4/3] place-items-center text-xs text-muted">Archivo no disponible</div>
                )}
                <div className="grid gap-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{momentoLabel[e.momento ?? "otro"] ?? e.momento}</span>
                    <Estado map={estadoEvidencia} value={e.estado} />
                  </div>
                  <p className="text-xs text-muted">Recibida {fechaHora(e.registrado_en)}</p>
                  <div className="flex gap-2">
                    {e.estado !== "validada" && (
                      <Btn variant="secondary" className="min-h-8 px-3 text-xs" icon={<Check className="size-3.5" aria-hidden />} loading={evAcc.busy}
                        onClick={() => evAcc.run(async () => { must(await sb.from("evidencias").update({ estado: "validada" }).eq("id", e.id).select("id").single()); await reload(); })}>
                        Validar
                      </Btn>
                    )}
                    {e.estado !== "rechazada" && (
                      <Btn variant="ghost" className="min-h-8 px-3 text-xs" icon={<X className="size-3.5" aria-hidden />} loading={evAcc.busy}
                        onClick={() => evAcc.run(async () => { must(await sb.from("evidencias").update({ estado: "rechazada" }).eq("id", e.id).select("id").single()); await reload(); })}>
                        Rechazar
                      </Btn>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <ErrorBox msg={evAcc.error} />

        <div className="mt-5 grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-line sm:grid-cols-[1fr_2fr] sm:items-end">
          <Field label="Momento">
            <Select value={momento} onChange={(e) => setMomento(e.target.value)} options={Object.entries(momentoLabel)} />
          </Field>
          <Field label="Subir fotos o videos" hint="JPG, WEBP, HEIC o MP4 · máx. 25 MB por archivo.">
            <input
              type="file"
              multiple
              accept={MIMES.join(",")}
              disabled={sube.busy}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-blue-dark hover:file:bg-brand-green-light"
              onChange={(ev) => {
                const files = [...(ev.target.files ?? [])];
                ev.target.value = "";
                if (!files.length) return;
                sube.run(async () => {
                  for (const file of files) {
                    if (!MIMES.includes(file.type)) throw new Error(`«${file.name}» no es un formato permitido.`);
                    if (file.size > 25 * 1024 * 1024) throw new Error(`«${file.name}» pesa más de 25 MB.`);
                    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                    const path = `${id}/${crypto.randomUUID()}.${ext}`;
                    const hash = await sha256(file);
                    const up = await sb.storage.from("evidencias").upload(path, file, { contentType: file.type, upsert: false });
                    if (up.error) throw up.error;
                    must(
                      await sb
                        .from("evidencias")
                        .insert({ ejecucion_id: id, storage_path: path, sha256: hash, tipo: file.type.startsWith("video") ? "video" : "foto", momento, capturado_en: new Date(file.lastModified).toISOString() })
                        .select("id")
                        .single(),
                    );
                  }
                  await reload();
                }, files.length > 1 ? `${files.length} archivos subidos.` : "Archivo subido.");
              }}
            />
          </Field>
          {sube.busy && <p className="flex items-center gap-2 text-sm text-muted sm:col-span-2"><Upload className="size-4" aria-hidden /> Subiendo…</p>}
          <div className="sm:col-span-2"><ErrorBox msg={sube.error} /><OkBox msg={sube.ok} /></div>
        </div>
      </Card>
    </Page>
  );
}
