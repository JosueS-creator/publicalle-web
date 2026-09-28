/** Tipos y utilidades de mapa (sin Leaflet: se pueden importar sin cargar la librería). */
export type LatLng = { lat: number; lng: number };
export type ZonaMapa = { nombre: string; contorno: [number, number][] };

/** Parte una lista de puntos en tramos continuos (corta si pasan > 5 min o cambia de zona). */
export function tramos<T extends LatLng & { capturado_en?: string; zona?: string }>(p: T[]): LatLng[][] {
  const out: LatLng[][] = [];
  let cur: LatLng[] = [];
  p.forEach((x, i) => {
    const prev = p[i - 1];
    const corte =
      prev &&
      ((x.zona && prev.zona && x.zona !== prev.zona) ||
        (x.capturado_en && prev.capturado_en && new Date(x.capturado_en).getTime() - new Date(prev.capturado_en).getTime() > 5 * 60000));
    if (corte && cur.length) {
      out.push(cur);
      cur = [];
    }
    cur.push({ lat: x.lat, lng: x.lng });
  });
  if (cur.length) out.push(cur);
  return out;
}

