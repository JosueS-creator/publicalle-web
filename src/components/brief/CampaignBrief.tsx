import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, CircleCheck, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/contact/WhatsAppButton";
import { BRIEF_POR_HORAS, briefBudgets, briefCities, briefDayMoments, briefObjectives, briefSchedules, briefServices } from "@/data/brief";
import { BRIEF_STEPS, addHours, briefSummary, emptyBrief, submitBrief, validateStep, type BriefData, type BriefErrors, type BriefResult } from "@/lib/brief";
import { cn } from "@/lib/cn";
import { MapaBrief } from "./MapaBrief";

const inputCls =
  "w-full rounded-xl bg-white/[0.06] px-4 py-3.5 text-brand-white ring-1 ring-inset ring-white/20 placeholder:text-brand-white/55 transition-[box-shadow,background-color] hover:ring-white/35 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 aria-[invalid=true]:ring-red-400/70";

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] ring-1 ring-inset transition-colors",
        selected ? "bg-brand-green font-semibold text-brand-blue-dark ring-brand-green" : "text-brand-white ring-white/25 hover:bg-white/10",
      )}
    >
      {selected && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

function Label({ htmlFor, children, optional }: { htmlFor?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-medium text-brand-white/90">
      {children}
      {optional && <span className="text-xs font-normal text-brand-white/60">Opcional</span>}
    </label>
  );
}

function Err({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-red-300">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden /> {msg}
    </p>
  );
}

/**
 * <CampaignBrief /> — brief de campaña en 5 pasos. Solo recopila información (sin precios).
 * Guarda en Supabase (tabla `solicitudes`) si está configurado; si no, prepara el mensaje de WhatsApp.
 */
export function CampaignBrief() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BriefData>(emptyBrief);
  const [errors, setErrors] = useState<BriefErrors>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BriefResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const last = BRIEF_STEPS.length - 1;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, result]);

  const set = <K extends keyof BriefData>(k: K, v: BriefData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggle = (k: "ciudades" | "servicios" | "horasMomentos", v: string) => {
    set(k, data[k].includes(v) ? data[k].filter((x) => x !== v) : [...data[k], v]);
  };
  const a11y = (k: keyof BriefData) => ({
    id: `${uid}-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
  });

  async function next() {
    const e = validateStep(step, data);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < last) return setStep(step + 1);
    setBusy(true);
    const r = await submitBrief(data);
    setBusy(false);
    setResult(r);
  }

  const restart = () => {
    setData(emptyBrief);
    setErrors({});
    setResult(null);
    setStep(0);
  };

  if (result?.ok) {
    return (
      <div className="rounded-3xl bg-surface p-6 ring-1 ring-inset ring-line md:p-10">
        <div className="flex flex-col items-start gap-5" role="status">
          <span className="grid size-14 place-items-center rounded-full bg-brand-green/15 text-brand-green">
            <CircleCheck className="size-7" aria-hidden />
          </span>
          <h3 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold tracking-tight [font-stretch:115%] focus:outline-none">
            {result.channel === "supabase" ? "¡Recibimos tu solicitud!" : "Tu solicitud está lista"}
          </h3>
          {result.folio && (
            <p className="rounded-xl bg-white/[0.05] px-4 py-3 ring-1 ring-inset ring-white/15">
              <span className="type-eyebrow block text-[0.62rem] text-brand-white/70">Número de solicitud</span>
              <span className="type-data mt-1 block text-2xl font-semibold tracking-widest text-brand-green-light">{result.folio}</span>
            </p>
          )}
          <p className="max-w-lg text-brand-white/80">
            {result.channel === "supabase"
              ? "Nuestro equipo revisará tu campaña y te contactará para afinar zonas, fechas y formatos. Si quieres adelantar la conversación, escríbenos por WhatsApp."
              : "Envíala por WhatsApp y nuestro equipo te responderá para diseñar tu campaña."}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={result.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sweep inline-flex h-12 items-center gap-2.5 rounded-full bg-brand-green px-6 font-semibold text-brand-blue-dark hover:bg-brand-green-light"
            >
              <WhatsAppIcon className="size-5" />
              {result.channel === "supabase" ? "Escribir por WhatsApp" : "Enviar por WhatsApp"}
            </a>
            <Button variant="secondary" onClick={restart} icon={<RotateCcw className="size-4" aria-hidden />}>
              Nueva solicitud
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-surface p-5 ring-1 ring-inset ring-line md:p-8">
      {/* Progreso: paradas de una ruta */}
      <ol className="flex items-center" aria-label="Pasos del brief">
        {BRIEF_STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s} className={cn("flex items-center", i < last && "flex-1")} aria-current={current ? "step" : undefined}>
              <span className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-sm font-bold ring-2 transition-colors",
                    done && "bg-brand-green text-brand-blue-dark ring-brand-green",
                    current && "bg-brand-blue-dark text-brand-green-light ring-brand-green",
                    !done && !current && "bg-transparent text-brand-white/60 ring-white/20",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn("hidden text-xs sm:block", current ? "font-semibold text-brand-white" : "text-brand-white/65")}>{s}</span>
              </span>
              {i < last && (
                <span
                  className={cn(
                    "mx-1.5 h-0.5 flex-1 rounded-full sm:mb-5",
                    done ? "bg-brand-green" : "bg-[repeating-linear-gradient(90deg,rgb(148_170_220/0.35)_0_4px,transparent_4px_9px)]",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void next();
        }}
        className="mt-8"
      >
        {/* honeypot anti-spam */}
        <div className="absolute -left-[9999px]" aria-hidden>
          <label htmlFor={`${uid}-sitio`}>No llenar</label>
          <input id={`${uid}-sitio`} tabIndex={-1} autoComplete="off" value={data.sitio} onChange={(e) => set("sitio", e.target.value)} />
        </div>

        <p className="type-eyebrow text-[0.65rem] text-brand-green-light">
          Paso {step + 1} de {BRIEF_STEPS.length}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <m.fieldset
            key={step}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            disabled={busy}
            className="mt-2 grid gap-6"
          >
            {step === 0 && (
              <>
                <legend className="contents">
                  <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight [font-stretch:112%] focus:outline-none">
                    ¿Qué quieres lograr?
                  </h3>
                </legend>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Objetivo" aria-describedby={errors.objetivo ? `${uid}-objetivo-err` : undefined}>
                  {briefObjectives.map((o) => (
                    <Chip key={o} selected={data.objetivo === o} onClick={() => set("objetivo", o)}>
                      {o}
                    </Chip>
                  ))}
                </div>
                <Err id={`${uid}-objetivo-err`} msg={errors.objetivo} />
                {data.objetivo === "Otro" && (
                  <div className="grid gap-2">
                    <Label htmlFor={`${uid}-objetivoOtro`}>Cuéntanos tu objetivo</Label>
                    <input {...a11y("objetivoOtro")} className={inputCls} value={data.objetivoOtro} maxLength={80} onChange={(e) => set("objetivoOtro", e.target.value)} />
                    <Err id={`${uid}-objetivoOtro-err`} msg={errors.objetivoOtro} />
                  </div>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <legend className="contents">
                  <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight [font-stretch:112%] focus:outline-none">
                    ¿Dónde quieres tu campaña?
                  </h3>
                </legend>
                <div className="grid gap-3">
                  <p className="text-sm text-brand-white/80">Elige una o varias ciudades. Tenemos cobertura en toda Honduras.</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Ciudades" aria-describedby={errors.ciudades ? `${uid}-ciudades-err` : undefined}>
                    {briefCities.map((c) => (
                      <Chip key={c} selected={data.ciudades.includes(c)} onClick={() => toggle("ciudades", c)}>
                        {c}
                      </Chip>
                    ))}
                  </div>
                  <Err id={`${uid}-ciudades-err`} msg={errors.ciudades} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${uid}-ciudadOtra`} optional>
                    Otra ciudad o municipio
                  </Label>
                  <input {...a11y("ciudadOtra")} className={inputCls} value={data.ciudadOtra} maxLength={80} onChange={(e) => set("ciudadOtra", e.target.value)} placeholder="Escribe la ciudad" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${uid}-zonas`} optional>
                    Zonas, colonias o puntos específicos
                  </Label>
                  <textarea {...a11y("zonas")} rows={3} maxLength={1000} className={cn(inputCls, "resize-y")} value={data.zonas} onChange={(e) => set("zonas", e.target.value)} placeholder="Ej.: Col. Kennedy, alrededores de mi tienda en Blvd. Morazán…" />
                </div>
                <MapaBrief
                  ubicacion={data.ubicacion}
                  radioKm={data.radioKm}
                  zonas={data.zonasElegidas}
                  referencia={data.ubicacionRef}
                  onChange={(v) =>
                    setData((d) => ({
                      ...d,
                      ...(v.ubicacion !== undefined ? { ubicacion: v.ubicacion } : {}),
                      ...(v.radioKm !== undefined ? { radioKm: v.radioKm } : {}),
                      ...(v.zonas !== undefined ? { zonasElegidas: v.zonas } : {}),
                      ...(v.referencia !== undefined ? { ubicacionRef: v.referencia } : {}),
                    }))
                  }
                />
              </>
            )}

            {step === 2 && (
              <>
                <legend className="contents">
                  <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight [font-stretch:112%] focus:outline-none">
                    ¿Qué quieres incluir?
                  </h3>
                </legend>
                <p className="-mt-2 text-sm text-brand-white/80">Puedes combinar servicios. Todas las campañas incluyen evidencias de ejecución.</p>
                {briefServices.map((l) => (
                  <div key={l.line} className="grid gap-3">
                    <p className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold [font-stretch:125%]">{l.name}</span>
                      <span className="text-sm text-brand-white/70">{l.kicker}</span>
                    </p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={`Servicios ${l.name}`}>
                      {l.options.map((o) => (
                        <Chip key={o.id} selected={data.servicios.includes(o.id)} onClick={() => toggle("servicios", o.id)}>
                          {o.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="border-t border-line pt-5">
                  <Chip selected={data.noSeguro} onClick={() => set("noSeguro", !data.noSeguro)}>
                    No estoy seguro: necesito asesoría
                  </Chip>
                </div>
                <Err id={`${uid}-servicios-err`} msg={errors.servicios} />
              </>
            )}

            {step === 3 && (
              <>
                <legend className="contents">
                  <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight [font-stretch:112%] focus:outline-none">
                    ¿Cuándo?
                  </h3>
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`${uid}-fechaInicio`}>Fecha de inicio</Label>
                    <input {...a11y("fechaInicio")} type="date" disabled={data.fechasFlexibles} className={inputCls} value={data.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)} />
                    <Err id={`${uid}-fechaInicio-err`} msg={errors.fechaInicio} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${uid}-fechaFin`} optional>
                      Fecha final
                    </Label>
                    <input {...a11y("fechaFin")} type="date" disabled={data.fechasFlexibles} min={data.fechaInicio || undefined} className={inputCls} value={data.fechaFin} onChange={(e) => set("fechaFin", e.target.value)} />
                    <Err id={`${uid}-fechaFin-err`} msg={errors.fechaFin} />
                  </div>
                </div>
                <div>
                  <Chip selected={data.fechasFlexibles} onClick={() => set("fechasFlexibles", !data.fechasFlexibles)}>
                    Fechas flexibles
                  </Chip>
                </div>
                <div className="grid gap-3">
                  <p className="text-sm font-medium text-brand-white/90">Horario aproximado</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Horario aproximado">
                    {briefSchedules.map((h) => (
                      <Chip key={h} selected={data.horario === h} onClick={() => set("horario", data.horario === h ? "" : h)}>
                        {h}
                      </Chip>
                    ))}
                  </div>
                  {data.horario === BRIEF_POR_HORAS && (
                    <div className="grid gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/15">
                      <div className="grid items-start gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor={`${uid}-horasDia`}>Horas por día</Label>
                          <input {...a11y("horasDia")} type="number" inputMode="numeric" min={1} max={16} step={1} className={inputCls} value={data.horasDia} onChange={(e) => set("horasDia", e.target.value)} placeholder="Ej.: 4" />
                          <Err id={`${uid}-horasDia-err`} msg={errors.horasDia} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`${uid}-horaDesde`} optional>
                            Hora de inicio
                          </Label>
                          <input {...a11y("horaDesde")} type="time" step={900} className={inputCls} value={data.horaDesde} onChange={(e) => set("horaDesde", e.target.value)} />
                          {data.horaDesde && Number(data.horasDia) >= 1 && Number(data.horasDia) <= 16 && (
                            <p className="text-sm text-brand-white/75">Hasta las {addHours(data.horaDesde, Number(data.horasDia))}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <p className="text-sm font-medium text-brand-white/90">¿En qué momento del día?</p>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Momento del día" aria-describedby={errors.horasMomentos ? `${uid}-horasMomentos-err` : undefined}>
                          {briefDayMoments.map((mo) => (
                            <Chip key={mo} selected={data.horasMomentos.includes(mo)} onClick={() => toggle("horasMomentos", mo)}>
                              {mo}
                            </Chip>
                          ))}
                        </div>
                        <Err id={`${uid}-horasMomentos-err`} msg={errors.horasMomentos} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <legend className="contents">
                  <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight [font-stretch:112%] focus:outline-none">
                    ¿Cómo te contactamos?
                  </h3>
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`${uid}-nombre`}>Nombre</Label>
                    <input {...a11y("nombre")} autoComplete="name" className={inputCls} value={data.nombre} maxLength={120} onChange={(e) => set("nombre", e.target.value)} />
                    <Err id={`${uid}-nombre-err`} msg={errors.nombre} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${uid}-telefono`}>Teléfono / WhatsApp</Label>
                    <input {...a11y("telefono")} type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={data.telefono} maxLength={20} onChange={(e) => set("telefono", e.target.value)} placeholder="+504 0000-0000" />
                    <Err id={`${uid}-telefono-err`} msg={errors.telefono} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${uid}-empresa`} optional>
                      Empresa o marca
                    </Label>
                    <input {...a11y("empresa")} autoComplete="organization" className={inputCls} value={data.empresa} maxLength={160} onChange={(e) => set("empresa", e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${uid}-correo`} optional>
                      Correo
                    </Label>
                    <input {...a11y("correo")} type="email" autoComplete="email" className={inputCls} value={data.correo} maxLength={160} onChange={(e) => set("correo", e.target.value)} />
                    <Err id={`${uid}-correo-err`} msg={errors.correo} />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor={`${uid}-cargo`} optional>
                      Cargo
                    </Label>
                    <input {...a11y("cargo")} autoComplete="organization-title" className={inputCls} value={data.cargo} maxLength={120} onChange={(e) => set("cargo", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-3">
                  <p className="text-sm font-medium text-brand-white/90">Presupuesto</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Presupuesto">
                    {briefBudgets.map((b) => (
                      <Chip key={b} selected={data.presupuesto === b} onClick={() => set("presupuesto", data.presupuesto === b ? "" : b)}>
                        {b}
                      </Chip>
                    ))}
                  </div>
                  {data.presupuesto === "Tengo un monto definido" && (
                    <input {...a11y("presupuestoMonto")} aria-label="Monto aproximado" className={inputCls} value={data.presupuestoMonto} maxLength={60} onChange={(e) => set("presupuestoMonto", e.target.value)} placeholder="Monto aproximado (L)" />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${uid}-comentarios`} optional>
                    ¿Algo más que debamos saber?
                  </Label>
                  <textarea {...a11y("comentarios")} rows={3} maxLength={2000} className={cn(inputCls, "resize-y")} value={data.comentarios} onChange={(e) => set("comentarios", e.target.value)} />
                </div>

                {/* Resumen */}
                <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-inset ring-white/15">
                  <p className="type-eyebrow text-[0.62rem] text-brand-green-light">Resumen de tu campaña</p>
                  <dl className="mt-3 grid gap-2 text-sm">
                    {briefSummary(data).map((r) => (
                      <div key={r.label} className="grid grid-cols-[7.5rem_1fr] gap-3">
                        <dt className="text-brand-white/65">{r.label}</dt>
                        <dd className="text-brand-white">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </>
            )}
          </m.fieldset>
        </AnimatePresence>

        {result && !result.ok && (
          <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-100 ring-1 ring-red-400/30 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <CircleAlert className="size-4 shrink-0" aria-hidden /> {result.message}
            </span>
            <a href={result.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-brand-green-light underline-offset-4 hover:underline">
              <WhatsAppIcon className="size-4" /> Enviar por WhatsApp
            </a>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setStep(step - 1)} disabled={busy} icon={<ArrowLeft className="size-4" aria-hidden />}>
              Atrás
            </Button>
          ) : (
            <span className="text-xs text-brand-white/65">Sin compromiso · 2 minutos</span>
          )}
          <Button type="submit" size="lg" loading={busy} icon={step === last ? <Send className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}>
            {step === last ? (busy ? "Enviando…" : "Enviar solicitud") : "Siguiente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
