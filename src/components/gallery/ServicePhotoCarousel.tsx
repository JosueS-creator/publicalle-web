import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export type GalleryImage = {
  src: string;
  alt: string;
};

type Props = {
  title: string;
  images: GalleryImage[];
};

export function ServicePhotoCarousel({ title, images }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const touchStart = useRef<number | null>(null);

  const previous = useCallback(() => {
    setActive((index) => (index - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActive((index) => (index + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length < 2 || paused || lightbox) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const timer = window.setInterval(next, 5200);
    return () => window.clearInterval(timer);
  }, [images.length, lightbox, next, paused]);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightbox, next, previous]);

  if (!images.length) return null;
  const current = images[active];

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#071326] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#43d6c2]">Experiencias reales</p>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{title}</h2>
        </div>
        <span className="font-mono text-xs tracking-widest text-white/45">{String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
      </div>

      <div
        className="group relative isolate overflow-hidden rounded-2xl bg-black/40"
        onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(delta) > 45) delta < 0 ? next() : previous();
          touchStart.current = null;
        }}
      >
        <button
          type="button"
          className="block w-full cursor-zoom-in"
          onClick={() => setLightbox(true)}
          aria-label={`Ampliar fotografía: ${current.alt}`}
        >
          <img
            key={current.src}
            src={current.src}
            alt={current.alt}
            loading="lazy"
            decoding="async"
            className="service-gallery-float h-[250px] w-full object-cover sm:h-[380px] lg:h-[460px]"
          />
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#061225]/75 px-3 py-2 text-xs font-medium text-white backdrop-blur-md transition group-hover:bg-[#061225]/95">
            <Expand className="size-3.5" aria-hidden /> Ampliar
          </span>
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={previous} aria-label="Fotografía anterior" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#061225]/75 text-white backdrop-blur-md transition hover:scale-105 hover:bg-[#061225]">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={next} aria-label="Fotografía siguiente" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#061225]/75 text-white backdrop-blur-md transition hover:scale-105 hover:bg-[#061225]">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2" aria-label="Seleccionar fotografía">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Mostrar fotografía ${index + 1}`}
              aria-current={active === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${active === index ? "w-8 bg-[#43d6c2]" : "w-2 bg-white/25 hover:bg-white/55"}`}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020711]/95 p-4 backdrop-blur-xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Fotografía ampliada"
          onClick={() => setLightbox(false)}
        >
          <button type="button" onClick={() => setLightbox(false)} aria-label="Cerrar fotografía" className="absolute right-5 top-5 z-10 grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20">
            <X className="size-5" aria-hidden />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={(event) => { event.stopPropagation(); previous(); }} aria-label="Fotografía anterior" className="absolute left-3 z-10 grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white sm:left-7">
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Fotografía siguiente" className="absolute right-3 z-10 grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white sm:right-7">
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}
          <figure className="max-h-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <img src={current.src} alt={current.alt} decoding="async" className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl" />
            <figcaption className="mt-3 text-center text-sm text-white/65">{current.alt}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
