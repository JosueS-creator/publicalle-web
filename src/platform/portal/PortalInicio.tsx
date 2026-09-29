import { Link } from "react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useAuth } from "../auth";
import { sb } from "../supabase";
import { estadoCampania, estadoSolicitud, fecha, fechaHora } from "../labels";
import { BtnLink, Card, Empty, ErrorBox, Estado, Loading, Page, must, useAsync } from "../ui";

export default function PortalInicio() {
  const { perfil } = useAuth();
  const { data, error, loading } = useAsync(async () => {
    const [emp, camps, misSol] = await Promise.all([
      sb.from("empresas").select("nombre").eq("id", perfil?.empresa_id ?? "").maybeSingle(),
      // RLS: solo campañas de mi empresa; ejecuciones(count) cuenta solo las validadas
      sb.from("campanias").select("id, nombre, estado, ciudades, fecha_inicio, fecha_fin, ejecuciones(count)").neq("estado", "cancelada").order("creado_en", { ascending: false }),
      sb.rpc("mis_solicitudes"),
    ]);
    // solicitudes pendientes (las convertidas ya aparecen como campaña)
    const sols = (must(misSol) ?? []).filter((x) => x.estado === "nueva" || x.estado === "en_revision");
    return { empresa: emp.data?.nombre ?? "", camps: must(camps), sols };
  }, [perfil?.empresa_id]);

  return (
    <Page title="Mis campañas" subtitle={data?.empresa} actions={<BtnLink to="/portal/nueva" variant="primary" icon={<Plus className="size-4" aria-hidden />}>Nueva campaña</BtnLink>}>
      <ErrorBox msg={error} />
      {!!data?.sols.length && (
        <Card title="Solicitudes en revisión">
          <ul className="divide-y divide-line">
            {data.sols.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{x.objetivo}</p>
                  <p className="text-xs text-muted">Solicitud <span className="font-mono">{x.folio}</span> · {x.ciudades.join(", ")} · {fechaHora(x.creado_en)}</p>
                </div>
                <Estado map={estadoSolicitud} value={x.estado} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      {loading ? (
        <Loading />
      ) : !data?.camps.length ? (
        <Empty>Aún no tienes campañas activas. Pide una con «Nueva campaña» o, cuando el equipo de Publicalle programe tu campaña, aparecerá aquí.</Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.camps.map((c) => (
            <li key={c.id}>
              <Link to={`/portal/campanias/${c.id}`} className="group grid h-full gap-4 rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line transition-colors hover:ring-brand-green/50">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight">{c.nombre}</h2>
                  <Estado map={estadoCampania} value={c.estado} />
                </div>
                <p className="text-sm text-muted">
                  {c.ciudades.join(", ")}
                  {c.fecha_inicio && ` · ${fecha(c.fecha_inicio)} → ${fecha(c.fecha_fin)}`}
                </p>
                <div className="flex items-end justify-between">
                  <p>
                    <span className="text-2xl font-extrabold">{c.ejecuciones[0]?.count ?? 0}</span>{" "}
                    <span className="text-sm text-muted">{(c.ejecuciones[0]?.count ?? 0) === 1 ? "jornada completada" : "jornadas completadas"}</span>
                  </p>
                  <ArrowRight className="size-5 text-brand-green transition-transform group-hover:translate-x-1" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
