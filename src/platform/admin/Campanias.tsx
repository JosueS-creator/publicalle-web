import { useState } from "react";
import { Link } from "react-router";
import { sb } from "../supabase";
import { estadoCampania, fecha } from "../labels";
import type { Enum } from "../database.types";
import { Card, Empty, ErrorBox, Estado, Loading, Page, Select, Table, Td, must, useAsync } from "../ui";

export default function Campanias() {
  const [estado, setEstado] = useState<"" | Enum<"estado_campania">>("");
  const { data, error, loading } = useAsync(async () => {
    let q = sb
      .from("campanias")
      .select("id, nombre, estado, fecha_inicio, fecha_fin, ciudades, empresas(id, nombre), ejecuciones(count)")
      .order("creado_en", { ascending: false })
      .limit(300);
    if (estado) q = q.eq("estado", estado);
    return must(await q);
  }, [estado]);

  return (
    <Page
      title="Campañas"
      subtitle="Para crear una: convierte una solicitud o entra a un cliente."
      actions={
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Estado</span>
          <Select
            className="w-auto"
            value={estado}
            onChange={(e) => setEstado(e.target.value as Enum<"estado_campania">)}
            placeholder="Todos"
            options={(Object.keys(estadoCampania) as Enum<"estado_campania">[]).map((k) => [k, estadoCampania[k][0]])}
          />
        </label>
      }
    >
      <Card>
        <ErrorBox msg={error} />
        {loading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>No hay campañas en esta vista.</Empty>
        ) : (
          <Table head={["Campaña", "Cliente", "Fechas", "Jornadas", "Estado"]}>
            {data.map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.03]">
                <Td>
                  <Link to={`/admin/campanias/${c.id}`} className="font-semibold text-brand-green-light underline-offset-4 hover:underline">
                    {c.nombre}
                  </Link>
                  <p className="text-xs text-muted">{c.ciudades.join(", ")}</p>
                </Td>
                <Td>{c.empresas?.nombre}</Td>
                <Td className="whitespace-nowrap text-muted">{c.fecha_inicio ? `${fecha(c.fecha_inicio)} → ${fecha(c.fecha_fin)}` : "Sin fechas"}</Td>
                <Td>{c.ejecuciones[0]?.count ?? 0}</Td>
                <Td><Estado map={estadoCampania} value={c.estado} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}
