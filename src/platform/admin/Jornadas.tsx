import { useState } from "react";
import { Link } from "react-router";
import { sb } from "../supabase";
import { estadoEjecucion, fecha, hora, hoyISO, servicioLabel } from "../labels";
import type { Enum } from "../database.types";
import { Card, Empty, ErrorBox, Estado, Loading, Page, Select, Table, Td, must, useAsync } from "../ui";

type Vista = "proximas" | "por_validar" | "todas";

export default function Jornadas() {
  const [vista, setVista] = useState<Vista>("proximas");
  const { data, error, loading } = useAsync(async () => {
    let q = sb
      .from("ejecuciones")
      .select("id, fecha, hora_inicio_prog, hora_fin_prog, linea, servicio, estado, zonas, punto_nombre, campanias(id, nombre, empresas(nombre)), unidades(nombre), operador:perfiles!ejecuciones_operador_id_fkey(nombre)")
      .limit(400);
    if (vista === "proximas") q = q.gte("fecha", hoyISO()).in("estado", ["programada", "en_curso", "pausada"] as Enum<"estado_ejecucion">[]).order("fecha").order("hora_inicio_prog");
    else if (vista === "por_validar") q = q.eq("estado", "finalizada").order("fecha");
    else q = q.order("fecha", { ascending: false });
    return must(await q);
  }, [vista]);

  return (
    <Page
      title="Jornadas"
      subtitle="Agenda de unidades y operadores. Se programan desde cada campaña."
      actions={
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Mostrar</span>
          <Select
            className="w-auto"
            value={vista}
            onChange={(e) => setVista(e.target.value as Vista)}
            options={[["proximas", "Próximas"], ["por_validar", "Finalizadas por validar"], ["todas", "Todas"]]}
          />
        </label>
      }
    >
      <Card>
        <ErrorBox msg={error} />
        {loading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>No hay jornadas en esta vista.</Empty>
        ) : (
          <Table head={["Fecha", "Horario", "Campaña", "Servicio", "Unidad / operador", "Estado"]}>
            {data.map((j) => (
              <tr key={j.id} className="hover:bg-white/[0.03]">
                <Td className="whitespace-nowrap">
                  <Link to={`/admin/jornadas/${j.id}`} className="font-semibold text-brand-green-light underline-offset-4 hover:underline">{fecha(j.fecha)}</Link>
                </Td>
                <Td className="whitespace-nowrap text-muted">{j.hora_inicio_prog ? `${hora(j.hora_inicio_prog)}–${hora(j.hora_fin_prog)}` : "Todo el día"}</Td>
                <Td>
                  <p>{j.campanias?.nombre}</p>
                  <p className="text-xs text-muted">{j.campanias?.empresas?.nombre}</p>
                </Td>
                <Td>{servicioLabel(j.linea, j.servicio)}</Td>
                <Td className="text-muted">{[j.unidades?.nombre, j.operador?.nombre].filter(Boolean).join(" · ") || "Sin asignar"}</Td>
                <Td><Estado map={estadoEjecucion} value={j.estado} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}
