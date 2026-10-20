import type { CotizacionDoc } from "./tipos";
import { cantidadTxt, lempiras, pctTxt } from "./dinero";

const AZUL: [number, number, number] = [10, 47, 114];
const AZUL_C: [number, number, number] = [21, 96, 200];
const TURQ: [number, number, number] = [34, 201, 180];
const TEXTO: [number, number, number] = [20, 32, 58];
const GRIS: [number, number, number] = [90, 103, 133];

/** Las fuentes estándar del PDF cubren Latin-1: se quitan emojis y símbolos fuera de ese rango. */
const limpio = (s: string | null | undefined) =>
  (s ?? "").replace(/[^\n\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g, "");

const fechaTxt = (d: string | null) => (d ? new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`)) : "");

/** Logo real (SVG de /brand) rasterizado a PNG para incrustarlo. Si falla, el PDF sale sin logo (nunca uno improvisado). */
async function logoPng(): Promise<{ data: string; ratio: number } | null> {
  try {
    const svg = await (await fetch("/brand/publicalle-logo-light.svg")).text();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    await new Promise<void>((ok, ko) => {
      img.onload = () => ok();
      img.onerror = () => ko(new Error("logo"));
      img.src = url;
    });
    const w = 1422;
    const h = 496;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    return { data: cv.toDataURL("image/png"), ratio: w / h };
  } catch {
    return null;
  }
}

/** Genera el PDF (texto real, A4) a partir de la copia congelada de la cotización. `logo` solo se inyecta en pruebas. */
export async function crearPdf(doc: CotizacionDoc, logo?: { data: string; ratio: number } | null) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210;
  const H = 297;
  const M = 16;
  const PIE = 18;
  const lg = logo === undefined ? await logoPng() : logo;

  pdf.setProperties({ title: `Cotización ${doc.numero ?? ""}`, subject: limpio(doc.proyecto), author: limpio(doc.emisor.razon_social) || "Publicalle HN" });

  // Encabezado
  const cabeceraY = M;
  if (lg) pdf.addImage(lg.data, "PNG", M, cabeceraY, 13 * lg.ratio, 13);
  else {
    pdf.setFont("helvetica", "bold").setFontSize(12).setTextColor(...AZUL);
    pdf.text(limpio(doc.emisor.razon_social) || "Publicalle HN", M, cabeceraY + 8);
  }
  pdf.setFont("helvetica", "bold").setFontSize(15).setTextColor(...AZUL);
  pdf.text("COTIZACIÓN COMERCIAL", W - M, cabeceraY + 5, { align: "right" });
  pdf.setFont("helvetica", "bold").setFontSize(10).setTextColor(...AZUL_C);
  pdf.text(`No. ${doc.numero ?? ""}${doc.version > 1 ? `  (versión ${doc.version})` : ""}`, W - M, cabeceraY + 10.5, { align: "right" });
  pdf.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS);
  const fechas = [doc.fecha_emision && `Emitida: ${fechaTxt(doc.fecha_emision)}`, doc.fecha_vencimiento && `Vence: ${fechaTxt(doc.fecha_vencimiento)}`].filter(Boolean).join("   ·   ");
  if (fechas) pdf.text(fechas, W - M, cabeceraY + 15.5, { align: "right" });
  pdf.setDrawColor(...TURQ).setLineWidth(0.6).line(M, cabeceraY + 19, W - M, cabeceraY + 19);

  // Emisor y cliente
  let y = cabeceraY + 26;
  const bloque = (titulo: string, lineas: string[], x: number, ancho: number) => {
    pdf.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...AZUL_C).text(titulo.toUpperCase(), x, y);
    let yy = y + 4.5;
    lineas.forEach((l, i) => {
      pdf.setFont("helvetica", i === 0 ? "bold" : "normal").setFontSize(9).setTextColor(...TEXTO);
      for (const s of pdf.splitTextToSize(limpio(l), ancho) as string[]) {
        pdf.text(s, x, yy);
        yy += 4.2;
      }
    });
    return yy;
  };
  const e = doc.emisor;
  const c = doc.cliente;
  const emisor = [e.razon_social, e.rtn && `RTN ${e.rtn}`, e.direccion, e.telefono, e.correo, e.sitio_web].filter(Boolean) as string[];
  const cliente = [c.nombre, c.rtn && `RTN ${c.rtn}`, c.contacto && `Contacto: ${c.contacto}`, c.telefono, c.correo].filter(Boolean) as string[];
  const colW = (W - 2 * M - 8) / 2;
  const yE = emisor.length ? bloque("De", emisor, M, colW) : y;
  const yC = bloque("Cliente", cliente, emisor.length ? M + colW + 8 : M, colW);
  y = Math.max(yE, yC) + 3;

  // Campaña
  const lugar = [...(doc.campania.ciudades ?? []), ...(doc.campania.zonas ?? [])].join(", ");
  const periodo = doc.campania.fecha_inicio ? `Período: ${fechaTxt(doc.campania.fecha_inicio)}${doc.campania.fecha_fin ? ` a ${fechaTxt(doc.campania.fecha_fin)}` : ""}` : "";
  const campLineas: string[] = [];
  if (doc.campania.objetivo) campLineas.push(...(pdf.setFontSize(8.5).splitTextToSize(limpio(doc.campania.objetivo), W - 2 * M - 8) as string[]));
  const meta = [lugar && `Cobertura: ${lugar}`, periodo].filter(Boolean).join("   ·   ");
  if (meta) campLineas.push(...(pdf.setFontSize(8).splitTextToSize(limpio(meta), W - 2 * M - 8) as string[]));
  const cajaH = 13 + campLineas.length * 4;
  pdf.setFillColor(241, 245, 251).roundedRect(M, y, W - 2 * M, cajaH, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...AZUL_C).text("CAMPAÑA", M + 4, y + 5);
  pdf.setFont("helvetica", "bold").setFontSize(10).setTextColor(...TEXTO).text(limpio(doc.proyecto), M + 4, y + 10);
  pdf.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS);
  campLineas.forEach((l, i) => pdf.text(l, M + 4, y + 14.5 + i * 4));
  y += cajaH + 6;

  // Tabla de conceptos (continúa entre páginas con encabezado repetido y sin cortar filas)
  autoTable(pdf, {
    startY: y,
    margin: { left: M, right: M, bottom: PIE + 4 },
    head: [["Concepto", "Cant.", "Unidad", "Precio unit.", "Desc.", "Subtotal"]],
    body: doc.conceptos.map((k) => [
      limpio(k.descripcion ? `${k.concepto}\n${k.descripcion}` : k.concepto),
      cantidadTxt(k.cantidad),
      limpio(k.unidad),
      lempiras(k.precio_unitario),
      k.descuento_porcentaje > 0 ? pctTxt(k.descuento_porcentaje) : "-",
      lempiras(k.subtotal),
    ]),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, textColor: TEXTO, cellPadding: { top: 2.4, bottom: 2.4, left: 2.5, right: 2.5 }, valign: "top" },
    headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [246, 248, 252] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 14 },
      2: { cellWidth: 20 },
      3: { halign: "right", cellWidth: 27 },
      4: { halign: "right", cellWidth: 14 },
      5: { halign: "right", cellWidth: 28, fontStyle: "bold" },
    },
    rowPageBreak: "avoid",
    showHead: "everyPage",
    didParseCell: (d) => {
      if (d.section === "head" && d.column.index > 0 && d.column.index !== 2) d.cell.styles.halign = "right";
    },
  });
  y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Totales: siempre juntos (si no caben, pasan completos a la página siguiente)
  const t = doc.totales;
  const filas: [string, string][] = [["Subtotal", lempiras(t.subtotal)]];
  if (t.descuento_total > 0) filas.push(["Descuentos", `- ${lempiras(t.descuento_total)}`]);
  if (t.impuesto_porcentaje > 0) filas.push([`ISV (${pctTxt(t.impuesto_porcentaje)})`, lempiras(t.impuesto_total)]);
  const totH = filas.length * 5.5 + 12;
  if (y + totH > H - PIE - 4) {
    pdf.addPage();
    y = M;
  }
  const tx = W - M - 78;
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...TEXTO);
  filas.forEach(([k, v], i) => {
    pdf.text(k, tx, y + 4 + i * 5.5);
    pdf.text(v, W - M, y + 4 + i * 5.5, { align: "right" });
  });
  const ty = y + filas.length * 5.5 + 1;
  pdf.setFillColor(223, 246, 242).roundedRect(tx - 3, ty, 81, 9.5, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold").setFontSize(11).setTextColor(...AZUL);
  pdf.text("TOTAL", tx, ty + 6.4);
  pdf.text(lempiras(t.total), W - M - 3, ty + 6.4, { align: "right" });
  y = ty + 9.5 + 8;

  // Condiciones (línea a línea; pasa a la página siguiente sin cortar renglones)
  if (doc.condiciones?.trim()) {
    const lineas = pdf.setFontSize(8.5).splitTextToSize(limpio(doc.condiciones), W - 2 * M) as string[];
    if (y + 12 > H - PIE) {
      pdf.addPage();
      y = M;
    }
    pdf.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...AZUL_C).text("CONDICIONES COMERCIALES", M, y);
    y += 5;
    pdf.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS);
    for (const l of lineas) {
      if (y > H - PIE - 3) {
        pdf.addPage();
        y = M;
      }
      pdf.text(l, M, y);
      y += 4;
    }
  }

  // Pie en todas las páginas: contacto de Publicalle (si está configurado) y numeración
  const n = pdf.getNumberOfPages();
  const contacto = [e.telefono, e.correo, e.sitio_web].filter(Boolean).map(limpio).join("   ·   ");
  for (let p = 1; p <= n; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(...TURQ).setLineWidth(0.4).line(M, H - PIE, W - M, H - PIE);
    pdf.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...GRIS);
    pdf.text(`${limpio(e.razon_social) || "Publicalle HN"}${contacto ? `   ·   ${contacto}` : ""}`, M, H - PIE + 5);
    pdf.text(`${doc.numero ?? ""}   ·   Página ${p} de ${n}`, W - M, H - PIE + 5, { align: "right" });
  }
  return pdf;
}

export async function descargarPdf(doc: CotizacionDoc) {
  const pdf = await crearPdf(doc);
  pdf.save(`${doc.numero ?? "cotizacion"}.pdf`);
}
