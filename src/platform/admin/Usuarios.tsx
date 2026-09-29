import { useState } from "react";
import { useSearchParams } from "react-router";
import { KeyRound, UserPlus } from "lucide-react";
import { useAuth } from "../auth";
import { adminUsuarios, sb } from "../supabase";
import { rolLabel } from "../labels";
import type { Enum } from "../database.types";
import { Badge, Btn, Card, Empty, ErrorBox, Field, Input, Loading, OkBox, Page, Select, Table, Td, must, useAction, useAsync } from "../ui";

/** Contraseña temporal legible (sin caracteres que se confunden). */
function generarClave() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint32Array(10));
  return [...r].map((n) => c[n % c.length]).join("");
}

export default function Usuarios() {
  const { perfil } = useAuth();
  const soySuper = perfil?.rol === "super_admin";
  const [params] = useSearchParams();
  const { data, error, loading, reload } = useAsync(async () => {
    const [u, e] = await Promise.all([
      sb.from("perfiles").select("*, empresas(nombre)").order("rol").order("nombre"),
      sb.from("empresas").select("id, nombre").order("nombre"),
    ]);
    return { users: must(u), empresas: must(e) };
  }, []);

  const empresaInicial = params.get("empresa") ?? "";
  const rolInicial = (["cliente", "operador", "admin", "super_admin"] as const).find((r) => r === params.get("rol")) ?? "cliente";
  const [f, setF] = useState({ rol: rolInicial as Enum<"rol_usuario">, empresa_id: empresaInicial, nombre: "", correo: "", telefono: "", password: generarClave() });
  const [creado, setCreado] = useState<{ correo: string; password: string } | null>(null);
  const [claveDe, setClaveDe] = useState<{ id: string; password: string } | null>(null);
  const [claveNueva, setClaveNueva] = useState<{ correo: string; password: string } | null>(null);
  const crear = useAction();
  const acc = useAction();

  const roles: Enum<"rol_usuario">[] = soySuper ? ["cliente", "operador", "admin", "super_admin"] : ["cliente", "operador"];

  return (
    <Page title="Usuarios" subtitle="Accesos al portal (clientes), a la app (operadores) y a este panel.">
      <Card title={`Crear ${f.rol === "cliente" ? "cliente" : f.rol === "operador" ? "operador" : "administrador"}`}>
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Tipo de usuario a crear">
          {([
            ["cliente", "Nuevo cliente", "Entra al portal y ve sus campañas"],
            ["operador", "Nuevo operador", "Registra jornadas, GPS y fotos desde el celular"],
            ...(soySuper ? ([["admin", "Nuevo administrador", "Maneja este panel"]] as const) : []),
          ] as const).map(([r, label, ayuda]) => (
            <button
              key={r}
              type="button"
              aria-pressed={f.rol === r}
              onClick={() => { setCreado(null); setF({ ...f, rol: r }); }}
              className={`grid min-h-14 min-w-44 content-center rounded-2xl px-4 py-2 text-left ring-1 ring-inset transition-colors ${f.rol === r ? "bg-brand-green text-brand-blue-dark ring-brand-green" : "ring-white/20 hover:bg-white/[0.06]"}`}
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className={`text-xs ${f.rol === r ? "text-brand-blue-dark/80" : "text-muted"}`}>{ayuda}</span>
            </button>
          ))}
        </div>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            setCreado(null);
            crear.run(async () => {
              const r = await adminUsuarios({ accion: "crear", ...f, empresa_id: f.rol === "cliente" ? f.empresa_id : null });
              if (r.error) throw new Error(r.error);
              setCreado({ correo: f.correo.trim().toLowerCase(), password: f.password });
              setF({ ...f, nombre: "", correo: "", telefono: "", password: generarClave() });
              await reload();
            });
          }}
        >
          <Field label="Rol">
            <Select value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value as Enum<"rol_usuario"> })} options={roles.map((r) => [r, rolLabel[r]])} />
          </Field>
          {f.rol === "cliente" && (
            <Field label="Empresa">
              <Select required value={f.empresa_id} onChange={(e) => setF({ ...f, empresa_id: e.target.value })} placeholder="Elige la empresa" options={(data?.empresas ?? []).map((e) => [e.id, e.nombre])} />
            </Field>
          )}
          <Field label="Nombre"><Input required minLength={2} maxLength={120} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
          <Field label="Correo"><Input type="email" required maxLength={160} autoComplete="off" value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} /></Field>
          <Field label="Teléfono (opcional)"><Input type="tel" maxLength={20} value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} /></Field>
          <div className="flex items-end gap-2">
            <Field label="Contraseña temporal" hint="Mínimo 8 caracteres. Compártela por un medio privado." className="flex-1">
              <Input required minLength={8} maxLength={72} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="font-mono" autoComplete="new-password" />
            </Field>
            <Btn variant="secondary" className="mb-6" onClick={() => setF({ ...f, password: generarClave() })} aria-label="Generar otra contraseña">↻</Btn>
          </div>
          <div className="grid gap-3 sm:col-span-2 lg:col-span-3">
            <ErrorBox msg={crear.error} />
            {creado && (
              <Credenciales titulo="Usuario creado. Envíale estos datos:" correo={creado.correo} password={creado.password} />
            )}
            <div><Btn type="submit" loading={crear.busy} icon={<UserPlus className="size-4" aria-hidden />}>Crear usuario</Btn></div>
          </div>
        </form>
      </Card>

      <Card title="Usuarios">
        <ErrorBox msg={error ?? acc.error} />
        <OkBox msg={acc.ok} />
        {claveNueva && <div className="mb-4"><Credenciales titulo="Contraseña cambiada. Envíale estos datos:" correo={claveNueva.correo} password={claveNueva.password} /></div>}
        {loading ? (
          <Loading />
        ) : !data?.users.length ? (
          <Empty>Sin usuarios.</Empty>
        ) : (
          <Table head={["Usuario", "Rol", "Empresa", "Estado", ""]}>
            {data.users.map((u) => {
              const esAdmin = u.rol === "admin" || u.rol === "super_admin";
              const puedo = soySuper || !esAdmin || u.id === perfil?.id;
              return (
                <tr key={u.id}>
                  <Td>
                    <p className="font-semibold">{u.nombre || "—"}</p>
                    <p className="text-xs text-muted">{u.correo}</p>
                  </Td>
                  <Td>{rolLabel[u.rol]}</Td>
                  <Td className="text-muted">{u.empresas?.nombre ?? "—"}</Td>
                  <Td>{u.activo ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge>}</Td>
                  <Td className="whitespace-nowrap text-right">
                    {puedo && (
                      claveDe?.id === u.id ? (
                        <span className="inline-flex items-center gap-2">
                          <Input aria-label="Nueva contraseña" className="w-36 py-1.5 font-mono text-sm" value={claveDe.password} onChange={(e) => setClaveDe({ ...claveDe, password: e.target.value })} />
                          <Btn className="min-h-8 px-3 text-xs" loading={acc.busy}
                            onClick={() => acc.run(async () => {
                              const r = await adminUsuarios({ accion: "contrasena", id: u.id, password: claveDe.password });
                              if (r.error) throw new Error(r.error);
                              setClaveNueva({ correo: u.correo ?? "", password: claveDe.password });
                              setClaveDe(null);
                            })}>
                            Guardar
                          </Btn>
                          <Btn variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => setClaveDe(null)}>Cancelar</Btn>
                        </span>
                      ) : (
                        <Btn variant="ghost" className="min-h-8 px-3 text-xs" icon={<KeyRound className="size-3.5" aria-hidden />} onClick={() => setClaveDe({ id: u.id, password: generarClave() })}>
                          Contraseña
                        </Btn>
                      )
                    )}
                    {puedo && u.id !== perfil?.id && (
                      <Btn variant="ghost" className="min-h-8 px-3 text-xs"
                        onClick={() => acc.run(async () => { must(await sb.from("perfiles").update({ activo: !u.activo }).eq("id", u.id).select("id").single()); await reload(); })}>
                        {u.activo ? "Desactivar" : "Activar"}
                      </Btn>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </Page>
  );
}

/** Datos de acceso listos para copiar (sin signos pegados que se confundan con la contraseña). */
function Credenciales({ titulo, correo, password }: { titulo: string; correo: string; password: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${location.origin}/entrar`;
  const texto = `Acceso al portal de Publicalle\n${url}\nCorreo: ${correo}\nContraseña temporal: ${password}\n(Puedes cambiarla en «Mi cuenta».)`;
  return (
    <div role="status" className="grid gap-3 rounded-xl bg-brand-green/10 p-4 ring-1 ring-inset ring-brand-green/30">
      <p className="text-sm font-semibold text-brand-green-light">{titulo}</p>
      <dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-muted">Enlace</dt><dd className="break-all font-mono">{url}</dd>
        <dt className="text-muted">Correo</dt><dd className="break-all font-mono">{correo}</dd>
        <dt className="text-muted">Contraseña</dt><dd className="font-mono text-base font-bold tracking-wide select-all">{password}</dd>
      </dl>
      <div>
        <Btn variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin permiso de portapapeles */ } }}>
          {copiado ? "¡Copiado!" : "Copiar datos de acceso"}
        </Btn>
      </div>
    </div>
  );
}
