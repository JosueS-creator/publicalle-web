import { useEffect, useState } from "react";
import { Crosshair, MapPin, Search, X } from "lucide-react";
import { hasSupabase, supabaseConfig } from "@/config/backend";
import { Mapa } from "@/platform/MapaLazy";
import type { ZonaMapa } from "@/platform/mapaUtil";
import { cn } from "@/lib/cn";

export const RADIOS = [1, 2, 3, 5] as const;
type Punto = { lat: number; lng: number };
type Resultado = { lat: string; lon: string; display_name: string };

const dentroHN = (p: Punto) => p.lat >= 12.9 && p.lat <= 16.6 && p.lng >= -89.5 && p.lng <= -83.1;

/**
 * Paso "Territorio" del brief: ubicar el negocio y elegir un radio y/o zonas dibujadas.
 * El mapa (Leaflet) solo se descarga si el cliente lo abre.
 */
export function MapaBrief({
  ubicacion, radioKm, zonas, referencia, onChange,
}: {
  ubicacion: Punto | null;
  radioKm: number;
  zonas: string[];
  referencia: string;
  onChange: (v: { ubicacion?: Punto | null; radioKm?: number; zonas?: string[]; referencia?: string }) => void;
}) {
  const [abierto, setAbierto] = useState(!!ubicacion || zonas.length > 0);
  const [catalogo, setCatalogo] = useState<(ZonaMapa & { ciudad: string | null })[]>([]);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Zonas dibujadas por Publicalle (lectura pública)
  useEffect(() => {
    if (!abierto || !hasSupabase) return;
    fetch(`${supabaseConfig.url}/rest/v1/zonas?select=nombre,ciudad,contorno&nombre=not.like.Radio*&order=nombre`, {
      headers: { apikey: supabaseConfig.anonKey, Authorization: `Bearer ${supabaseConfig.anonKey}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCatalogo)
      .catch(() => setCatalogo([]));
  }, [abierto]);

  const fijar = (p: Punto, ref?: string) => {
    if (!dentroHN(p)) return setAviso("Ese punto está fuera de Honduras.");
    setAviso(null);
    onChange({ ubicacion: { lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) }, radioKm: radioKm || 2, ...(ref !== undefined ? { referencia: ref.slice(0, 200) } : {}) });
  };

  const miUbicacion = () => {
    if (!("geolocation" in navigator)) return setAviso("Tu navegador no permite obtener la ubicación.");
    setAviso("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (p) => fijar({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setAviso("No pudimos obtener tu ubicación. Busca la dirección o toca el mapa."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const buscar = async () => {
    if (q.trim().length < 3) return;
    setBuscando(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=hn&limit=5&accept-language=es&q=${encodeURIComponent(q.trim())}`);
      const data: Resultado[] = r.ok ? await r.json() : [];
      setResultados(data);
      if (!data.length) setAviso("No encontramos esa dirección. Prueba con la colonia o un punto de referencia, o toca el mapa.");
      else setAviso(null);
    } catch {
      setAviso("No se pudo buscar ahora. Toca el mapa para ubicar tu negocio.");
    } finally {
      setBuscando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 text-[0.95rem] font-semibold text-brand-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/[0.08] hover:ring-brand-green/60"
      >
        <MapPin className="size-5 text-brand-green" aria-hidden />
        Ubicar mi negocio y elegir zonas en el mapa
        <span className="text-xs font-normal text-brand-white/60">(opcional)</span>
      </button>
    );
  }

  const toggleZona = (n: string) => onChange({ zonas: zonas.includes(n) ? zonas.filter((z) => z !== n) : [...zonas, n] });

  return (
    <div className="grid gap-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/15">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Tu negocio en el mapa</p>
          <p className="text-sm text-brand-white/75">Toca el mapa donde está tu negocio, usa tu ubicación o busca la dirección. Luego puedes arrastrar el pin.</p>
        </div>
        <button type="button" onClick={() => { setAbierto(false); onChange({ ubicacion: null, radioKm: 0, zonas: [], referencia: "" }); }} className="grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-white/20 hover:bg-white/10" aria-label="Quitar mapa">
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-2 sm:flex sm:flex-row-reverse">
        {/* div (no form): el brief ya es un <form> y no se pueden anidar */}
        <div className="flex min-w-0 gap-2 sm:flex-1" role="search">
          <label className="sr-only" htmlFor="brief-buscar">Buscar dirección</label>
          <input id="brief-buscar" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }} placeholder="Buscar: colonia, calle o referencia" className="min-h-11 min-w-0 flex-1 rounded-full bg-white/[0.06] px-4 text-sm text-brand-white ring-1 ring-inset ring-white/20 placeholder:text-brand-white/55 focus:outline-none focus:ring-2 focus:ring-brand-green" />
          <button type="button" onClick={buscar} disabled={buscando} className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-green text-brand-blue-dark disabled:opacity-50" aria-label="Buscar">
            <Search className="size-4" aria-hidden />
          </button>
        </div>
        <button type="button" onClick={miUbicacion} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm ring-1 ring-inset ring-white/25 hover:bg-white/10">
          <Crosshair className="size-4" aria-hidden /> Usar mi ubicación
        </button>
      </div>
      {resultados.length > 0 && (
        <ul className="grid gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/10">
          {resultados.map((r) => (
            <li key={r.lat + r.lon}>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10" onClick={() => { fijar({ lat: Number(r.lat), lng: Number(r.lon) }, r.display_name); setResultados([]); }}>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {aviso && <p className="text-sm text-[#ffd48a]" role="status">{aviso}</p>}
      {ubicacion && (
        <p className="text-sm text-brand-green-light">
          <MapPin className="mr-1 inline size-4" aria-hidden />
          {referencia || "Negocio ubicado"} · arrastra el pin para ajustarlo.
        </p>
      )}

      <Mapa
        alto={340}
        etiqueta="Mapa para ubicar tu negocio y elegir zonas"
        zonas={catalogo}
        seleccionadas={zonas}
        onZonaClick={toggleZona}
        onClick={(p) => fijar(p)}
        pin={ubicacion}
        onPinMove={(p) => fijar(p)}
        circulo={ubicacion && radioKm ? { ...ubicacion, km: radioKm } : undefined}
        centrar={ubicacion}
      />

      <div className="grid gap-2">
        <p className="text-sm font-medium text-brand-white/90">¿Qué tan lejos de tu negocio quieres que recorramos? (a la redonda)</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Radio alrededor del negocio">
          {RADIOS.map((r) => (
            <button key={r} type="button" disabled={!ubicacion} aria-pressed={radioKm === r} onClick={() => onChange({ radioKm: radioKm === r ? 0 : r })}
              className={cn("min-h-11 rounded-full px-4 text-[0.95rem] ring-1 ring-inset transition-colors disabled:opacity-40", radioKm === r ? "bg-brand-green font-semibold text-brand-blue-dark ring-brand-green" : "ring-white/25 hover:bg-white/10")}>
              {r} km
            </button>
          ))}
        </div>
        {!ubicacion && <p className="text-xs text-brand-white/60">Primero ubica tu negocio en el mapa.</p>}
      </div>

      {catalogo.length > 0 && (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-brand-white/90">O elige zonas (tócalas en el mapa o aquí)</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Zonas disponibles">
            {catalogo.map((z) => (
              <button key={z.nombre} type="button" aria-pressed={zonas.includes(z.nombre)} onClick={() => toggleZona(z.nombre)}
                className={cn("min-h-10 rounded-full px-3.5 text-sm ring-1 ring-inset transition-colors", zonas.includes(z.nombre) ? "bg-brand-green font-semibold text-brand-blue-dark ring-brand-green" : "ring-white/25 hover:bg-white/10")}>
                {z.nombre}{z.ciudad ? <span className="font-normal"> · {z.ciudad}</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-brand-white/60">Mapa y búsqueda: © OpenStreetMap. La ubicación solo se usa para planificar tu campaña.</p>
    </div>
  );
}
