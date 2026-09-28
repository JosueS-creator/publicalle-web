import { m } from "motion/react";
import type { ProcessStepData } from "@/types";
import { EASE_DRIVE } from "@/lib/motion";

export function ProcessStep({ step, index }: { step: ProcessStepData; index: number }) {
  return (
    <li className="relative grid grid-cols-[3.5rem_1fr] gap-5 pb-16 last:pb-0 md:grid-cols-[5rem_1fr] md:gap-8 md:pb-24">
      <div className="relative z-10 flex justify-center">
        <m.span
          className="grid size-14 place-items-center rounded-full bg-brand-blue-dark ring-4 ring-paper md:size-20"
          initial={{ scale: 0.86 }}
          whileInView={{ scale: 1 }}
          viewport={{ margin: "-45% 0px -45% 0px" }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <span className="type-data text-sm font-bold text-brand-green md:text-lg">0{index + 1}</span>
        </m.span>
      </div>
      <m.div
        initial={{ x: 24 }}
        whileInView={{ x: 0 }}
        viewport={{ once: true, margin: "-30% 0px -30% 0px" }}
        transition={{ duration: 0.8, ease: EASE_DRIVE }}
        className="pt-1 md:pt-3"
      >
        <p className="type-eyebrow text-[0.65rem] text-brand-green-deep">{step.detail}</p>
        <h3 className="type-title mt-3 text-[clamp(1.6rem,3.2vw,2.6rem)] text-brand-blue-dark">{step.title}</h3>
        <p className="mt-3 max-w-[42ch] text-lg text-muted-dark">{step.description}</p>
      </m.div>
    </li>
  );
}
