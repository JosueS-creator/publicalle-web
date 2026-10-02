import { useEffect, useMemo, useState } from "react";
import { m } from "motion/react";
import { CalendarDays, Check, CircleCheck, Clock, Info, MapPin, Newspaper, Search, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/contact/WhatsAppButton";
import { Chip, Err, Label, inputCls } from "@/components/brief/fields";
import { Mapa } from "@/platform/MapaLazy";
import { hasSupabase } from "@/config/backend";
import { cn } from "@/lib/cn";
import { reveal, viewportOnce } from "@/lib/motion";
import {
  PE, disponibilidad, diaCorto, emptyConfig, emptyContacto, enviar, hhmm, lempiras, mananaHN, miles, proximoInicio, recorrido, reproducciones, reproduccionesDia, resumen, validar,
  type Escuela, type Franja, type PEConfig, type PEContacto, type PEResult,
} from "@/lib/publiescuela";

type Resultado = { lat: string; lon: string; display_name: string };
// Tegucigalpa y alrededores (para que la búsqueda priorice la capital)
const VIEWBOX = "-87.35,14.20,-87.05,13.95";

function Paso({ n, titulo, children, id }: { n: string; titulo: string; children: React.ReactNode; id?: string }) {
  return (
    <m.section id={id} variants={reveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="relative grid gap-5 rounded-3xl bg-surface/80 p-5 ring-1 ring-inset ring-line sm:p-7" aria-labelledby={`pe-paso-${n}`}>
      <header className="flex items-baseline gap-4">
        <span className="type-data text-sm text-brand-green">{n}</span>
        <h3 id={`pe-paso-${n}`} className="text-xl font-bold tracking-tight [font-stretch:110%] sm:text-2xl">{titulo}</h3>
      </header>
      {children}
    </m.section>
  );
}

export function Configurador() {
  const [c, setC] = useState<PEConfig>(() => ({ ...emptyConfig, inicio: "" }));
  const [k, setK] = useState<PEContacto>(emptyContacto);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [franjas, setFranjas] = useState<Franja[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errDisp, setErrDisp] = useState<string | null>(null);
  const [sugerida, setSugerida] = useState<Record<string, string | null>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<PEResult | null>(null);
  const [recarga, setRecarga] = useState(0);
  const manana = mananaHN();

  const set = (p: Partial<PEConfig>) => setC((v) => ({ ...v, ...p }));
  const franja = franjas?.find((f) => f.franja_id === c.franjaId);

  // Disponibilidad real (servidor) para la fecha y duración elegidas
  useEffect(() => {
    if (!c.inicio || !hasSupabase) return;
    let vigente = true;
    setCargando(true);
    setErrDisp(null);
    setSugerida({});
    disponibilidad(c.inicio, c.dias)
      .then((f) => vigente && setFranjas(f))
      .catch(() => vigente && (setFranjas(null), setErrDisp("No pudimos consultar los horarios ahora. Puedes enviar la solicitud y te confirmamos el horario.")))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [c.inicio, c.dias, recarga]);

  // Mapa: radios, marcadores y recorrido de demostración (memo: el vehículo no se reinicia en cada render)
  const circulos = useMemo(() => c.escuelas.map((e) => ({ lat: e.lat, lng: e.lng, km: e.radioKm, label: `${e.nombre} · ${e.radioKm} km` })), [c.escuelas]);
  const puntos = useMemo(() => c.escuelas.map((e) => ({ lat: e.lat, lng: e.lng, label: e.nombre })), [c.escuelas]);
  const recs = useMemo(() => c.escuelas.map(recorrido), [c.escuelas]);
  const rutas = useMemo(() => recs.map((r) => r.ruta), [recs]);
  const paradas = useMemo(() => recs.flatMap((r) => r.paradas), [recs]);

  const agregar = (lat: number, lng: number, nombre?: string) => {
    if (c.escuelas.length >= PE.maxEscuelas) return setAviso(`Puedes agregar hasta ${PE.maxEscuelas} sedes por campaña. Si necesitas más, cuéntanos en los comentarios.`);
    if (lat < 13.9 || lat > 14.25 || lng < -87.4 || lng > -87.0) return setAviso("PubliEscuela opera en Tegucigalpa y Comayagüela. Elige una escuela dentro de la ciudad.");
    setAviso(null);
    const e: Escuela = { id: crypto.randomUUID(), nombre: (nombre ?? (c.escuelas.length ? `Sede ${c.escuelas.length + 1}` : "Mi escuela")).slice(0, 80), lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), radioKm: 1 };
    set({ escuelas: [...c.escuelas, e] });
    setErrores((x) => ({ ...x, escuelas: "" }));
  };
  const editar = (id: string, p: Partial<Escuela>) => set({ escuelas: c.escuelas.map((e) => (e.id === id ? { ...e, ...p } : e)) });

  const buscar = async () => {
    if (q.trim().length < 3) return;
    setBuscando(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=hn&limit=6&accept-language=es&viewbox=${VIEWBOX}&bounded=1&q=${encodeURIComponent(q.trim())}`);
      const d: Resultado[] = r.ok ? await r.json() : [];
      setRes(d);
      setAviso(d.length ? null : "No encontramos esa escuela. Prueba con otro nombre o la colonia, o toca el mapa donde está.");
    } catch {
      setAviso("No se pudo buscar ahora. Toca el mapa donde está la escuela.");
    } finally {
      setBuscando(false);
    }
  };

  const verProxima = async (f: Franja) => {
    setSugerida((s) => ({ ...s, [f.franja_id]: "…" }));
    const d = await proximoInicio(f.franja_id, c.dias, c.inicio || manana);
    setSugerida((s) => ({ ...s, [f.franja_id]: d }));
  };

  const filas = resumen(c, franja);

  const solicitar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validar(c, k, franja);
    if (!hasSupabase) delete e.franja;
    setErrores(e);
    if (Object.keys(e).length) {
      const primero = ["escuelas", "inicio", "franja"].find((x) => e[x]);
      document.getElementById(primero ? `pe-${primero}` : "pe-contacto")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setEnviando(true);
    const r = await enviar(c, k, franja);
    setEnviando(false);
    setResultado(r);
    if (!r.ok && r.sinCupo) setRecarga((n) => n + 1);
  };

  if (resultado?.ok) {
    return (
      <div className="mx-auto grid max-w-2xl gap-6 rounded-3xl bg-surface p-8 text-center ring-1 ring-inset ring-brand-green/40" role="status">
        <CircleCheck className="mx-auto size-12 text-brand-green" aria-hidden />
        <h3 className="type-title text-3xl">Solicitud recibida</h3>
        {resultado.folio && (
          <p className="text-muted">
            Tu número de solicitud es <span className="type-data font-semibold text-brand-white">{resultado.folio}</span>. Apartamos tu horario mientras el equipo de Publicalle revisa la campaña y te contacta.
          </p>
        )}
        <dl className="grid gap-2 text-left text-sm">
          {filas.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">{r.label}</dt>
              <dd className="text-right font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
        <a href={resultado.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/[0.06] px-6 font-semibold ring-1 ring-inset ring-white/20 hover:bg-white/10">
          <WhatsAppIcon className="size-5" /> Enviar también por WhatsApp
        </a>
        <a href="/" className="text-sm text-brand-green-light underline-offset-4 hover:underline">Volver a Publicalle</a>
      </div>
    );
  }

  return (
    <form onSubmit={solicitar} noValidate className="grid gap-8 lg:grid-cols-12 lg:items-start">
      <div className="grid gap-6 lg:col-span-8">
        {/* 01 — Escuelas */}
        <Paso n="01" titulo="Ubica tu escuela y el área alrededor" id="pe-escuelas">
          <p className="text-muted">
            Busca tu escuela o tócala en el mapa. Luego elige cuántos kilómetros alrededor recorre la unidad: los barrios y colonias de las familias que quieres atraer. Si tienes otras sedes, agrégalas igual.
          </p>
          <div className="flex gap-2" role="search">
            <label htmlFor="pe-buscar" className="sr-only">Buscar escuela</label>
            <input id="pe-buscar" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }} placeholder="Nombre de tu escuela o colonia" className={cn(inputCls, "min-h-12 rounded-full py-3")} />
            <Button type="button" onClick={buscar} loading={buscando} className="shrink-0" icon={!buscando ? <Search className="size-4" aria-hidden /> : undefined}>
              Buscar
            </Button>
          </div>
          {res.length > 0 && (
            <ul className="grid gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/10">
              {res.map((r) => (
                <li key={r.lat + r.lon}>
                  <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10" onClick={() => { agregar(Number(r.lat), Number(r.lon), r.display_name.split(",")[0]); setRes([]); setQ(""); }}>
                    <MapPin className="mr-2 inline size-4 text-brand-green" aria-hidden />
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {aviso && <p className="text-sm text-[#ffd48a]" role="status">{aviso}</p>}
          <Mapa alto={400} etiqueta="Mapa de Tegucigalpa: escuelas elegidas y recorrido" onClick={(p) => agregar(p.lat, p.lng)} circulos={circulos} puntos={puntos} rutas={rutas} paradas={paradas} vehiculo />
          <p className="flex items-center gap-2 text-xs text-muted">
            <Info className="size-3.5 shrink-0" aria-hidden /> La línea del mapa es una demostración del recorrido; los puntos amarillos, las paradas en esquinas y calles concurridas. La ruta real se define con el equipo de Publicalle según las calles de la zona.
          </p>
          {c.escuelas.length > 0 && (
            <ul className="grid gap-3">
              {c.escuelas.map((e, i) => (
                <li key={e.id} className="grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-line sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="type-data grid size-8 shrink-0 place-items-center rounded-full bg-brand-blue-dark text-xs text-brand-green-light">{i + 1}</span>
                    <label htmlFor={`pe-esc-${e.id}`} className="sr-only">Nombre de la escuela {i + 1}</label>
                    <input id={`pe-esc-${e.id}`} value={e.nombre} maxLength={80} onChange={(ev) => editar(e.id, { nombre: ev.target.value })} className={cn(inputCls, "py-2.5")} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted">Alrededor:</span>
                    {PE.radios.map((r) => (
                      <Chip key={r} selected={e.radioKm === r} onClick={() => editar(e.id, { radioKm: r })}>
                        {r} km
                      </Chip>
                    ))}
                    <button type="button" onClick={() => set({ escuelas: c.escuelas.filter((x) => x.id !== e.id) })} className="grid size-11 place-items-center rounded-full text-brand-white/70 ring-1 ring-inset ring-white/15 hover:bg-white/10 hover:text-red-300" aria-label={`Quitar ${e.nombre}`}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Err id="pe-err-escuelas" msg={errores.escuelas} />
        </Paso>

        {/* 02 — Duración */}
        <Paso n="02" titulo="Elige la duración" id="pe-inicio">
          <p className="flex items-center gap-2 font-semibold text-brand-green-light">
            <Clock className="size-5" aria-hidden /> {PE.horasDia} horas de recorrido real por día
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Días de recorrido">
            {PE.duraciones.map((d) => (
              <Chip key={d} selected={c.dias === d} onClick={() => set({ dias: d, franjaId: "" })}>
                {d} días
              </Chip>
            ))}
          </div>
          <p className="rounded-2xl bg-white/[0.03] px-4 py-3 text-sm ring-1 ring-inset ring-line">
            Tu video de {PE.videoSeg} s se reproduce en bucle: <b className="text-brand-white">{miles(reproduccionesDia())} veces por día</b> · <b className="text-brand-green-light">{miles(reproducciones(c.dias))} en {c.dias} días</b>.
          </p>
          <p className="text-sm text-muted">Mínimo {PE.duraciones[0]} días. Cuentan los días de clases del horario que elijas (normalmente de lunes a viernes, sin feriados).</p>
          <div className="grid max-w-xs gap-2">
            <Label htmlFor="pe-fecha">Fecha de inicio</Label>
            <input id="pe-fecha" type="date" min={manana} value={c.inicio} onChange={(e) => set({ inicio: e.target.value < manana ? manana : e.target.value, franjaId: "" })} className={inputCls} aria-invalid={!!errores.inicio} />
            <Err id="pe-err-inicio" msg={errores.inicio} />
          </div>
        </Paso>

        {/* 03 — Horario */}
        <Paso n="03" titulo="Elige el horario" id="pe-franja">
          {!c.inicio ? (
            <p className="flex items-center gap-2 text-muted">
              <CalendarDays className="size-5" aria-hidden /> Primero elige la fecha de inicio para ver los horarios disponibles.
            </p>
          ) : !hasSupabase ? (
            <p className="text-muted">Te confirmamos la disponibilidad del horario al recibir tu solicitud.</p>
          ) : cargando ? (
            <p className="text-muted" role="status">Consultando disponibilidad…</p>
          ) : errDisp ? (
            <p className="text-sm text-[#ffd48a]">{errDisp}</p>
          ) : !franjas?.length ? (
            <p className="text-muted">Todavía no hay horarios publicados. Envía tu solicitud y te proponemos uno.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Horarios">
              {franjas.map((f) => {
                const libre = f.sin_cupo.length === 0 && f.fechas.length === c.dias;
                const sel = c.franjaId === f.franja_id;
                const sug = sugerida[f.franja_id];
                return (
                  <div key={f.franja_id} className={cn("grid gap-3 rounded-2xl p-4 ring-1 ring-inset transition-colors", sel ? "bg-brand-green/10 ring-brand-green" : "bg-white/[0.03] ring-line", !libre && "opacity-90")}>
                    <button type="button" role="radio" aria-checked={sel} disabled={!libre} onClick={() => { set({ franjaId: f.franja_id }); setErrores((x) => ({ ...x, franja: "" })); }} className="grid gap-1 text-left disabled:cursor-not-allowed">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{f.nombre}</span>
                        {sel && <Check className="size-5 text-brand-green" aria-hidden />}
                      </span>
                      <span className="type-data text-lg text-brand-white">{hhmm(f.hora_inicio)} – {hhmm(f.hora_fin)}</span>
                      <span className={cn("text-sm", libre ? "text-brand-green-light" : "text-[#ffd48a]")}>
                        {libre ? `Disponible los ${c.dias} días` : `Sin cupo en ${f.sin_cupo.length} de ${f.fechas.length} fechas`}
                      </span>
                      {f.fechas.length > 0 && <span className="text-xs text-muted">{diaCorto(f.fechas[0])} → {diaCorto(f.fechas[f.fechas.length - 1])}</span>}
                    </button>
                    {!libre && (
                      sug && sug !== "…" ? (
                        <button type="button" onClick={() => set({ inicio: sug, franjaId: "" })} className="text-left text-sm font-semibold text-brand-green-light underline-offset-4 hover:underline">
                          Empezar el {diaCorto(sug)} (disponible) →
                        </button>
                      ) : sug === null ? (
                        <p className="text-sm text-muted">Sin fechas libres próximas en este horario.</p>
                      ) : (
                        <button type="button" onClick={() => verProxima(f)} disabled={sug === "…"} className="text-left text-sm text-brand-white/80 underline-offset-4 hover:underline">
                          {sug === "…" ? "Buscando…" : "Ver la próxima fecha disponible"}
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Err id="pe-err-franja" msg={errores.franja} />
        </Paso>

        {/* 04 — Volanteo */}
        <Paso n="04" titulo="Agrega volanteo a tu campaña">
          <button type="button" aria-pressed={c.volanteo} onClick={() => set({ volanteo: !c.volanteo, volanteoExtra: false })} className={cn("grid gap-4 rounded-2xl p-5 text-left ring-1 ring-inset transition-colors sm:grid-cols-[auto_1fr_auto] sm:items-center", c.volanteo ? "bg-brand-green/10 ring-brand-green" : "bg-white/[0.03] ring-line hover:ring-white/30")}>
            <span className="grid size-12 place-items-center rounded-xl bg-brand-blue-dark text-brand-green-light">
              <Newspaper className="size-6" aria-hidden />
            </span>
            <span className="grid gap-1">
              <span className="font-semibold">Volanteo en la zona del recorrido</span>
              <span className="text-sm text-muted">{PE.volanteo.incluye.join(" · ")}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="type-data text-xl font-semibold">{lempiras(PE.volanteo.precio)}</span>
              <span className={cn("relative h-7 w-12 rounded-full transition-colors", c.volanteo ? "bg-brand-green" : "bg-white/15")} aria-hidden>
                <span className={cn("absolute top-1 size-5 rounded-full bg-white transition-transform", c.volanteo ? "translate-x-6" : "translate-x-1")} />
              </span>
            </span>
          </button>
          {c.volanteo && (
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={c.volanteoExtra} onChange={(e) => set({ volanteoExtra: e.target.checked })} className="size-5 accent-[var(--publicalle-green)]" />
              Necesito más de 5,000 volantes (solicitar cotización)
            </label>
          )}
        </Paso>

        {/* 05 — Resumen y solicitud */}
        <Paso n="05" titulo="Revisa y solicita tu campaña" id="pe-contacto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pe-nombre">Nombre</Label>
              <input id="pe-nombre" autoComplete="name" value={k.nombre} onChange={(e) => setK({ ...k, nombre: e.target.value })} className={inputCls} aria-invalid={!!errores.nombre} aria-describedby="pe-err-nombre" />
              <Err id="pe-err-nombre" msg={errores.nombre} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pe-empresa" optional>Empresa</Label>
              <input id="pe-empresa" autoComplete="organization" value={k.empresa} onChange={(e) => setK({ ...k, empresa: e.target.value })} className={inputCls} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pe-tel">Teléfono / WhatsApp</Label>
              <input id="pe-tel" type="tel" autoComplete="tel" inputMode="tel" placeholder="+504" value={k.telefono} onChange={(e) => setK({ ...k, telefono: e.target.value })} className={inputCls} aria-invalid={!!errores.telefono} aria-describedby="pe-err-tel" />
              <Err id="pe-err-tel" msg={errores.telefono} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pe-correo" optional>Correo</Label>
              <input id="pe-correo" type="email" autoComplete="email" value={k.correo} onChange={(e) => setK({ ...k, correo: e.target.value })} className={inputCls} aria-invalid={!!errores.correo} aria-describedby="pe-err-correo" />
              <Err id="pe-err-correo" msg={errores.correo} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="pe-coment" optional>Comentarios</Label>
              <textarea id="pe-coment" rows={3} maxLength={800} value={k.comentarios} onChange={(e) => setK({ ...k, comentarios: e.target.value })} className={inputCls} placeholder="Qué quieres destacar en el video: matrícula, niveles, horarios, becas, actividades…" />
            </div>
            {/* Trampa anti-spam (invisible para personas) */}
            <input type="text" tabIndex={-1} autoComplete="off" value={k.sitio} onChange={(e) => setK({ ...k, sitio: e.target.value })} className="hidden" aria-hidden />
          </div>
          {resultado && !resultado.ok && (
            <div className="grid gap-3 rounded-2xl bg-red-500/10 p-4 text-sm ring-1 ring-inset ring-red-400/30" role="alert">
              <p>{resultado.message}</p>
              {!resultado.sinCupo && (
                <a href={resultado.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-brand-green-light">
                  <WhatsAppIcon className="size-4" /> Enviar por WhatsApp
                </a>
              )}
            </div>
          )}
          <Button type="submit" size="lg" loading={enviando} className="w-full sm:w-auto" icon={!enviando ? <Send className="size-4" aria-hidden /> : undefined}>
            Solicitar campaña
          </Button>
          <p className="text-xs text-muted">No es un pago. Al enviar, apartamos tu horario y el equipo de Publicalle te contacta con la cotización.</p>
        </Paso>
      </div>

      {/* Resumen en vivo */}
      <aside className="lg:sticky lg:top-24 lg:col-span-4" aria-label="Resumen de tu campaña">
        <div className="grid gap-4 rounded-3xl bg-[linear-gradient(160deg,rgb(10_47_114/0.55),rgb(10_19_38/0.9))] p-6 ring-1 ring-inset ring-white/10">
          <p className="type-eyebrow text-brand-green">Tu campaña</p>
          <dl className="grid gap-0.5 text-sm">
            {filas.map((r) => (
              <div key={r.label} className="flex justify-between gap-4 border-b border-white/10 py-2.5 last:border-0">
                <dt className="shrink-0 text-muted">{r.label}</dt>
                <dd className={cn("text-right font-medium", r.label === "Inversión" && "text-brand-green-light")}>{r.value}</dd>
              </div>
            ))}
          </dl>
          {c.volanteo && !c.volanteoExtra && (
            <p className="rounded-xl bg-white/[0.04] p-3 text-xs text-muted">Volanteo: {lempiras(PE.volanteo.precio)}. El recorrido se cotiza según escuelas, radio y duración.</p>
          )}
          <a href="#pe-contacto" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-blue-dark hover:bg-brand-green-light lg:hidden">
            Ir a solicitar
          </a>
        </div>
      </aside>
    </form>
  );
}
