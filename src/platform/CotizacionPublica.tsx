import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Download, Loader2 } from "lucide-react";
import { sb } from "./supabase";
import { comoDoc, type CotizacionDoc } from "./cotizacion/tipos";
import { Documento } from "./cotizacion/Documento";
import { descargarPdf } from "./cotizacion/pdf";
import { fecha } from "./labels";

type Estado = { t: "cargando" } | { t: "invalido" } | { t: "error" } | { t: "ok"; doc: CotizacionDoc; vencida: boolean };

/** Vista pública de solo lectura: se entra con el token del enlace; no requiere cuenta. */
export default function CotizacionPublica() {
  const { token = "" } = useParams();
  const [st, setSt] = useState<Estado>({ t: "cargando" });
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    document.title = "Cotización · Publicalle";
    const m = document.createElement("meta");
    m.name = "referrer";
    m.content = "no-referrer";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  useEffect(() => {
    let vivo = true;
    sb.rpc("cotizacion_publica", { p_token: token }).then(({ data, error }) => {
      if (!vivo) return;
      if (error) return setSt({ t: "error" });
      const r = data as { documento?: unknown; vencida?: boolean } | null;
      const doc = r ? comoDoc(r.documento as never) : null;
      setSt(doc ? { t: "ok", doc, vencida: !!r?.vencida } : { t: "invalido" });
    });
    return () => { vivo = false; };
  }, [token]);

  return (
    <div className="min-h-dvh bg-[#e8edf5] px-3 py-6 text-[#14203a] sm:px-6" style={{ colorScheme: "light" }}>
      <div className="mx-auto grid w-full max-w-3xl gap-4">
        {st.t === "cargando" && <p className="flex items-center gap-2 py-10 text-sm" role="status"><Loader2 className="size-4 animate-spin" aria-hidden /> Cargando cotización…</p>}
        {st.t === "invalido" && (
          <div role="alert" className="rounded-xl bg-white p-6 shadow ring-1 ring-black/10">
            <h1 className="text-lg font-bold">Enlace no disponible</h1>
            <p className="mt-1 text-sm text-[#3b4966]">Este enlace no es válido o fue revocado. Pide a Publicalle que te comparta uno nuevo.</p>
          </div>
        )}
        {st.t === "error" && (
          <div role="alert" className="rounded-xl bg-white p-6 shadow ring-1 ring-black/10">
            <h1 className="text-lg font-bold">No pudimos cargar la cotización</h1>
            <p className="mt-1 text-sm text-[#3b4966]">Revisa tu conexión e inténtalo de nuevo en un momento.</p>
          </div>
        )}
        {st.t === "ok" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-sm font-semibold text-[#3b4966]">Cotización {st.doc.numero}</h1>
              <button
                type="button"
                disabled={pdfBusy}
                onClick={async () => { setPdfBusy(true); try { await descargarPdf(st.doc); } finally { setPdfBusy(false); } }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0A2F72] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1560C8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22C9B4] disabled:opacity-60"
              >
                {pdfBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />} Descargar PDF
              </button>
            </div>
            {st.vencida && <p role="status" className="rounded-xl bg-[#fff4d6] px-4 py-3 text-sm text-[#6b4a00] ring-1 ring-[#f5b544]/50">Esta cotización venció el {fecha(st.doc.fecha_vencimiento)}. Consulta con Publicalle si sigue vigente.</p>}
            <Documento doc={st.doc} />
          </>
        )}
      </div>
    </div>
  );
}
