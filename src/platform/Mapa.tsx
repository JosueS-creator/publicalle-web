import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { LatLng, ZonaMapa } from "./mapaUtil";

const TEGUCIGALPA: [number, number] = [14.0818, -87.2068];
const VERDE = "#22c9b4";
const AZUL = "#3aa8f0";

/**
 * Mapa (Leaflet + OpenStreetMap). Muestra zonas, recorridos y puntos.
 * - `rutas`: tramos en verde (dentro de zona). `rutasSecundarias`: tramos en gris (solo admin).
 * - `onClick`: para dibujar contornos (admin → Zonas).
 */
export default function Mapa({
  zonas = [],
  rutas = [],
  rutasSecundarias = [],
  puntos = [],
  borrador,
  onClick,
  circulo,
  circulos = [],
  vehiculo = false,
  seleccionadas,
  onZonaClick,
  centrar,
  pin,
  onPinMove,
  alto = 320,
  etiqueta = "Mapa",
}: {
  zonas?: ZonaMapa[];
  rutas?: LatLng[][];
  rutasSecundarias?: LatLng[][];
  puntos?: (LatLng & { label?: string })[];
  borrador?: [number, number][];
  onClick?: (p: LatLng) => void;
  /** Radio alrededor de un punto (brief: "a X km de mi negocio"). */
  circulo?: LatLng & { km: number };
  /** Varios radios (PubliEscuela: barrios alrededor de cada escuela). El mapa los encuadra al cambiar. */
  circulos?: (LatLng & { km: number; label?: string })[];
  /** Un vehículo recorre `rutas` en bucle (demostración de movimiento). */
  vehiculo?: boolean;
  /** Zonas resaltadas (elegidas) y clic sobre una zona. */
  seleccionadas?: string[];
  onZonaClick?: (nombre: string) => void;
  /** Mueve el mapa a este punto cuando cambia. */
  centrar?: LatLng | null;
  /** Pin arrastrable (brief: el negocio). */
  pin?: LatLng | null;
  onPinMove?: (p: LatLng) => void;
  alto?: number;
  etiqueta?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onClick);
  const ajustado = useRef(false);
  const zonaRef = useRef(onZonaClick);
  clickRef.current = onClick;
  zonaRef.current = onZonaClick;
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const pinMoveRef = useRef(onPinMove);
  pinMoveRef.current = onPinMove;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: TEGUCIGALPA, zoom: 12, scrollWheelZoom: false, attributionControl: true });
    // Mosaicos estándar de OpenStreetMap (gratis, sin llave). Se oscurecen con CSS (.pc-mapa-oscuro).
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      className: "pc-mapa-oscuro",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
    capa.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = capa.current;
    if (!m || !g) return;
    g.clearLayers();
    const b = L.latLngBounds([]);
    zonas.forEach((z) => {
      const on = seleccionadas?.includes(z.nombre);
      const pol = L.polygon(z.contorno, { color: on ? VERDE : AZUL, weight: on ? 3 : 2, fillColor: on ? VERDE : AZUL, fillOpacity: on ? 0.3 : 0.1 }).bindTooltip(z.nombre, { sticky: true });
      if (zonaRef.current)
        pol.on("click", (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          // Sin pin todavía: el primer toque ubica el negocio (aunque caiga dentro de una zona)
          if (onPinMove !== undefined && !pinRef.current) clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
          else zonaRef.current?.(z.nombre);
        });
      pol.addTo(g);
      b.extend(pol.getBounds());
    });
    if (circulo) {
      const c = L.circle(circulo, { radius: circulo.km * 1000, color: VERDE, weight: 3, fillColor: VERDE, fillOpacity: 0.18, interactive: false });
      c.addTo(g);
      b.extend(c.getBounds());
    }
    circulos.forEach((cc) => {
      const c = L.circle(cc, { radius: cc.km * 1000, color: VERDE, weight: 2, fillColor: VERDE, fillOpacity: 0.14, dashArray: "6 6", interactive: !!cc.label });
      if (cc.label) c.bindTooltip(cc.label);
      c.addTo(g);
      b.extend(c.getBounds());
    });
    rutasSecundarias.forEach((t) => t.length > 1 && L.polyline(t, { color: "#8d97ad", weight: 3, opacity: 0.6, dashArray: "4 6" }).addTo(g));
    rutas.forEach((t) => {
      if (t.length > 1) L.polyline(t, { color: VERDE, weight: 5, opacity: 0.95 }).addTo(g);
      else if (t.length === 1) L.circleMarker(t[0], { radius: 4, color: VERDE, fillOpacity: 1 }).addTo(g);
      t.forEach((p) => b.extend(p));
    });
    puntos.forEach((p) => {
      const c = L.circleMarker(p, { radius: 8, color: "#fff", weight: 2, fillColor: VERDE, fillOpacity: 1 });
      if (p.label) c.bindTooltip(p.label);
      c.addTo(g);
      b.extend(p);
    });
    if (pin) {
      const icon = L.divIcon({
        className: "",
        html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#22c9b4;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const mk = L.marker(pin, { icon, draggable: !!onPinMove, keyboard: false, title: "Tu negocio" });
      mk.on("dragend", () => {
        const ll = mk.getLatLng();
        pinMoveRef.current?.({ lat: ll.lat, lng: ll.lng });
      });
      mk.addTo(g);
    }
    if (borrador?.length) {
      if (borrador.length > 1) L.polygon(borrador, { color: VERDE, weight: 2, dashArray: "6 4", fillOpacity: 0.15 }).addTo(g);
      borrador.forEach((v, i) => L.circleMarker(v, { radius: i === borrador.length - 1 ? 6 : 4, color: VERDE, fillOpacity: 1 }).addTo(g));
    }
    // Encuadre automático solo la primera vez que hay contenido (no mientras se dibuja)
    if (b.isValid() && !ajustado.current && !onClick) {
      m.fitBounds(b.pad(0.15), { maxZoom: 16 });
      ajustado.current = true;
    }
  }, [zonas, rutas, rutasSecundarias, puntos, borrador, onClick, circulo, circulos, seleccionadas, pin, onPinMove]);

  // Varios radios: encuadrarlos todos cuando cambian (agregar o quitar una escuela, cambiar el radio)
  const firma = circulos.map((c) => `${c.lat},${c.lng},${c.km}`).join("|");
  useEffect(() => {
    if (!map.current || !circulos.length) return;
    const b = L.latLngBounds([]);
    circulos.forEach((c) => b.extend(L.latLng(c).toBounds(c.km * 2000)));
    map.current.fitBounds(b.pad(0.08), { maxZoom: 16 });
  }, [firma]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vehículo en movimiento sobre las rutas (respeta "reducir movimiento")
  useEffect(() => {
    const m = map.current;
    const camino = rutas.flat();
    if (!m || !vehiculo || camino.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const icon = L.divIcon({
      className: "",
      html: '<div style="width:18px;height:18px;border-radius:50%;background:#46e3cf;border:3px solid #050a17;box-shadow:0 0 0 6px rgba(34,201,180,.25),0 0 18px rgba(70,227,207,.9)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const mk = L.marker(camino[0], { icon, interactive: false, keyboard: false }).addTo(m);
    // largo acumulado para avanzar a velocidad constante
    const acc = [0];
    for (let i = 1; i < camino.length; i++) acc.push(acc[i - 1] + m.distance(camino[i - 1], camino[i]));
    const total = acc[acc.length - 1] || 1;
    const vuelta = Math.min(40000, Math.max(9000, total * 4)); // ms por vuelta
    let raf = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      const d = (((t - t0) % vuelta) / vuelta) * total;
      let i = 1;
      while (i < acc.length - 1 && acc[i] < d) i++;
      const f = (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1);
      const a = camino[i - 1], z = camino[i];
      mk.setLatLng([a.lat + (z.lat - a.lat) * f, a.lng + (z.lng - a.lng) * f]);
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(raf);
      mk.remove();
    };
  }, [rutas, vehiculo]);

  useEffect(() => {
    if (!map.current) return;
    // Con radio: encuadra el círculo completo; si no, centra el punto
    if (circulo) map.current.fitBounds(L.latLng(circulo).toBounds(circulo.km * 2000).pad(0.1));
    else if (centrar) map.current.setView(centrar, Math.max(map.current.getZoom(), 14));
  }, [centrar?.lat, centrar?.lng, circulo?.km]);

  return <div ref={el} role="region" aria-label={etiqueta} className="z-0 w-full overflow-hidden rounded-xl ring-1 ring-inset ring-line" style={{ height: alto }} />;
}
