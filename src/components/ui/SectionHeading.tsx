import type { ReactNode } from "react";
import { m } from "motion/react";
import { reveal, stagger, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow: string;
  /** Índice de sección tipo "02 / 09" (marca de recorrido). */
  index?: string;
  title: ReactNode;
  body?: ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  id?: string;
  className?: string;
};

export function Eyebrow({ children, tone = "dark", index }: { children: ReactNode; tone?: "dark" | "light"; index?: string }) {
  return (
    <p className={cn("type-eyebrow flex items-center gap-3", tone === "dark" ? "text-brand-green" : "text-brand-green-deep")}>
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-current opacity-60 animate-ping-soft" />
        <span className="relative size-2 rounded-full bg-current" />
      </span>
      {index && <span className={tone === "dark" ? "text-muted" : "text-muted-dark"}>{index}</span>}
      <span>{children}</span>
    </p>
  );
}

export function SectionHeading({ eyebrow, index, title, body, tone = "dark", align = "left", id, className }: Props) {
  return (
    <m.header
      className={cn("flex flex-col gap-5", align === "center" && "items-center text-center", className)}
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      <m.div variants={reveal}>
        <Eyebrow tone={tone} index={index}>
          {eyebrow}
        </Eyebrow>
      </m.div>
      <m.h2
        id={id}
        variants={reveal}
        className={cn(
          "type-title max-w-[18ch] text-[clamp(2rem,4.6vw,3.6rem)]",
          tone === "dark" ? "text-brand-white" : "text-brand-blue-dark",
        )}
      >
        {title}
      </m.h2>
      {body && (
        <m.p
          variants={reveal}
          className={cn("max-w-[56ch] text-base leading-relaxed md:text-lg", tone === "dark" ? "text-muted" : "text-muted-dark")}
        >
          {body}
        </m.p>
      )}
    </m.header>
  );
}
