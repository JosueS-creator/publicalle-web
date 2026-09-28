/**
 * Conexión a Supabase (opcional). Si no hay variables, el brief se envía por WhatsApp.
 * Solo se usa la llave pública "anon": las reglas RLS impiden leer solicitudes desde la web.
 */
export const supabaseConfig = {
  url: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "",
  anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "",
};

export const hasSupabase = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
