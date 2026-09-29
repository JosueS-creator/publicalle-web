import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { sb } from "./supabase";
import type { Row } from "./database.types";

type Perfil = Row<"perfiles">;
type AuthState = { loading: boolean; session: Session | null; perfil: Perfil | null; signOut: () => Promise<void> };

const Ctx = createContext<AuthState>({ loading: true, session: null, perfil: null, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const load = async (s: Session | null) => {
      setSession(s);
      if (!s) {
        setPerfil(null);
        setLoading(false);
        return;
      }
      const { data } = await sb.from("perfiles").select("*").eq("id", s.user.id).maybeSingle();
      if (alive) {
        setPerfil(data ?? null);
        setLoading(false);
      }
    };
    // Una sola fuente: onAuthStateChange emite INITIAL_SESSION al suscribirse (no se usa además getSession,
    // que provocaba cargar el perfil dos veces y volver a montar la pantalla).
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      // Diferido: llamar a Supabase dentro de este callback puede bloquear el candado de sesión (supabase-js)
      // Solo recarga el perfil si cambió el usuario (SIGNED_IN también se emite al volver a la pestaña)
      const uid = s?.user.id ?? null;
      if (uid !== uidRef.current) {
        const primera = uidRef.current === undefined;
        uidRef.current = uid;
        if (!primera) setLoading(true); // en la carga inicial ya está en "cargando"
        setTimeout(() => load(s), 0);
      } else setSession(s);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await sb.auth.signOut();
  };

  return <Ctx.Provider value={{ loading, session, perfil, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
export const esStaff = (p: Perfil | null) => !!p && p.activo && (p.rol === "admin" || p.rol === "super_admin");
