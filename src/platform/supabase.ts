import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/config/backend";
import type { Database } from "./database.types";

/** Cliente de Supabase para admin y portal. Solo usa la llave pública (anon); el acceso lo controla RLS. */
export const sb = createClient<Database>(supabaseConfig.url || "http://localhost", supabaseConfig.anonKey || "anon", {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "publicalle-sesion" },
});

/** Mensaje legible a partir de un error de Supabase/Postgres. */
export function errorMsg(e: unknown): string {
  const raw = typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e ?? "");
  if (/Invalid login credentials/i.test(raw)) return "Correo o contraseña incorrectos.";
  if (/unidad_sin_cruces/i.test(raw)) return "Esa unidad ya tiene otra jornada que se cruza en ese horario.";
  if (/row-level security/i.test(raw)) return "No tienes permiso para esta acción.";
  if (/Failed to fetch|NetworkError/i.test(raw)) return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  if (/cliente_con_empresa/i.test(raw)) return "Un cliente debe pertenecer a una empresa.";
  return raw || "Ocurrió un error inesperado.";
}

/** Llama a la Edge Function de usuarios (crear / cambiar contraseña). */
export async function adminUsuarios(body: Record<string, unknown>): Promise<{ ok?: boolean; id?: string; error?: string }> {
  const { data, error } = await sb.functions.invoke("admin-usuarios", { body });
  if (error) {
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) return await ctx.json();
    } catch {
      /* respuesta sin JSON */
    }
    return { error: errorMsg(error) };
  }
  return data;
}
