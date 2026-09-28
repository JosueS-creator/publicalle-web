import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { sb } from "../supabase";
import { Btn, Card, Empty, ErrorBox, Field, Input, Loading, Page, Table, Td, must, useAction, useAsync } from "../ui";

export default function Clientes() {
  const nav = useNavigate();
  const { data, error, loading } = useAsync(
    async () => must(await sb.from("empresas").select("id, nombre, telefono, correo, campanias(count), perfiles(count)").order("nombre")),
    [],
  );
  const [f, setF] = useState({ nombre: "", rtn: "", telefono: "", correo: "" });
  const crear = useAction();

  return (
    <Page title="Clientes" subtitle="Empresas que contratan campañas.">
      <Card title="Nueva empresa">
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            crear.run(async () => {
              const r = must<{ id: string }>(
                await sb
                  .from("empresas")
                  .insert({ nombre: f.nombre.trim(), rtn: f.rtn.trim() || null, telefono: f.telefono.trim() || null, correo: f.correo.trim() || null })
                  .select("id")
                  .single(),
              );
              nav(`/admin/clientes/${r.id}`);
            });
          }}
        >
          <Field label="Nombre">
            <Input required minLength={2} maxLength={160} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          </Field>
          <Field label="RTN (opcional)">
            <Input maxLength={20} value={f.rtn} onChange={(e) => setF({ ...f, rtn: e.target.value })} />
          </Field>
          <Field label="Teléfono (opcional)">
            <Input type="tel" maxLength={20} value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} />
          </Field>
          <Field label="Correo (opcional)">
            <Input type="email" maxLength={160} value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <ErrorBox msg={crear.error} />
            <Btn type="submit" loading={crear.busy} icon={<Plus className="size-4" aria-hidden />} className="mt-2">
              Crear empresa
            </Btn>
          </div>
        </form>
      </Card>

      <Card title="Empresas">
        <ErrorBox msg={error} />
        {loading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>Aún no hay empresas. Se crean aquí o al convertir una solicitud.</Empty>
        ) : (
          <Table head={["Empresa", "Contacto", "Campañas", "Usuarios"]}>
            {data.map((e) => (
              <tr key={e.id} className="hover:bg-white/[0.03]">
                <Td>
                  <Link to={`/admin/clientes/${e.id}`} className="font-semibold text-brand-green-light underline-offset-4 hover:underline">
                    {e.nombre}
                  </Link>
                </Td>
                <Td className="text-muted">{[e.telefono, e.correo].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>{e.campanias[0]?.count ?? 0}</Td>
                <Td>{e.perfiles[0]?.count ?? 0}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}
