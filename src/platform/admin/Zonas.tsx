import { useState } from "react";
import { Plus, Save, Trash2, Undo2 } from "lucide-react";
import { sb } from "../supabase";
import { Mapa } from "../MapaLazy";
import { Btn, Card, Empty, ErrorBox, Field, Input, Loading, OkBox, Page, Table, Td, must, useAction, useAsync } from "../ui";

type V = [number, number];

export default function Zonas() {
  const { data, error, loading, reload } = useAsync(async () => must(await sb.from("zonas").select("*").order("ciudad").order("nombre")), []);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("Tegucigalpa");
  const [vertices, setVertices] = useState<V[]>([]);
  const acc = useAction();

  const limpiar = () => {
    setEditId(null);
    setNombre("");
    setVertices([]);
  };
  const otras = (data ?? []).filter((z) => z.id !== editId);

  return (
    <Page title="Zonas" subtitle="Contornos de las zonas. El cliente ve el recorrido y los km SOLO dentro de estas zonas. Regla: no dibujes zonas que se encimen (cada km debe pertenecer a una sola zona).">
      <Card title={editId ? `Editar zona: ${nombre}` : "Nueva zona"}>
        <div className="grid gap-4">
          <p className="text-sm text-muted">Haz clic en el mapa para marcar las esquinas de la zona, en orden (mínimo 3). La zona se cierra sola.</p>
          <Mapa
            alto={420}
            etiqueta="Dibujar zona"
            zonas={otras.map((z) => ({ nombre: z.nombre, contorno: z.contorno }))}
            borrador={vertices}
            onClick={(p) => setVertices((v) => [...v, [Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6))]])}
          />
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" icon={<Undo2 className="size-4" aria-hidden />} disabled={!vertices.length} onClick={() => setVertices((v) => v.slice(0, -1))}>Deshacer punto</Btn>
            <Btn variant="ghost" disabled={!vertices.length} onClick={() => setVertices([])}>Borrar dibujo</Btn>
            <span className="self-center text-sm text-muted">{vertices.length} puntos</span>
          </div>
          <form
            className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
            onSubmit={(ev) => {
              ev.preventDefault();
              acc.run(async () => {
                if (vertices.length < 3) throw new Error("Marca al menos 3 puntos en el mapa.");
                const row = { nombre: nombre.trim(), ciudad: ciudad.trim() || null, contorno: vertices };
                if (editId) must(await sb.from("zonas").update(row).eq("id", editId).select("id").single());
                else must(await sb.from("zonas").insert(row).select("id").single());
                limpiar();
                await reload();
              }, "Zona guardada.");
            }}
          >
            <Field label="Nombre" hint="Debe ser igual al que usas en las campañas (p. ej. «Col. Kennedy»).">
              <Input required minLength={2} maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Field>
            <Field label="Ciudad"><Input maxLength={80} value={ciudad} onChange={(e) => setCiudad(e.target.value)} /></Field>
            <div className="flex gap-2 sm:mb-6">
              <Btn type="submit" loading={acc.busy} icon={editId ? <Save className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}>{editId ? "Guardar" : "Crear zona"}</Btn>
              {editId && <Btn variant="ghost" onClick={limpiar}>Cancelar</Btn>}
            </div>
          </form>
          <ErrorBox msg={acc.error} />
          <OkBox msg={acc.ok} />
        </div>
      </Card>

      <Card title="Zonas registradas">
        <ErrorBox msg={error} />
        {loading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>Aún no hay zonas dibujadas.</Empty>
        ) : (
          <Table head={["Zona", "Ciudad", "Puntos", ""]}>
            {data.map((z) => (
              <tr key={z.id}>
                <Td className="font-semibold">{z.nombre}</Td>
                <Td>{z.ciudad ?? "—"}</Td>
                <Td className="text-muted">{z.contorno.length}</Td>
                <Td className="whitespace-nowrap text-right">
                  <Btn variant="ghost" className="min-h-8 px-3 text-xs" onClick={() => { setEditId(z.id); setNombre(z.nombre); setCiudad(z.ciudad ?? ""); setVertices(z.contorno); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</Btn>
                  <Btn variant="ghost" className="min-h-8 px-3 text-xs" icon={<Trash2 className="size-3.5" aria-hidden />}
                    onClick={() => { if (window.confirm(`¿Eliminar la zona «${z.nombre}»?`)) acc.run(async () => { must(await sb.from("zonas").delete().eq("id", z.id).select("id")); await reload(); }); }}>
                    Eliminar
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
