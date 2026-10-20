import { lempiras, cantidadTxt, pctTxt } from "./dinero";
import type { CotizacionDoc } from "./tipos";
import { fecha } from "../labels";

const azul = "#0A2F72";
const azulClaro = "#1560C8";
const turquesa = "#22C9B4";

/** Documento de cotización (vista previa y página pública). Papel claro, apto para imprimir. */
export function Documento({ doc, borrador }: { doc: CotizacionDoc; borrador?: boolean }) {
  const e = doc.emisor;
  const c = doc.cliente;
  const emisorLineas = [e.razon_social, e.rtn && `RTN ${e.rtn}`, e.direccion, e.telefono, e.correo, e.sitio_web].filter(Boolean) as string[];
  const clienteLineas = [c.nombre, c.rtn && `RTN ${c.rtn}`, c.contacto && `Contacto: ${c.contacto}`, c.telefono, c.correo].filter(Boolean) as string[];
  const lugar = [...(doc.campania.ciudades ?? []), ...(doc.campania.zonas ?? [])];

  return (
    <article className="overflow-hidden rounded-xl bg-white text-[#14203a] shadow-xl ring-1 ring-black/10" aria-label="Cotización comercial">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${azulClaro}, ${turquesa})` }} aria-hidden />
      <div className="p-5 sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5" style={{ borderColor: turquesa }}>
          <img src="/brand/publicalle-logo-light.svg" alt="Publicalle HN" width={172} height={60} className="h-[52px] w-auto" />
          <div className="text-right">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: azul }}>COTIZACIÓN COMERCIAL</h2>
            <p className="mt-1 font-mono text-sm font-semibold" style={{ color: azulClaro }}>
              {borrador ? "BORRADOR · sin número" : doc.numero}
              {!borrador && doc.version > 1 && <span className="ml-2 text-xs text-[#5a6785]">versión {doc.version}</span>}
            </p>
            <p className="mt-1 text-xs text-[#5a6785]">
              {doc.fecha_emision ? `Emitida: ${fecha(doc.fecha_emision)}` : "Sin emitir"}
              {doc.fecha_vencimiento ? ` · Vence: ${fecha(doc.fecha_vencimiento)}` : ""}
            </p>
          </div>
        </header>

        <section className="mt-5 grid gap-5 sm:grid-cols-2">
          {emisorLineas.length > 0 && (
            <div>
              <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.16em]" style={{ color: azulClaro }}>De</h3>
              <ul className="mt-1.5 space-y-0.5 text-sm">{emisorLineas.map((l, i) => <li key={i} className={i === 0 ? "font-semibold" : ""}>{l}</li>)}</ul>
            </div>
          )}
          <div>
            <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.16em]" style={{ color: azulClaro }}>Cliente</h3>
            <ul className="mt-1.5 space-y-0.5 text-sm">{clienteLineas.map((l, i) => <li key={i} className={i === 0 ? "font-semibold" : ""}>{l}</li>)}</ul>
          </div>
        </section>

        <section className="mt-5 rounded-lg bg-[#f1f5fb] p-4">
          <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.16em]" style={{ color: azulClaro }}>Campaña</h3>
          <p className="mt-1 font-semibold">{doc.proyecto}</p>
          {doc.campania.objetivo && <p className="mt-0.5 text-sm text-[#3b4966]">{doc.campania.objetivo}</p>}
          <p className="mt-1 text-xs text-[#5a6785]">
            {lugar.length > 0 && <>Cobertura: {lugar.join(", ")}</>}
            {doc.campania.fecha_inicio && <>{lugar.length > 0 ? " · " : ""}Período: {fecha(doc.campania.fecha_inicio)}{doc.campania.fecha_fin ? ` – ${fecha(doc.campania.fecha_fin)}` : ""}</>}
          </p>
        </section>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs text-white" style={{ background: azul }}>
                <th scope="col" className="px-3 py-2 font-semibold">Concepto</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Cant.</th>
                <th scope="col" className="px-3 py-2 font-semibold">Unidad</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Precio unit.</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Desc.</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {doc.conceptos.map((k, i) => (
                <tr key={i} className={i % 2 ? "bg-[#f6f8fc]" : ""}>
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-medium">{k.concepto}</p>
                    {k.descripcion && <p className="mt-0.5 whitespace-pre-line text-xs text-[#5a6785]">{k.descripcion}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top tabular-nums">{cantidadTxt(k.cantidad)}</td>
                  <td className="px-3 py-2.5 align-top">{k.unidad}</td>
                  <td className="px-3 py-2.5 text-right align-top tabular-nums">{lempiras(k.precio_unitario)}</td>
                  <td className="px-3 py-2.5 text-right align-top tabular-nums">{k.descuento_porcentaje > 0 ? pctTxt(k.descuento_porcentaje) : "—"}</td>
                  <td className="px-3 py-2.5 text-right align-top font-semibold tabular-nums">{lempiras(k.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{lempiras(doc.totales.subtotal)}</dd></div>
          {doc.totales.descuento_total > 0 && <div className="flex justify-between"><dt>Descuentos</dt><dd className="tabular-nums">− {lempiras(doc.totales.descuento_total)}</dd></div>}
          {doc.totales.impuesto_porcentaje > 0 && <div className="flex justify-between"><dt>ISV ({pctTxt(doc.totales.impuesto_porcentaje)})</dt><dd className="tabular-nums">{lempiras(doc.totales.impuesto_total)}</dd></div>}
          <div className="flex justify-between rounded-lg px-3 py-2.5 text-base font-extrabold" style={{ background: "#dff6f2", color: azul }}>
            <dt>TOTAL</dt><dd className="tabular-nums">{lempiras(doc.totales.total)}</dd>
          </div>
        </dl>

        {doc.condiciones && (
          <section className="mt-6">
            <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.16em]" style={{ color: azulClaro }}>Condiciones comerciales</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm text-[#3b4966]">{doc.condiciones}</p>
          </section>
        )}
      </div>
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${turquesa}, ${azulClaro})` }} aria-hidden />
    </article>
  );
}
