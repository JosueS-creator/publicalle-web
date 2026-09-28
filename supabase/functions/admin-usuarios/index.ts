// Edge Function: gestión de usuarios desde el panel de administración.
// Usa la llave secreta SOLO en el servidor. Quien llama debe ser admin o super_admin activo.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const url = Deno.env.get("SUPABASE_URL")!;
const secret =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}")["default"];
const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const ROLES = ["super_admin", "admin", "operador", "cliente"] as const;
type Rol = (typeof ROLES)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: auth } = await admin.auth.getUser(token);
    if (!auth?.user) return json({ error: "Sesión no válida." }, 401);

    const { data: yo } = await admin.from("perfiles").select("rol, activo").eq("id", auth.user.id).maybeSingle();
    if (!yo?.activo || (yo.rol !== "admin" && yo.rol !== "super_admin")) return json({ error: "No autorizado." }, 403);
    const soySuper = yo.rol === "super_admin";

    const b = await req.json();

    if (b.accion === "crear") {
      const correo = String(b.correo ?? "").trim().toLowerCase();
      const password = String(b.password ?? "");
      const nombre = String(b.nombre ?? "").trim();
      const telefono = String(b.telefono ?? "").trim() || null;
      const rol = b.rol as Rol;
      const empresa_id = rol === "cliente" ? (b.empresa_id as string | null) : null;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return json({ error: "Correo no válido." }, 400);
      if (password.length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
      if (nombre.length < 2) return json({ error: "Escribe el nombre." }, 400);
      if (!ROLES.includes(rol)) return json({ error: "Rol no válido." }, 400);
      if ((rol === "admin" || rol === "super_admin") && !soySuper)
        return json({ error: "Solo un super administrador puede crear administradores." }, 403);
      if (rol === "cliente" && !empresa_id) return json({ error: "Un cliente debe pertenecer a una empresa." }, 400);

      const { data: creado, error } = await admin.auth.admin.createUser({
        email: correo, password, email_confirm: true, user_metadata: { nombre },
      });
      if (error || !creado.user) {
        const msg = /already|registered|exists/i.test(error?.message ?? "") ? "Ya existe un usuario con ese correo." : error?.message;
        return json({ error: msg ?? "No se pudo crear el usuario." }, 400);
      }
      const { error: e2 } = await admin.from("perfiles").insert({ id: creado.user.id, rol, empresa_id, nombre, telefono, correo });
      if (e2) {
        await admin.auth.admin.deleteUser(creado.user.id);
        return json({ error: e2.message }, 400);
      }
      return json({ ok: true, id: creado.user.id });
    }

    if (b.accion === "contrasena") {
      const id = String(b.id ?? "");
      const password = String(b.password ?? "");
      if (password.length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
      const { data: objetivo } = await admin.from("perfiles").select("rol").eq("id", id).maybeSingle();
      if (!objetivo) return json({ error: "Usuario no encontrado." }, 404);
      if ((objetivo.rol === "admin" || objetivo.rol === "super_admin") && !soySuper && id !== auth.user.id)
        return json({ error: "Solo un super administrador puede cambiar la contraseña de otro administrador." }, 403);
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado." }, 500);
  }
});
