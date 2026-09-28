import vehicleSide from "@/assets/vehicles/vehicle-side.webp";
import { PHOTO_SCREEN_RECT } from "@/assets/vehicles/silhouette";
import { LedScreen } from "./LedScreen";
import { cn } from "@/lib/cn";

type Props = {
  screenMessages?: string[];
  priority?: boolean;
  className?: string;
  alt?: string;
};

/**
 * Fotografía real del vehículo (recortada del video oficial) mirando a la derecha,
 * con la pantalla LED "viva" y sombra de contacto.
 */
export function VehiclePhoto({
  screenMessages,
  priority = false,
  className,
  alt = "Vehículo Publicalle: sedán azul con pantalla LED y parlante de perifoneo en el techo",
}: Props) {
  const r = PHOTO_SCREEN_RECT;
  return (
    <div className={cn("relative [container-type:inline-size]", className)} style={{ aspectRatio: "1209 / 577" }}>
      {/* sombra de contacto */}
      <div className="absolute inset-x-[4%] bottom-[-3%] h-[12%] rounded-[50%] bg-black/70 blur-xl" aria-hidden />
      <div className="absolute inset-x-[10%] bottom-[-1%] h-[5%] rounded-[50%] bg-brand-green/25 blur-2xl" aria-hidden />
      <img
        src={vehicleSide}
        alt={alt}
        width={1209}
        height={577}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="relative h-full w-full select-none object-contain drop-shadow-[0_30px_40px_rgb(0_0_0/0.45)]"
        draggable={false}
      />
      {screenMessages && (
        // posición exacta de la pantalla sobre la foto
        <div
          className="absolute"
          style={{ left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%` }}
        >
          <LedScreen messages={screenMessages} className="inset-0" />
        </div>
      )}
    </div>
  );
}
