import { cloneElement, useCallback, useEffect, useId, useRef, useState, type ReactElement, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link } from "react-router";
import { ChevronLeft, CircleAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "./labels";
import { errorMsg } from "./supabase";

/* ── Datos ─────────────────────────────────────────── */

/** Carga asíncrona con estado de carga/error y recarga. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const run = useCallback(fn, deps);
  const loaded = useRef(false);
  const reload = useCallback(async () => {
    // Solo la primera carga muestra "Cargando…"; las recargas conservan la pantalla (y los formularios)
    if (!loaded.current) setLoading(true);
    try {
      setData(await run());
      setError(null);
      loaded.current = true;
    } catch (e) {
      setError(errorMsg(e));
    } finally {
      setLoading(false);
    }
  }, [run]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

/** Lanza el error de una respuesta de Supabase o devuelve los datos. */
export function must<T>(r: { data: T | null; error: { message: string } | null }): NonNullable<T> {
  if (r.error) throw new Error(r.error.message);
  return r.data as NonNullable<T>;
}

/* ── Estructura ────────────────────────────────────── */

export function Page({ title, back, actions, children, subtitle }: { title: string; subtitle?: ReactNode; back?: string; actions?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Publicalle`;
  }, [title]);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      {back && (
        <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-white">
          <ChevronLeft className="size-4" aria-hidden /> Volver
        </Link>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight [font-stretch:110%] sm:text-3xl">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="grid gap-6">{children}</div>
    </div>
  );
}

export function Card({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold tracking-tight">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Dl({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-0.5 break-words text-[0.95rem]">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

const tones: Record<Tone, string> = {
  green: "bg-brand-green/15 text-brand-green-light ring-brand-green/30",
  blue: "bg-brand-electric/15 text-[#8fd0ff] ring-brand-electric/30",
  amber: "bg-[#f5b544]/15 text-[#ffd48a] ring-[#f5b544]/30",
  red: "bg-red-400/15 text-red-200 ring-red-400/30",
  gray: "bg-white/[0.07] text-brand-white/80 ring-white/15",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone])}>{children}</span>;
}

export function Estado<K extends string>({ map, value }: { map: Record<K, [string, Tone]>; value: K }) {
  const [label, tone] = map[value] ?? [value, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-muted" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {label}
    </p>
  );
}

export function ErrorBox({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-inset ring-red-400/30">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {msg}
    </p>
  );
}

export function OkBox({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return (
    <p role="status" className="rounded-xl bg-brand-green/10 px-4 py-3 text-sm text-brand-green-light ring-1 ring-inset ring-brand-green/30">
      {msg}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-muted">{children}</p>;
}

/* ── Tablas ────────────────────────────────────────── */

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {head.map((h) => (
              <th key={h} scope="col" className="px-5 py-2.5 font-medium first:pl-5 sm:px-6">
                {h || <span className="sr-only">Acciones</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3 align-top sm:px-6", className)}>{children}</td>;
}

/* ── Formularios ───────────────────────────────────── */

export const inputCls =
  "w-full rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-[0.95rem] text-brand-white ring-1 ring-inset ring-white/20 placeholder:text-brand-white/45 transition-shadow hover:ring-white/35 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 [color-scheme:dark]";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactElement<{ id?: string; "aria-describedby"?: string }>; className?: string }) {
  const uid = useId();
  const id = children.props.id ?? uid;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-brand-white/90">
        {label}
      </label>
      {cloneElement(children, { id, "aria-describedby": hintId })}
      {hint && (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cn(inputCls, "resize-y", p.className)} />;

export function Select({ options, placeholder, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: [string, string][]; placeholder?: string }) {
  return (
    <select {...p} className={cn(inputCls, "pr-8", p.className)}>
      {placeholder !== undefined && (
        <option value="" className="bg-surface text-brand-white">
          {placeholder}
        </option>
      )}
      {options.map(([v, l]) => (
        <option key={v} value={v} className="bg-surface text-brand-white">
          {l}
        </option>
      ))}
    </select>
  );
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
const btn: Record<BtnVariant, string> = {
  primary: "bg-brand-green text-brand-blue-dark hover:bg-brand-green-light",
  secondary: "bg-white/[0.06] text-brand-white ring-1 ring-inset ring-white/20 hover:bg-white/[0.11]",
  danger: "bg-red-500/15 text-red-200 ring-1 ring-inset ring-red-400/35 hover:bg-red-500/25",
  ghost: "text-brand-white/80 hover:bg-white/[0.06] hover:text-brand-white",
};

export function Btn({ variant = "primary", loading, icon, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...p}
      disabled={p.disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        btn[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function BtnLink({ to, children, variant = "secondary", icon }: { to: string; children: ReactNode; variant?: BtnVariant; icon?: ReactNode }) {
  return (
    <Link to={to} className={cn("inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors", btn[variant])}>
      {icon}
      {children}
    </Link>
  );
}

/** Chips de selección múltiple. */
export function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn(
              "min-h-9 rounded-full px-3.5 text-sm ring-1 ring-inset transition-colors",
              on ? "bg-brand-green font-semibold text-brand-blue-dark ring-brand-green" : "ring-white/25 hover:bg-white/10",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Ejecuta una acción mostrando carga, error y (opcional) éxito. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await fn();
      if (okMsg) setOk(okMsg);
      return true;
    } catch (e) {
      setError(errorMsg(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, ok, run, setError, setOk };
}
