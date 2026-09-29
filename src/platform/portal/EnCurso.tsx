import { useEffect } from "react";
import { Radio } from "lucide-react";
import { sb } from "../supabase";
import { fecha, servicioLabel } from "../labels";
import { Mapa, tramos, type ZonaMapa } from "../MapaLazy";
import { Badge, Card, must, useAsync } from "../ui";

const ESTADO: Record<string, [string, "green" | "amber" | "blue"]> = {
  en_curso: ["En ejecución", "green"],
  pausada: ["En pausa", "amber"],
  finalizada: ["Terminada · en verificación", "blue"],
};
const hhmm = new Intl.DateTimeFormat("es-HN", { hour: "numeric", minute: "2-digit" });

/**
 * Avance de las jornadas de hoy para el cliente.
 * No es la ubicación actual: el servidor entrega el recorrido dentro de las zonas con 15 minutos de retraso.
 */
export function EnCurso({ campaniaId, zonas }: { campaniaId: string; zonas: ZonaMapa[] }) {
  const { data, reload } = useAsync(async () => {
    const jor = must(await sb.rpc("jornadas_en_curso_cliente", { p_campania: campaniaId }));
    return Promise.all(
      jor.map(async (j) => {
        if (j.linea === "move") {
          const [r, c] = await Promise.all([sb.rpc("recorrido_en_zonas", { p_ejecucion: j.id }), sb.rpc("cobertura_jornada", { p_ejecucion: j.id })]);
          const pts = r.data ?? [];
          return { j, rutas: tramos(pts), punto: null, cobertura: c.data ?? [], ultima: pts.length ? pts[pts.length - 1].capturado_en : null };
        }
        const p = ((await sb.rpc("punto_jornada", { p_ejecucion: j.id })).data ?? [])[0] ?? null;
        return { j, rutas: [], punto: p, cobertura: [], ultima: p?.registrado_en ?? null };
      }),
    );
  }, [campaniaId]);

  useEffect(() => {
    const t = setInterval(reload, 900000); // se actualiza sola cada 15 minutos
    return () => clearInterval(t);
  }, [reload]);

  if (!data?.length) return null;

  return (
    <Card title="Jornadas en progreso" actions={<Badge tone="green"><Radio className="mr-1 size-3" aria-hidden /> Se actualiza cada 15 min</Badge>}>
      <div className="grid gap-6">
        {data.map(({ j, rutas, punto, cobertura, ultima }) => {
          const km = cobertura.reduce((a, c) => a + Number(c.km), 0);
          const [lbl, tone] = ESTADO[j.estado] ?? [j.estado, "blue"];
          const zonasJ = zonas.filter((z) => !j.zonas.length || j.zonas.includes(z.nombre));
          return (
            <article key={j.id} className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{servicioLabel(j.linea, j.servicio)} · {fecha(j.fecha)}</h3>
                <Badge tone={tone}>{lbl}</Badge>
              </div>
              <Mapa
                alto={300}
                etiqueta={`Avance: ${servicioLabel(j.linea, j.servicio)}`}
                zonas={zonasJ}
                rutas={rutas}
                puntos={punto ? [{ lat: punto.lat, lng: punto.lng, label: j.punto_nombre ?? "Punto de activación" }] : []}
              />
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {j.linea === "move" ? (
                  <>
                    <div><dt className="text-xs text-muted">Zonas recorridas</dt><dd>{cobertura.map((c) => c.zona).join(", ") || "—"}</dd></div>
                    <div><dt className="text-xs text-muted">Km en zonas</dt><dd>{km.toLocaleString("es-HN", { maximumFractionDigits: 1 })} km</dd></div>
                  </>
                ) : (
                  <div className="col-span-2"><dt className="text-xs text-muted">Lugar</dt><dd>{j.punto_nombre || "—"}</dd></div>
                )}
                <div><dt className="text-xs text-muted">Fotos recibidas</dt><dd>{j.fotos_recibidas}</dd></div>
                <div><dt className="text-xs text-muted">Actualizado hasta</dt><dd>{ultima ? hhmm.format(new Date(ultima)) : "Esperando datos"}</dd></div>
              </dl>
            </article>
          );
        })}
        <p className="text-xs text-muted">
          Por seguridad del equipo en la calle, el recorrido se muestra con 15 minutos de retraso y solo dentro de tus zonas. Las cifras finales se confirman al verificar cada jornada.
        </p>
      </div>
    </Card>
  );
}
