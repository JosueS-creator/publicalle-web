import { useState } from "react";
import { Link } from "react-router";
import { sb } from "../supabase";
import { estadoSolicitud, fechaHora } from "../labels";
import type { Enum } from "../database.types";
import { Badge, Card, Empty, ErrorBox, Estado, Loading, Page, Select, Table, Td, must, useAsync } from "../ui";

type Filtro = "activas" | Enum<"estado_solicitud"> | "todas";

export default function Solicitudes() {
  const [filtro, setFiltro] = useState<Filtro>("activas");
  const { data, error, loading } = useAsync(async () => {
    let q = sb
      .from("solicitudes")
      .select("id, folio, estado, objetivo, ciudades, contacto_nombre, contacto_empresa, contacto_telefono, creado_en, origen, empresas(nombre)")
      .order("creado_en", { ascending: false })
      .limit(300);
    if (filtro === "activas") q = q.in("estado", ["nueva", "en_revision"]);
    else if (filtro !== "todas") q = q.eq("estado", filtro);
    return must(await q);
  }, [filtro]);

  return (
    <Page
      title="Solicitudes"
      subtitle="Lo que llega desde el brief de la web."
      actions={
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Mostrar</span>
          <Select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            className="w-auto"
            options={[
              ["activas", "Pendientes (nuevas y en revisión)"],
              ["nueva", "Nuevas"],
              ["en_revision", "En revisión"],
              ["convertida", "Convertidas"],
              ["descartada", "Descartadas"],
              ["todas", "Todas"],
            ]}
          />
        </label>
      }
    >
      <Card>
        <ErrorBox msg={error} />
        {loading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>No hay solicitudes en esta vista.</Empty>
        ) : (
          <Table head={["Folio", "Recibida", "Contacto", "Objetivo", "Ciudades", "Estado"]}>
            {data.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.03]">
                <Td>
                  <Link to={`/admin/solicitudes/${s.id}`} className="font-mono font-semibold text-brand-green-light underline-offset-4 hover:underline">
                    {s.folio}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-muted">{fechaHora(s.creado_en)}</Td>
                <Td>
                  <p className="font-medium">{s.contacto_nombre}</p>
                  <p className="text-xs text-muted">{[s.contacto_empresa, s.contacto_telefono].filter(Boolean).join(" · ")}</p>
                  {s.origen === "portal" && <span className="mt-1 inline-block"><Badge tone="blue">Cliente existente · {s.empresas?.nombre}</Badge></span>}
                </Td>
                <Td>{s.objetivo}</Td>
                <Td className="text-muted">{s.ciudades.join(", ")}</Td>
                <Td>
                  <Estado map={estadoSolicitud} value={s.estado} />
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}
