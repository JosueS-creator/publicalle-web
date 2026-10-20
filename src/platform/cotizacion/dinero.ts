/**
 * Aritmética monetaria exacta (enteros BigInt, sin punto flotante).
 * Replica EXACTAMENTE el cálculo de la base de datos (numeric, round half-up a 2 decimales):
 *   subtotal_concepto = round(cantidad × precio × (1 − descuento/100), 2)
 *   bruto_concepto    = round(cantidad × precio, 2)
 *   impuesto          = round(base × pct / 100, 2)
 * Escalas: cantidad y descuento con 2 decimales (×100), precio en centavos (×100).
 */

/** "1,234.50" → 123450n (escala `dec`). null si no es un número válido o tiene más decimales de los permitidos. */
export function aEscala(txt: string, dec: number): bigint | null {
  const t = txt.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return null;
  const [ent = "0", fr = ""] = t.split(".");
  if (fr.length > dec) return null;
  return BigInt(ent || "0") * 10n ** BigInt(dec) + BigInt(fr.padEnd(dec, "0") || "0");
}

/** División entera redondeando al más cercano (mitad hacia arriba); solo para valores ≥ 0. */
const divR = (n: bigint, d: bigint) => (n * 2n + d) / (2n * d);

export type LineaIn = { cantidadH: bigint; precioC: bigint; descH: bigint };
export type LineaOut = { brutoC: bigint; netoC: bigint };

export function calcLinea({ cantidadH, precioC, descH }: LineaIn): LineaOut {
  return {
    brutoC: divR(cantidadH * precioC, 100n),
    netoC: divR(cantidadH * precioC * (10000n - descH), 1_000_000n),
  };
}

export type Totales = { subtotalC: bigint; descuentoC: bigint; impuestoC: bigint; totalC: bigint };

export function calcTotales(lineas: LineaOut[], impuestoH: bigint): Totales {
  const subtotalC = lineas.reduce((a, l) => a + l.brutoC, 0n);
  const netoC = lineas.reduce((a, l) => a + l.netoC, 0n);
  const impuestoC = divR(netoC * impuestoH, 10000n);
  return { subtotalC, descuentoC: subtotalC - netoC, impuestoC, totalC: netoC + impuestoC };
}

/** Centavos → número con 2 decimales (solo para mostrar o guardar; el valor ya es exacto). */
export const centavosANumero = (c: bigint) => Number(c) / 100;

const fmtNum = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** 4063.64 → "L 4,063.64" */
export const lempiras = (n: number) => `L ${fmtNum.format(n)}`;
/** Cantidad sin ceros sobrantes: 3 → "3", 2.5 → "2.5" */
export const cantidadTxt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
export const pctTxt = (n: number) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)}%`;
