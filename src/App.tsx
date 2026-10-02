import { lazy, startTransition, Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/contact/WhatsAppButton";
import { Hero } from "@/sections/Hero";

const BelowTheFold = lazy(() => import("@/sections/BelowTheFold"));
const PubliEscuela = lazy(() => import("@/pages/PubliEscuela"));

/** Páginas de servicio dentro del mismo sitio (mismo header y footer). */
export const esPubliEscuela = () => /^\/publi-escuela\/?$/.test(window.location.pathname);

/** Narrativa: MARCA → VEHÍCULO → CALLE → RUTA → COBERTURA → DATOS → RESULTADO */
export default function App() {
  if (esPubliEscuela()) return <Sitio><Suspense fallback={<div className="min-h-screen" aria-hidden />}><PubliEscuela /></Suspense></Sitio>;
  return <Inicio />;
}

function Inicio() {
  // Lo de abajo del hero se monta DESPUÉS del primer pintado y como transición (React lo trocea y no bloquea el hilo principal)
  const [resto, setResto] = useState(false);
  useEffect(() => {
    const go = () => startTransition(() => setResto(true));
    if (window.location.hash) return go(); // enlace directo a una sección (p. ej. /#contacto)
    const ric = window.requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
    if (ric) {
      const id = ric(go, { timeout: 1500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(go, 300);
    return () => clearTimeout(t);
  }, []);

  // Enlace directo a una sección (/#contacto): bajar cuando la sección ya existe
  useEffect(() => {
    if (!resto || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50);
    return () => clearTimeout(t);
  }, [resto]);

  return (
    <Sitio>
      <Hero />
      <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
        {resto ? <BelowTheFold /> : <div className="min-h-screen" aria-hidden />}
      </Suspense>
    </Sitio>
  );
}

/** Marco común de la web pública: header y footer de Publicalle. */
function Sitio({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-green focus:px-4 focus:py-2 focus:text-brand-blue-dark"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">{children}</main>
      <Footer />
      <aside aria-label="Contacto rápido">
        <WhatsAppButton variant="floating" />
      </aside>
    </>
  );
}
