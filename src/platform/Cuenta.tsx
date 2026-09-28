import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "./auth";
import { sb } from "./supabase";
import { rolLabel } from "./labels";
import { Btn, Card, Dl, ErrorBox, Field, Input, OkBox, Page, useAction } from "./ui";

/** Datos del usuario y cambio de contraseña (para reemplazar la temporal que asignó el admin). */
export default function Cuenta() {
  const { perfil, session } = useAuth();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const acc = useAction();

  return (
    <Page title="Mi cuenta">
      <Card title="Datos">
        <Dl items={[["Nombre", perfil?.nombre], ["Correo", session?.user.email], ["Rol", perfil ? rolLabel[perfil.rol] : ""]]} />
      </Card>
      <Card title="Cambiar contraseña">
        <form
          className="grid max-w-md gap-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            acc.run(async () => {
              if (p1.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
              if (p1 !== p2) throw new Error("Las contraseñas no coinciden.");
              const { error } = await sb.auth.updateUser({ password: p1 });
              if (error) throw error;
              setP1("");
              setP2("");
            }, "Contraseña actualizada. Úsala la próxima vez que entres.");
          }}
        >
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
            <Input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={p1} onChange={(e) => setP1(e.target.value)} />
          </Field>
          <Field label="Repite la contraseña">
            <Input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={p2} onChange={(e) => setP2(e.target.value)} />
          </Field>
          <ErrorBox msg={acc.error} />
          <OkBox msg={acc.ok} />
          <div>
            <Btn type="submit" loading={acc.busy} icon={<KeyRound className="size-4" aria-hidden />}>Guardar contraseña</Btn>
          </div>
        </form>
      </Card>
    </Page>
  );
}
