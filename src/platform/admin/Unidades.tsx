import { useState } from "react";
import { Plus } from "lucide-react";
import { sb } from "../supabase";
import { lista, tiposUnidad } from "../labels";
import type { Row } from "../database.types";
import { Badge, Btn, Card, Empty, ErrorBox, Field, Input, Loading, Page, Select, Table, Td, must, useAction, useAsync } from "../ui";

type U = Row<"unidades">;
const vacia = { nombre: "", tipo: "vehiculo", capacidades: "", ciudad_base: "Tegucigalpa", placa: "", notas: "" };

export default function Unidades() {
  const { data, error, loading, reload } = useAsync(async () => must(await sb.from("unidades").select("*").order("activa", { ascending: false }).order("nombre")), []);
  const [f, setF] = useState(vacia);
  const [editId, setEditId] = useState<string | null>(null);
  const acc = useAction();

  const editar = (u: U) => {
    setEditId(u.id);
    setF({ nombre: u.nombre, tipo: u.tipo, capacidades: u.capacidades.join(", "), ciudad_base: u.ciudad_base, placa: u.placa ?? "", notas: u.notas ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Page title="Unidades" subtitle="Vehículos y equipos que se asignan a las jornadas.">
      <Card title={editId ? "Editar unidad" : "Nueva unidad"}>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            acc.run(async () => {
              const row = { nombre: f.nombre.trim(), tipo: f.tipo, capacidades: lista(f.capacidades), ciudad_base: f.ciudad_base.trim(), placa: f.placa.trim() || null, notas: f.notas.trim() || null };
              if (editId) must(await sb.from("unidades").update(row).eq("id", editId).select("id").single());
              else must(await sb.from("unidades").insert(row).select("id").single());
              setF(vacia);
              setEditId(null);
              await reload();
            });
          }}
        >
          <Field label="Nombre"><Input required maxLength={80} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Versa LED 01" /></Field>
          <Field label="Tipo"><Select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} options={Object.entries(tiposUnidad)} /></Field>
          <Field label="Ciudad base"><Input required maxLength={80} value={f.ciudad_base} onChange={(e) => setF({ ...f, ciudad_base: e.target.value })} /></Field>
          <Field label="Capacidades" hint="Separadas por coma."><Input value={f.capacidades} onChange={(e) => setF({ ...f, capacidades: e.target.value })} placeholder="pantalla LED, perifoneo" /></Field>
          <Field label="Placa" hint="Solo la ve el equipo."><Input maxLength={20} value={f.placa} onChange={(e) => setF({ ...f, placa: e.target.value })} /></Field>
          <Field label="Notas"><Input maxLength={300} value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} /></Field>
          <div className="grid gap-3 sm:col-span-2 lg:col-span-3">
            <ErrorBox msg={acc.error} />
            <div className="flex gap-2">
              <Btn type="submit" loading={acc.busy} icon={editId ? undefined : <Plus className="size-4" aria-hidden />}>{editId ? "Guardar cambios" : "Agregar unidad"}</Btn>
              {editId && <Btn variant="ghost" onClick={() => { setEditId(null); setF(vacia); }}>Cancelar</Btn>}
            </div>
          </div>
        </form>
      </Card>

      <Card title="Flota">
        <ErrorBox msg={error} />
        {loading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>Aún no hay unidades registradas.</Empty>
        ) : (
          <Table head={["Unidad", "Tipo", "Ciudad", "Capacidades", "Estado", ""]}>
            {data.map((u) => (
              <tr key={u.id}>
                <Td><p className="font-semibold">{u.nombre}</p>{u.placa && <p className="font-mono text-xs text-muted">{u.placa}</p>}</Td>
                <Td>{tiposUnidad[u.tipo] ?? u.tipo}</Td>
                <Td>{u.ciudad_base}</Td>
                <Td className="text-muted">{u.capacidades.join(", ") || "—"}</Td>
                <Td>{u.activa ? <Badge tone="green">Activa</Badge> : <Badge tone="gray">Inactiva</Badge>}</Td>
                <Td className="whitespace-nowrap text-right">
                  <Btn variant="ghost" className="min-h-8 px-3 text-xs" onClick={() => editar(u)}>Editar</Btn>
                  <Btn variant="ghost" className="min-h-8 px-3 text-xs" onClick={() => acc.run(async () => { must(await sb.from("unidades").update({ activa: !u.activa }).eq("id", u.id).select("id").single()); await reload(); })}>
                    {u.activa ? "Desactivar" : "Activar"}
                  </Btn>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}
