import type { ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

/** Campos compartidos de los formularios públicos (brief y PubliEscuela). */
export const inputCls =
  "w-full rounded-xl bg-white/[0.06] px-4 py-3.5 text-brand-white ring-1 ring-inset ring-white/20 placeholder:text-brand-white/55 transition-[box-shadow,background-color] hover:ring-white/35 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 aria-[invalid=true]:ring-red-400/70";

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] ring-1 ring-inset transition-colors",
        selected ? "bg-brand-green font-semibold text-brand-blue-dark ring-brand-green" : "text-brand-white ring-white/25 hover:bg-white/10",
      )}
    >
      {selected && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

export function Label({ htmlFor, children, optional }: { htmlFor?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-medium text-brand-white/90">
      {children}
      {optional && <span className="text-xs font-normal text-brand-white/60">Opcional</span>}
    </label>
  );
}

export function Err({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-red-300">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden /> {msg}
    </p>
  );
}
