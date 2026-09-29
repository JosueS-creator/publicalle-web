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

    if (b.accion === "editar") {
      // Datos del perfil de un operador. El correo también cambia en su acceso (login).
      const id = String(b.id ?? "");
      const nombre = String(b.nombre ?? "").trim();
      const telefono = String(b.telefono ?? "").trim() || null;
      const correo = String(b.correo ?? "").trim().toLowerCase();
      const { data: objetivo } = await admin.from("perfiles").select("rol, correo").eq("id", id).maybeSingle();
      if (!objetivo) return json({ error: "Usuario no encontrado." }, 404);
      if (objetivo.rol !== "operador") return json({ error: "Solo se pueden editar perfiles de operador." }, 403);
      if (nombre.length < 2) return json({ error: "Escribe el nombre." }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return json({ error: "Correo no válido." }, 400);
      if (correo !== objetivo.correo) {
        const { error } = await admin.auth.admin.updateUserById(id, { email: correo, email_confirm: true });
        if (error) {
          const msg = /already|registered|exists/i.test(error.message) ? "Ya existe un usuario con ese correo." : error.message;
          return json({ error: msg }, 400);
        }
      }
      const { error } = await admin.from("perfiles").update({ nombre, telefono, correo }).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (b.accion === "eliminar") {
      // Solo operadores, y solo si no tienen historial: la evidencia de campañas nunca se pierde.
      const id = String(b.id ?? "");
      const { data: objetivo } = await admin.from("perfiles").select("rol").eq("id", id).maybeSingle();
      if (!objetivo) return json({ error: "Usuario no encontrado." }, 404);
      if (objetivo.rol === "cliente") {
        // Cliente: solo se quita su acceso al portal; la empresa y sus campañas se conservan
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, liberadas: 0 });
      }
      if (objetivo.rol !== "operador") return json({ error: "Solo se pueden eliminar perfiles de operador o cliente." }, 403);
      const cuenta = async (tabla: string, col: string, extra?: (q: any) => any) => {
        let q = admin.from(tabla).select("id", { count: "exact", head: true }).eq(col, id);
        if (extra) q = extra(q);
        const { count, error } = await q;
        if (error) throw error;
        return count ?? 0;
      };
      const historial =
        (await cuenta("ejecuciones", "operador_id", (q) => q.neq("estado", "programada"))) +
        (await cuenta("ejecucion_eventos", "registrado_por")) +
        (await cuenta("evidencias", "subida_por")) +
        (await cuenta("incidencias", "registrado_por"));
      if (historial > 0)
        return json({ error: "Este operador ya registró jornadas: no se puede eliminar sin perder evidencia. Desactívalo." }, 409);
      // Jornadas futuras quedan sin operador para reasignarlas
      const { data: libres, error: e1 } = await admin.from("ejecuciones").update({ operador_id: null }).eq("operador_id", id).select("id");
      if (e1) return json({ error: e1.message }, 400);
      const { error } = await admin.auth.admin.deleteUser(id); // borra también su perfil (on delete cascade)
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, liberadas: libres?.length ?? 0 });
    }

    if (b.accion === "eliminar_empresa") {
      // Borra una empresa cliente con TODO lo suyo. Solo super administrador.
      if (!soySuper) return json({ error: "Solo un super administrador puede eliminar clientes." }, 403);
      const id = String(b.id ?? "");
      const { data: emp } = await admin.from("empresas").select("id").eq("id", id).maybeSingle();
      if (!emp) return json({ error: "Cliente no encontrado." }, 404);
      const { data: camps, error: e1 } = await admin.from("campanias").select("id").eq("empresa_id", id);
      if (e1) return json({ error: e1.message }, 400);
      const campIds = (camps ?? []).map((c) => c.id);
      let paths: string[] = [];
      if (campIds.length) {
        const { data: jor, error: e2 } = await admin.from("ejecuciones").select("id").in("campania_id", campIds);
        if (e2) return json({ error: e2.message }, 400);
        const jorIds = (jor ?? []).map((j) => j.id);
        for (let i = 0; i < jorIds.length; i += 200) {
          const { data: ev, error: e3 } = await admin.from("evidencias").select("storage_path").in("ejecucion_id", jorIds.slice(i, i + 200));
          if (e3) return json({ error: e3.message }, 400);
          paths = paths.concat((ev ?? []).map((e) => e.storage_path));
        }
        // campañas → servicios, jornadas, eventos, GPS, evidencias e incidencias (en cascada)
        const { error: e4 } = await admin.from("campanias").delete().in("id", campIds);
        if (e4) return json({ error: e4.message }, 400);
      }
      // usuarios del cliente (su perfil se borra en cascada)
      const { data: us } = await admin.from("perfiles").select("id").eq("empresa_id", id).eq("rol", "cliente");
      for (const u of us ?? []) {
        const { error } = await admin.auth.admin.deleteUser(u.id);
        if (error) return json({ error: error.message }, 400);
      }
      const { error: e5 } = await admin.from("empresas").delete().eq("id", id); // sus solicitudes quedan como historial
      if (e5) return json({ error: e5.message }, 400);
      for (let i = 0; i < paths.length; i += 100) await admin.storage.from("evidencias").remove(paths.slice(i, i + 100));
      return json({ ok: true, campanias: campIds.length, usuarios: (us ?? []).length, archivos: paths.length });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado." }, 500);
  }
});
