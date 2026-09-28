import type { ReactNode } from "react";
import { m } from "motion/react";
import { Eyebrow } from "./SectionHeading";
import { reveal, stagger, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  id: string;
  index: string;
  /** Nombre de la línea: MOVE, EVENTS, PLACE, DATA. */
  line: string;
  /** Qué es la línea (etiqueta superior). */
  kicker: string;
  subtitle: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  /** "lg" a todo el ancho; "md" dentro de una columna. */
  size?: "lg" | "md";
  className?: string;
};

/** Encabezado común de las líneas del ecosistema: PUBLICALLE + nombre de línea + subtítulo. */
export function LineHeading({ id, index, line, kicker, subtitle, body, align = "left", size = "lg", className }: Props) {
  return (
    <m.header
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn("flex flex-col gap-5", align === "center" && "items-center text-center", className)}
    >
      <m.div variants={reveal}>
        <Eyebrow index={index}>{kicker}</Eyebrow>
      </m.div>
      <m.h2 id={id} variants={reveal} className="flex flex-col">
        <span className="type-eyebrow text-[0.8rem] tracking-[0.42em] text-brand-white/70">Publicalle</span>
        <span className={cn("type-display mt-2 line-title bg-[linear-gradient(100deg,var(--publicalle-green-light)_10%,var(--publicalle-green)_45%,var(--publicalle-blue-electric)_90%)] bg-clip-text pr-[0.04em] text-transparent", size === "lg" ? "text-[clamp(3.4rem,10vw,8.5rem)]" : "text-[clamp(3.2rem,9vw,5.6rem)]")}>
          {line}
        </span>
      </m.h2>
      <m.p variants={reveal} className="type-title max-w-[22ch] text-[clamp(1.5rem,3vw,2.4rem)] text-brand-white">
        {subtitle}
      </m.p>
      {body && (
        <m.p variants={reveal} className="max-w-[54ch] text-base leading-relaxed text-muted md:text-lg">
          {body}
        </m.p>
      )}
    </m.header>
  );
}
