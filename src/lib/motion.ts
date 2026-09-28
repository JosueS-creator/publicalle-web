import type { Transition, Variants } from "motion/react";

export const EASE_DRIVE = [0.22, 1, 0.36, 1] as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_DRIVE } },
};

export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

export const viewportOnce = { once: true, margin: "0px 0px -12% 0px" } as const;

export const springSoft: Transition = { type: "spring", stiffness: 120, damping: 20, mass: 0.8 };
