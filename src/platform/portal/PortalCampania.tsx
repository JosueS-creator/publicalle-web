import { useParams } from "react-router";
import { sb } from "../supabase";
import { estadoCampania, fecha, lineaLabel, momentoLabel, servicioLabel } from "../labels";
import { Card, Empty, ErrorBox, Estado, Loading, Page, Stat, Table, Td, must, useAsync } from "../ui";

/** Detalle para el cliente: solo jornadas y evidencias VALIDADAS (lo garantiza RLS). Sin horas internas. */
export default function PortalCampania() {
  const { id = "" } = useParams();
  const { data, error, loading } = useAsync(async () => {
    const [c, serv, jor] = await Promise.all([
      sb.from("campanias").select("id, nombre, estado, objetivo, ciudades, zonas, fecha_inicio, fecha_fin").eq("id", id).single(),
      sb.from("campania_servicios").select("id, linea, servicio").eq("campania_id", id),
      sb.from("ejecuciones").select("id, fecha, linea, servicio, zonas_cubiertas, km_en_zonas, punto_nombre").eq("campania_id", id).order("fecha", { ascending: false }),
    ]);
    const jornadas = must(jor);
    const ev = jornadas.length
      ? must(await sb.from("evidencias").select("id, ejecucion_id, storage_path, tipo, momento").in("ejecucion_id", jornadas.map((j) => j.id)).order("registrado_en"))
      : [];
    const urls = ev.length ? must(await sb.storage.from("evidencias").createSignedUrls(ev.map((e) => e.storage_path), 3600)) : [];
    return { c: must(c), serv: must(serv), jor: jornadas, ev: ev.map((e, i) => ({ ...e, url: urls[i]?.signedUrl ?? null })) };
  }, [id]);

  if (loading) return <Page title="Campaña" back="/portal"><Loading /></Page>;
  if (!data) return <Page title="Campaña" back="/portal"><ErrorBox msg={error} /></Page>;
  const { c, jor, ev } = data;

  const cubiertas = new Set(jor.flatMap((j) => j.zonas_cubiertas));
  const km = jor.reduce((s, j) => s + (Number(j.km_en_zonas) || 0), 0);
  const hayMove = jor.some((j) => j.linea === "move") || data.serv.some((s) => s.linea === "move");
  const evPorJornada = (jid: string) => ev.filter((e) => e.ejecucion_id === jid);

  return (
    <Page
      title={c.nombre}
      back="/portal"
      subtitle={
        <>
          {c.ciudades.join(", ")}
          {c.fecha_inicio && ` · ${fecha(c.fecha_inicio)} → ${fecha(c.fecha_fin)}`} · <Estado map={estadoCampania} value={c.estado} />
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Jornadas completadas" value={jor.length} />
        <Stat label="Evidencias" value={ev.length} hint="Fotos y videos verificados" />
        {hayMove && <Stat label="Zonas cubiertas" value={c.zonas.length ? `${[...cubiertas].filter((z) => c.zonas.includes(z)).length} de ${c.zonas.length}` : cubiertas.size} />}
        {hayMove && <Stat label="Km en zonas" value={`${km.toLocaleString("es-HN", { maximumFractionDigits: 1 })} km`} hint="Recorrido dentro de las zonas contratadas" />}
      </div>

      {data.serv.length > 0 && (
        <Card title="Servicios">
          <ul className="flex flex-wrap gap-2">
            {data.serv.map((s) => (
              <li key={s.id} className="rounded-full bg-white/[0.06] px-3 py-1 text-sm ring-1 ring-inset ring-white/15">
                <span className="font-mono text-xs text-brand-green-light">{lineaLabel[s.linea]}</span> {servicioLabel(s.linea, s.servicio)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Jornadas completadas">
        {!jor.length ? (
          <Empty>Todavía no hay jornadas verificadas. Aparecerán aquí cuando el equipo de Publicalle las valide.</Empty>
        ) : (
          <Table head={["Fecha", "Servicio", "Cobertura", "Evidencias"]}>
            {jor.map((j) => (
              <tr key={j.id}>
                <Td className="whitespace-nowrap">{fecha(j.fecha)}</Td>
                <Td>{servicioLabel(j.linea, j.servicio)}</Td>
                <Td className="text-muted">
                  {j.linea === "move"
                    ? [j.zonas_cubiertas.join(", "), j.km_en_zonas != null ? `${j.km_en_zonas} km en zonas` : ""].filter(Boolean).join(" · ") || "—"
                    : j.punto_nombre || "—"}
                </Td>
                <Td>{evPorJornada(j.id).length}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Evidencias">
        {!ev.length ? (
          <Empty>Sin evidencias verificadas todavía.</Empty>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ev.map((e) => {
              const j = jor.find((x) => x.id === e.ejecucion_id);
              const alt = `${momentoLabel[e.momento ?? "otro"] ?? "Evidencia"} · ${j ? `${servicioLabel(j.linea, j.servicio)}, ${fecha(j.fecha)}` : ""}`;
              return (
                <li key={e.id} className="overflow-hidden rounded-xl bg-white/[0.03] ring-1 ring-inset ring-line">
                  {e.url ? (
                    e.tipo === "video" ? (
                      <video src={e.url} controls preload="metadata" className="aspect-square w-full bg-black object-cover" aria-label={alt} />
                    ) : (
                      <a href={e.url} target="_blank" rel="noreferrer">
                        <img src={e.url} alt={alt} loading="lazy" className="aspect-square w-full object-cover" />
                      </a>
                    )
                  ) : (
                    <div className="grid aspect-square place-items-center text-xs text-muted">No disponible</div>
                  )}
                  <p className="px-3 py-2 text-xs text-muted">{alt}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Page>
  );
}
