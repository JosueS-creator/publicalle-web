import { lazy, Suspense, type ComponentProps } from "react";

const MapaReal = lazy(() => import("./Mapa"));

/** Carga Leaflet solo cuando una pantalla muestra un mapa. */
export function Mapa(props: ComponentProps<typeof MapaReal>) {
  return (
    <Suspense fallback={<div className="w-full animate-pulse rounded-xl bg-white/[0.04] ring-1 ring-inset ring-line" style={{ height: props.alto ?? 320 }} aria-hidden />}>
      <MapaReal {...props} />
    </Suspense>
  );
}
export { tramos, type LatLng, type ZonaMapa } from "./mapaUtil";
