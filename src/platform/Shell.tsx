import { useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { LogOut, Menu, X } from "lucide-react";
import { PublicalleLogo } from "@/components/brand/PublicalleLogo";
import { cn } from "@/lib/cn";
import { useAuth } from "./auth";
import { rolLabel } from "./labels";

export type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean };

/** Marco común del admin y del portal: barra lateral (escritorio) o menú (móvil). */
export function Shell({ nav, area }: { nav: NavItem[]; area: string }) {
  const { perfil, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links = (
    <nav aria-label={area} className="grid gap-1">
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors [&_svg]:size-4",
              isActive ? "bg-brand-green/15 text-brand-green-light" : "text-brand-white/80 hover:bg-white/[0.06] hover:text-brand-white",
            )
          }
        >
          {n.icon}
          {n.label}
        </NavLink>
      ))}
    </nav>
  );

  const user = (
    <div className="grid gap-3 border-t border-line pt-4">
      <div className="min-w-0 text-sm">
        <p className="truncate font-semibold">{perfil?.nombre || perfil?.correo}</p>
        <p className="text-xs text-muted">{perfil ? rolLabel[perfil.rol] : ""}</p>
      </div>
      <button type="button" onClick={signOut} className="inline-flex items-center gap-2 text-sm text-brand-white/80 hover:text-brand-white">
        <LogOut className="size-4" aria-hidden /> Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-green focus:px-4 focus:py-2 focus:text-brand-blue-dark">
        Saltar al contenido
      </a>

      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-[#070e1f] p-5 lg:flex">
        <div>
          <PublicalleLogo height={30} />
          <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">{area}</p>
        </div>
        <div className="flex-1">{links}</div>
        {user}
      </aside>

      {/* Móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-[#070e1f]/95 px-4 py-3 backdrop-blur lg:hidden">
        <PublicalleLogo height={26} />
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="menu-movil" className="grid size-10 place-items-center rounded-full ring-1 ring-inset ring-white/20">
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          <span className="sr-only">Menú</span>
        </button>
      </header>
      {open && (
        <div id="menu-movil" className="grid gap-4 border-b border-line bg-[#070e1f] p-4 lg:hidden">
          {links}
          {user}
        </div>
      )}

      <main id="contenido" className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
