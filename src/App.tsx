import { lazy, Suspense } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/contact/WhatsAppButton";
import { Hero } from "@/sections/Hero";

const BelowTheFold = lazy(() => import("@/sections/BelowTheFold"));

/** Narrativa: MARCA → VEHÍCULO → CALLE → RUTA → COBERTURA → DATOS → RESULTADO */
export default function App() {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-green focus:px-4 focus:py-2 focus:text-brand-blue-dark"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Hero />
        <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
          <BelowTheFold />
        </Suspense>
      </main>
      <Footer />
      <aside aria-label="Contacto rápido">
        <WhatsAppButton variant="floating" />
      </aside>
    </>
  );
}
