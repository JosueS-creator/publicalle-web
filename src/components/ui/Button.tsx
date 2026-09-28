import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "btn-sweep inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-[background-color,color,box-shadow,transform] duration-300 ease-[var(--ease-drive)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-offset-4";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-green text-brand-blue-dark shadow-[0_0_0_1px_rgb(70_227_207/0.4),0_10px_30px_-10px_rgb(34_201_180/0.7)] hover:bg-brand-green-light hover:shadow-[0_0_0_1px_rgb(70_227_207/0.7),0_14px_40px_-10px_rgb(34_201_180/0.9)]",
  secondary: "bg-white/[0.04] text-brand-white ring-1 ring-inset ring-white/15 hover:bg-white/[0.09] hover:ring-white/30",
  ghost: "text-brand-white/80 hover:text-brand-white",
  light: "bg-brand-blue-dark text-brand-white hover:bg-brand-blue",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[0.95rem]",
  lg: "h-14 px-7 text-base",
};

type Common = { variant?: Variant; size?: Size; icon?: ReactNode; loading?: boolean; className?: string; children: ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  className,
  children,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} aria-busy={loading || undefined} {...rest}>
      {children}
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: Omit<Common, "loading"> & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
      {icon}
    </a>
  );
}
