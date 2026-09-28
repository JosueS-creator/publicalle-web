import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { LogIn } from "lucide-react";
import { PublicalleLogo } from "@/components/brand/PublicalleLogo";
import { hasSupabase } from "@/config/backend";
import { esStaff, useAuth } from "./auth";
import { errorMsg, sb } from "./supabase";
import { Btn, ErrorBox, Field, Input, Loading } from "./ui";

export default function Login() {
  const { loading, session, perfil, signOut } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Entrar · Publicalle";
  }, []);

  if (loading) return <Center><Loading /></Center>;
  if (session && perfil?.activo) {
    if (esStaff(perfil)) return <Navigate to="/admin" replace />;
    if (perfil.rol === "cliente") return <Navigate to="/portal" replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithPassword({ email: correo.trim(), password });
    if (error) setError(errorMsg(error));
    setBusy(false);
  };

  const sinAcceso = session && (!perfil || !perfil.activo || perfil.rol === "operador");

  return (
    <Center>
      <div className="w-full max-w-sm">
        <a href="/" className="mb-8 inline-block" aria-label="Ir a la web de Publicalle">
          <PublicalleLogo height={40} />
        </a>
        {sinAcceso ? (
          <div className="grid gap-4 rounded-2xl bg-surface p-6 ring-1 ring-inset ring-line">
            <h1 className="text-xl font-bold">
              {perfil?.rol === "operador" && perfil.activo ? "Usa la app del operador" : "Tu cuenta no tiene acceso"}
            </h1>
            <p className="text-sm text-muted">
              {perfil?.rol === "operador" && perfil.activo
                ? "Las jornadas se registran desde la app del operador, que estará disponible pronto."
                : "Tu usuario no está activo o aún no tiene un perfil asignado. Escríbele al equipo de Publicalle."}
            </p>
            <Btn variant="secondary" onClick={signOut}>
              Cerrar sesión
            </Btn>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-surface p-6 ring-1 ring-inset ring-line">
            <div>
              <h1 className="text-xl font-bold">Entrar</h1>
              <p className="mt-1 text-sm text-muted">Portal de clientes y panel de Publicalle.</p>
            </div>
            {!hasSupabase && <ErrorBox msg="Falta configurar la conexión con la base de datos (variables de Supabase)." />}
            <Field label="Correo">
              <Input type="email" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
            </Field>
            <Field label="Contraseña">
              <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <ErrorBox msg={error} />
            <Btn type="submit" loading={busy} icon={<LogIn className="size-4" aria-hidden />}>
              Entrar
            </Btn>
            <p className="text-xs text-muted">¿Olvidaste tu contraseña? Pídele al equipo de Publicalle que te asigne una nueva.</p>
          </form>
        )}
      </div>
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-dvh place-items-center px-4 py-10">{children}</main>;
}
