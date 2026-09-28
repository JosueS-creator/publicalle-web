import { useCallback, type PointerEvent } from "react";

/** Actualiza --mx/--my para que la tarjeta reaccione al cursor (clase .spotlight). */
export function useSpotlight<T extends HTMLElement>() {
  return useCallback((e: PointerEvent<T>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);
}
