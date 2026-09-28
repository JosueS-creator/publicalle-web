import { useCallback, useEffect, useRef, useState } from "react";
import { sb } from "../supabase";

export type Pos = { lat: number; lng: number; precision: number };

/** Distancia en metros entre dos puntos (haversine). */
export function metros(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Km de un recorrido, ignorando saltos imposibles (> 2 km entre puntos). */
export function kmRecorrido(puntos: { lat: number; lng: number }[]) {
  let m = 0;
  for (let i = 1; i < puntos.length; i++) {
    const d = metros(puntos[i - 1], puntos[i]);
    if (d < 2000) m += d;
  }
  return m / 1000;
}

/** Ubicación actual (una vez). Devuelve null si no hay permiso o no responde. */
export function ubicacion(timeout = 15000): Promise<Pos | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, precision: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 10000 },
    );
  });
}

type Punto = { ejecucion_id: string; lat: number; lng: number; precision_m: number; capturado_en: string };
export type GpsEstado = "apagado" | "buscando" | "activo" | "denegado" | "no_disponible";

const leer = (k: string): Punto[] => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? "[]");
  } catch {
    return [];
  }
};
const guardar = (k: string, v: Punto[]) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
};

/**
 * Seguimiento GPS mientras la jornada MOVE está en curso.
 * - Guarda un punto cada ~25 m o cada 60 s (precisión ≤ 80 m).
 * - Los puntos se guardan primero en el teléfono y se envían cada 20 s: si no hay señal, se reintentan.
 * - Mantiene la pantalla encendida (Wake Lock) mientras está activo.
 */
export function useGps(ejecucionId: string, activo: boolean) {
  const kCola = `pc-gps-${ejecucionId}`;
  const kKm = `pc-km-${ejecucionId}`;
  const [estado, setEstado] = useState<GpsEstado>("apagado");
  const [pendientes, setPendientes] = useState(() => leer(kCola).length);
  const [enviados, setEnviados] = useState(0);
  const [km, setKm] = useState(() => Number(localStorage.getItem(kKm) ?? 0) || 0);
  const [precision, setPrecision] = useState<number | null>(null);
  const [pantalla, setPantalla] = useState(false);
  const ultimo = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const enviando = useRef(false);

  const flush = useCallback(async () => {
    if (enviando.current) return;
    const cola = leer(kCola);
    if (!cola.length) return;
    enviando.current = true;
    try {
      for (let i = 0; i < cola.length; i += 200) {
        const lote = cola.slice(i, i + 200);
        const { error } = await sb.from("gps_puntos").insert(lote);
        if (error) throw error;
        const resto = leer(kCola).slice(lote.length);
        guardar(kCola, resto);
        setPendientes(resto.length);
        setEnviados((n) => n + lote.length);
      }
    } catch {
      /* sin señal: se reintenta en el próximo ciclo */
    } finally {
      enviando.current = false;
    }
  }, [kCola]);

  // Envío periódico (también de puntos que quedaron pendientes de una sesión anterior)
  useEffect(() => {
    flush();
    const t = setInterval(flush, 20000);
    const onOnline = () => flush();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", onOnline);
    };
  }, [flush]);

  // Captura de posiciones
  useEffect(() => {
    if (!activo) {
      setEstado("apagado");
      return;
    }
    if (!("geolocation" in navigator)) {
      setEstado("no_disponible");
      return;
    }
    setEstado("buscando");
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const acc = Math.round(p.coords.accuracy);
        setPrecision(acc);
        setEstado("activo");
        if (acc > 80) return;
        const aqui = { lat: p.coords.latitude, lng: p.coords.longitude, t: p.timestamp };
        const prev = ultimo.current;
        const d = prev ? metros(prev, aqui) : 0;
        if (prev && d < 25 && aqui.t - prev.t < 60000) return;
        if (prev && d < 2000) {
          setKm((k) => {
            const n = k + d / 1000;
            localStorage.setItem(kKm, String(n));
            return n;
          });
        }
        ultimo.current = aqui;
        const cola = [...leer(kCola), { ejecucion_id: ejecucionId, lat: aqui.lat, lng: aqui.lng, precision_m: acc, capturado_en: new Date(aqui.t).toISOString() }];
        guardar(kCola, cola);
        setPendientes(cola.length);
      },
      (e) => setEstado(e.code === e.PERMISSION_DENIED ? "denegado" : "buscando"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activo, ejecucionId, kCola, kKm]);

  // Pantalla encendida
  useEffect(() => {
    if (!activo || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const pedir = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        setPantalla(true);
        lock.addEventListener("release", () => setPantalla(false));
      } catch {
        setPantalla(false);
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        pedir();
        flush();
      }
    };
    pedir();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, [activo, flush]);

  return { estado, pendientes, enviados, km, precision, pantalla, flush };
}

/** Reduce la foto a máx. 1920 px y la convierte a JPEG (menos datos móviles y almacenamiento). */
export async function comprimir(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const max = 1920;
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file; // p. ej. HEIC en navegadores que no lo decodifican: se sube tal cual
  }
}

export async function sha256(b: Blob) {
  const buf = await crypto.subtle.digest("SHA-256", await b.arrayBuffer());
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
