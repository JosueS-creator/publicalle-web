import { cn } from "@/lib/cn";

/** Indicador de estado (punto que pulsa + etiqueta mono). */
export function StatusBadge({ label, tone = "green", className }: { label: string; tone?: "green" | "blue" | "muted"; className?: string }) {
  const color = tone === "green" ? "text-brand-green" : tone === "blue" ? "text-brand-electric" : "text-muted";
  return (
    <span className={cn("type-eyebrow inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 ring-1 ring-inset ring-white/10", color, className)}>
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-current animate-ping-soft" />
        <span className="relative size-1.5 rounded-full bg-current" />
      </span>
      {label}
    </span>
  );
}

/** Marca visible para contenido de ejemplo/demostrativo. */
export function DemoTag({ label = "Ejemplo", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("type-eyebrow inline-flex items-center rounded-md border border-dashed border-brand-white/40 bg-brand-white/[0.06] px-2 py-1 text-[0.62rem] text-brand-white/85", className)}>
      {label}
    </span>
  );
}
