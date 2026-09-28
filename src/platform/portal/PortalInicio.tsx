import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../auth";
import { sb } from "../supabase";
import { estadoCampania, fecha } from "../labels";
import { Empty, ErrorBox, Estado, Loading, Page, must, useAsync } from "../ui";

export default function PortalInicio() {
  const { perfil } = useAuth();
  const { data, error, loading } = useAsync(async () => {
    const [emp, camps] = await Promise.all([
      sb.from("empresas").select("nombre").eq("id", perfil?.empresa_id ?? "").maybeSingle(),
      // RLS: solo campañas de mi empresa; ejecuciones(count) cuenta solo las validadas
      sb.from("campanias").select("id, nombre, estado, ciudades, fecha_inicio, fecha_fin, ejecuciones(count)").neq("estado", "cancelada").order("creado_en", { ascending: false }),
    ]);
    return { empresa: emp.data?.nombre ?? "", camps: must(camps) };
  }, [perfil?.empresa_id]);

  return (
    <Page title="Mis campañas" subtitle={data?.empresa}>
      <ErrorBox msg={error} />
      {loading ? (
        <Loading />
      ) : !data?.camps.length ? (
        <Empty>Aún no tienes campañas activas. Cuando el equipo de Publicalle programe tu campaña, aparecerá aquí.</Empty>
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
