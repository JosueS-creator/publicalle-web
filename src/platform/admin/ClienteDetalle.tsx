import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Plus, Save, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "../auth";
import { adminUsuarios, sb } from "../supabase";
import { estadoCampania, fecha } from "../labels";
import { Badge, Btn, BtnLink, Card, Empty, ErrorBox, Estado, Field, Input, Loading, OkBox, Page, Table, Td, must, useAction, useAsync } from "../ui";

export default function ClienteDetalle() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { perfil } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const [e, camps, users] = await Promise.all([
      sb.from("empresas").select("*").eq("id", id).single(),
      sb.from("campanias").select("id, nombre, estado, fecha_inicio, fecha_fin").eq("empresa_id", id).order("creado_en", { ascending: false }),
      sb.from("perfiles").select("id, nombre, correo, activo").eq("empresa_id", id).order("nombre"),
    ]);
    return { e: must(e), camps: must(camps), users: must(users) };
  }, [id]);

  const [f, setF] = useState({ nombre: "", rtn: "", telefono: "", correo: "" });
  const [nueva, setNueva] = useState("");
  const guardar = useAction();
  const crearCamp = useAction();

  useEffect(() => {
    if (data) setF({ nombre: data.e.nombre, rtn: data.e.rtn ?? "", telefono: data.e.telefono ?? "", correo: data.e.correo ?? "" });
  }, [data]);

  if (loading) return <Page title="Cliente" back="/admin/clientes"><Loading /></Page>;
  if (!data) return <Page title="Cliente" back="/admin/clientes"><ErrorBox msg={error} /></Page>;

  return (
    <Page title={data.e.nombre} back="/admin/clientes">
      <Card title="Datos de la empresa">
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            guardar.run(async () => {
              must(
                await sb
                  .from("empresas")
                  .update({ nombre: f.nombre.trim(), rtn: f.rtn.trim() || null, telefono: f.telefono.trim() || null, correo: f.correo.trim() || null })
                  .eq("id", id)
                  .select("id")
                  .single(),
              );
              await reload();
            }, "Datos guardados.");
          }}
        >
          <Field label="Nombre"><Input required minLength={2} maxLength={160} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
          <Field label="RTN"><Input maxLength={20} value={f.rtn} onChange={(e) => setF({ ...f, rtn: e.target.value })} /></Field>
          <Field label="Teléfono"><Input type="tel" maxLength={20} value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} /></Field>
          <Field label="Correo"><Input type="email" maxLength={160} value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} /></Field>
          <div className="grid gap-3 sm:col-span-2 lg:col-span-4">
            <ErrorBox msg={guardar.error} />
            <OkBox msg={guardar.ok} />
            <div><Btn type="submit" loading={guardar.busy} icon={<Save className="size-4" aria-hidden />}>Guardar</Btn></div>
          </div>
        </form>
      </Card>

      <Card title="Campañas">
        <form
          className="mb-5 flex flex-wrap items-end gap-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            crearCamp.run(async () => {
              const r = must<{ id: string }>(await sb.from("campanias").insert({ empresa_id: id, nombre: nueva.trim() }).select("id").single());
              nav(`/admin/campanias/${r.id}`);
            });
          }}
        >
          <Field label="Nueva campaña" className="min-w-64 flex-1">
            <Input required minLength={2} maxLength={120} value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nombre de la campaña" />
          </Field>
          <Btn type="submit" loading={crearCamp.busy} icon={<Plus className="size-4" aria-hidden />}>Crear</Btn>
        </form>
        <ErrorBox msg={crearCamp.error} />
        {!data.camps.length ? (
          <Empty>Esta empresa aún no tiene campañas.</Empty>
        ) : (
          <Table head={["Campaña", "Fechas", "Estado"]}>
            {data.camps.map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.03]">
                <Td><Link to={`/admin/campanias/${c.id}`} className="font-semibold text-brand-green-light underline-offset-4 hover:underline">{c.nombre}</Link></Td>
                <Td className="text-muted">{c.fecha_inicio ? `${fecha(c.fecha_inicio)} → ${fecha(c.fecha_fin)}` : "Sin fechas"}</Td>
                <Td><Estado map={estadoCampania} value={c.estado} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Usuarios del portal" actions={<BtnLink to={`/admin/usuarios?empresa=${id}`} icon={<UserPlus className="size-4" aria-hidden />}>Crear usuario</BtnLink>}>
        {!data.users.length ? (
          <Empty>Nadie de esta empresa tiene acceso al portal todavía.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {data.users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{u.nombre}</p>
                  <p className="text-xs text-muted">{u.correo}</p>
                </div>
                {u.activo ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {perfil?.rol === "super_admin" && <EliminarCliente id={id} nombre={data.e.nombre} campanias={data.camps.length} usuarios={data.users.length} />}
    </Page>
  );
}

function EliminarCliente({ id, nombre, campanias, usuarios }: { id: string; nombre: string; campanias: number; usuarios: number }) {
  const nav = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [confirma, setConfirma] = useState("");
  const acc = useAction();

  return (
    <Card title="Eliminar cliente" className="ring-red-400/25">
      {!abierto ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Borra la empresa, sus {campanias} campaña(s) con jornadas y evidencias, y sus {usuarios} acceso(s) al portal. No se puede deshacer.</p>
          <Btn variant="danger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setAbierto(true)}>Eliminar cliente</Btn>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            acc.run(async () => {
              if (confirma.trim() !== nombre.trim()) throw new Error("El nombre no coincide.");
              const r = await adminUsuarios({ accion: "eliminar_empresa", id });
              if (r.error) throw new Error(r.error);
              nav("/admin/clientes");
            });
          }}
        >
          <ErrorBox msg={acc.error} />
          <Field label={`Para confirmar, escribe el nombre del cliente: ${nombre}`}>
            <Input value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="off" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Btn type="submit" variant="danger" loading={acc.busy} disabled={confirma.trim() !== nombre.trim()} icon={<Trash2 className="size-4" aria-hidden />}>Eliminar definitivamente</Btn>
            <Btn type="button" variant="ghost" onClick={() => { setAbierto(false); setConfirma(""); }}>Cancelar</Btn>
          </div>
        </form>
      )}
    </Card>
  );
}
