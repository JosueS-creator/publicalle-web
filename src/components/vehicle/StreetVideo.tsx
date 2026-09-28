import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = { src: string; poster: string; title: string; caption?: string; className?: string };

/** Video bajo demanda: no descarga nada hasta que el usuario pulsa play (preload="none"), siempre sin sonido. */
export function StreetVideo({ src, poster, title, caption, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  return (
    <figure className={cn("group relative overflow-hidden rounded-3xl bg-surface ring-1 ring-line", className)}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        preload="none"
        aria-label={title}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="aspect-video w-full object-cover"
      />
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-bg/95 via-brand-bg/45 to-transparent transition-opacity duration-500", playing && "opacity-40")} />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar video" : "Reproducir video"}
        className="absolute inset-0 grid place-items-center"
      >
        <span
          className={cn(
            "grid size-16 place-items-center rounded-full bg-brand-green text-brand-blue-dark shadow-[0_0_40px_rgb(34_201_180/0.6)] transition-all duration-300 group-hover:scale-110",
            playing && "scale-75 opacity-0 group-hover:opacity-100",
          )}
        >
          {playing ? <Pause className="size-6" aria-hidden /> : <Play className="ml-1 size-6" aria-hidden />}
        </span>
      </button>
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
        <span>
          <span className="block text-lg font-bold [font-stretch:112%]">{title}</span>
          {caption && <span className="type-eyebrow mt-1 block text-[0.62rem] text-brand-white/85">{caption}</span>}
        </span>
        <span className="type-data hidden rounded-full bg-black/40 px-3 py-1 text-xs text-brand-white/80 backdrop-blur sm:block">0:33 · sin audio</span>
      </figcaption>
    </figure>
  );
}
