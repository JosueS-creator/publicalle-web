import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../auth";
import { sb } from "../supabase";
import { estadoEjecucion, fecha, hora, hoyISO, lineaLabel, servicioLabel } from "../labels";
import { Empty, ErrorBox, Estado, Loading, Page, must, useAsync } from "../ui";

type J = { id: string; fecha: string; hora_inicio_prog: string | null; hora_fin_prog: string | null; linea: "move" | "events" | "place"; servicio: string; estado: keyof typeof estadoEjecucion; zonas: string[]; punto_nombre: string | null; campanias: { nombre: string; empresas: { nombre: string } | null } | null };

export default function OperadorInicio() {
  const { perfil } = useAuth();
  const { data, error, loading } = useAsync(async () => {
    const desde = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    // RLS: solo jornadas asignadas a este operador
    return must(
      await sb
        .from("ejecuciones")
        .select("id, fecha, hora_inicio_prog, hora_fin_prog, linea, servicio, estado, zonas, punto_nombre, campanias(nombre, empresas(nombre))")
        .eq("operador_id", perfil?.id ?? "")
        .gte("fecha", desde)
        .order("fecha")
        .order("hora_inicio_prog"),
    ) as unknown as J[];
  }, [perfil?.id]);

  const hoy = hoyISO();
  const activas = (data ?? []).filter((j) => j.estado === "en_curso" || j.estado === "pausada");
  const deHoy = (data ?? []).filter((j) => j.fecha === hoy && j.estado === "programada");
  const proximas = (data ?? []).filter((j) => j.fecha > hoy && j.estado === "programada");
  const pasadas = (data ?? []).filter((j) => !activas.includes(j) && !deHoy.includes(j) && !proximas.includes(j)).reverse();

  return (
    <Page title="Mis jornadas" subtitle={perfil?.nombre}>
      <ErrorBox msg={error} />
      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>No tienes jornadas asignadas. Cuando el equipo te programe una, aparecerá aquí.</Empty>
      ) : (
        <>
          <Grupo titulo="En curso" items={activas} destacado />
          <Grupo titulo="Hoy" items={deHoy} destacado vacio="No tienes más jornadas para hoy." />
          <Grupo titulo="Próximas" items={proximas} />
          <Grupo titulo="Recientes" items={pasadas.slice(0, 10)} />
        </>
      )}
    </Page>
  );
}

function Grupo({ titulo, items, destacado, vacio }: { titulo: string; items: J[]; destacado?: boolean; vacio?: string }) {
  if (!items.length && !vacio) return null;
  return (
    <section className="grid gap-3">
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{titulo}</h2>
      {!items.length ? (
        <p className="text-sm text-muted">{vacio}</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((j) => (
            <li key={j.id}>
              <Link
                to={`/operador/jornadas/${j.id}`}
                className={`flex items-center gap-4 rounded-2xl p-4 ring-1 ring-inset transition-colors ${destacado ? "bg-surface ring-brand-green/40 hover:ring-brand-green" : "bg-surface ring-line hover:ring-white/30"}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-brand-green-light">{lineaLabel[j.linea]}</span>
                    <Estado map={estadoEjecucion} value={j.estado} />
                  </div>
                  <p className="mt-1 text-lg font-bold leading-tight">{servicioLabel(j.linea, j.servicio)}</p>
                  <p className="text-sm text-brand-white/85">{j.campanias?.nombre}{j.campanias?.empresas?.nombre ? ` · ${j.campanias.empresas.nombre}` : ""}</p>
                  <p className="mt-1 text-sm text-muted">
                    {fecha(j.fecha)}
                    {j.hora_inicio_prog ? ` · ${hora(j.hora_inicio_prog)}–${hora(j.hora_fin_prog)}` : ""}
                    {j.linea === "move" ? (j.zonas.length ? ` · ${j.zonas.join(", ")}` : "") : j.punto_nombre ? ` · ${j.punto_nombre}` : ""}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
