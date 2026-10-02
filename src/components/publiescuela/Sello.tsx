import { PublicalleMark } from "@/components/brand/PublicalleMark";
import { cn } from "@/lib/cn";

/**
 * Sello de PubliEscuela: la P de Publicalle + el nombre del servicio.
 * Deriva del logo madre (no es una marca independiente): siempre lleva «un servicio de Publicalle».
 */
export function SelloPubliEscuela({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <PublicalleMark compact title="" className={size === "sm" ? "h-9 w-auto" : "h-12 w-auto sm:h-14"} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-extrabold tracking-tight [font-stretch:115%]", size === "sm" ? "text-lg" : "text-2xl sm:text-[1.7rem]")}>
          <span className="text-brand-white">Publi</span>
          <span className="bg-[linear-gradient(100deg,var(--publicalle-green-light),var(--publicalle-green)_55%,var(--publicalle-blue-electric))] bg-clip-text text-transparent">Escuela</span>
        </span>
        <span className="type-data mt-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-muted">Un servicio de Publicalle</span>
      </span>
    </span>
  );
}
