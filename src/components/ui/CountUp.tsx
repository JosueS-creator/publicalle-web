import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

type Props = { value: number; /** Mínimo de dígitos (06). */ pad?: number; duration?: number; className?: string };

/** Número que cuenta desde 0 al entrar en pantalla. El valor final está en el DOM para lectores de pantalla. */
export function CountUp({ value, pad = 0, duration = 1.4, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const fmt = (n: number) => String(Math.round(n)).padStart(pad, "0");

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce) return;
    const controls = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (el.textContent = fmt(v)) });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={className} aria-label={fmt(value)}>
      {fmt(value)}
    </span>
  );
}
