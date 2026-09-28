import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type Props = { messages: string[]; interval?: number; className?: string };

/** Pantalla LED del techo: rota mensajes con textura de matriz de puntos. */
export function LedScreen({ messages, interval = 2600, className }: Props) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || messages.length < 2) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % messages.length), interval);
    return () => window.clearInterval(t);
  }, [messages.length, interval, reduce]);

  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-[3px] bg-[#04122b] shadow-[0_0_24px_rgb(34_201_180/0.55),inset_0_0_12px_rgb(0_0_0/0.6)] ring-1 ring-black/60",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_30%_0%,rgb(21_96_200/0.55),transparent_60%)]" />
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={i}
          className="absolute inset-0 grid place-items-center px-[6%] text-center"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="font-extrabold leading-[0.95] text-brand-white [font-stretch:125%] [text-shadow:0_0_6px_rgb(70_227_207/0.9)]"
            style={{ fontSize: "clamp(7px, 2.1cqw, 26px)" }}
          >
            {messages[i]}
          </span>
        </m.div>
      </AnimatePresence>
      {/* matriz de puntos LED */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_42%,rgb(2_8_20/0.3)_46%)] bg-[length:3px_3px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent" />
    </div>
  );
}
