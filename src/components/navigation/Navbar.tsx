import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { PublicalleLogo } from "@/components/brand/PublicalleLogo";
import { ButtonLink } from "@/components/ui/Button";
import { enPortada, hrefSitio, mainNav, primaryCta } from "@/config/navigation";
import { useScrolled } from "@/hooks/useScrolled";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/cn";

const SECTION_IDS = mainNav.map((n) => n.id);

export function Navbar() {
  const scrolled = useScrolled(24);
  const portada = enPortada();
  const seccion = useActiveSection(SECTION_IDS);
  // Fuera de la portada, el menú marca la página de servicio actual (p. ej. PubliEscuela)
  const active = portada ? seccion : mainNav.find((n) => n.href === window.location.pathname.replace(/\/$/, ""))?.id ?? null;
  // En una página de servicio, el botón principal lleva a su propio configurador
  const cta = portada ? primaryCta : { ...primaryCta, label: "Configurar campaña", shortLabel: "Configurar", href: "#configurar" };
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "transition-[background-color,backdrop-filter,box-shadow] duration-500",
          scrolled || open
            ? "bg-brand-bg/90 shadow-[0_1px_0_0_var(--publicalle-line)] backdrop-blur-xl backdrop-saturate-150"
            : "bg-transparent",
        )}
      >
        <nav
          aria-label="Principal"
          className={cn(
            "container-pc flex items-center justify-between gap-6 transition-[height] duration-500 ease-[var(--ease-drive)]",
            scrolled ? "h-16" : "h-[var(--nav-h)] md:h-24",
          )}
        >
          <a href={portada ? "#inicio" : "/"} className="logo-shine shrink-0 rounded-lg" aria-label="Publicalle — inicio">
            <PublicalleLogo theme="dark" animate height={scrolled ? 40 : 52} className={cn("w-auto transition-all duration-500", scrolled ? "h-9 sm:h-10" : "h-10 sm:h-[52px]")} />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {mainNav.map((item) => (
              <li key={item.id}>
                <a
                  href={hrefSitio(item.href)}
                  aria-current={active === item.id ? "true" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[0.92rem] font-medium transition-colors xl:px-4",
                    active === item.id ? "text-brand-white" : "text-brand-white/60 hover:text-brand-white",
                  )}
                >
                  {active === item.id && (
                    <m.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ButtonLink href={cta.href} size="sm" className="max-[359px]:hidden" icon={<ArrowUpRight className="size-4" aria-hidden />}>
              <span className="sm:hidden">{cta.shortLabel}</span>
              <span className="max-sm:hidden">{cta.label}</span>
            </ButtonLink>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-brand-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/10 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-brand-bg/95 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
            <nav aria-label="Menú móvil" className="container-pc relative flex min-h-full flex-col pb-10 pt-8">
              <ol className="flex flex-col">
                {mainNav.map((item, i) => (
                  <m.li
                    key={item.id}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
                    className="border-b border-line"
                  >
                    <a
                      href={hrefSitio(item.href)}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline justify-between py-5 text-3xl font-extrabold tracking-tight [font-stretch:115%]"
                    >
                      {item.label}
                      <span className="type-data text-xs text-muted">0{i + 1}</span>
                    </a>
                  </m.li>
                ))}
              </ol>
              <div className="mt-auto pt-10">
                <ButtonLink href={cta.href} size="lg" className="w-full" onClick={() => setOpen(false)}>
                  {cta.label}
                </ButtonLink>
              </div>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
