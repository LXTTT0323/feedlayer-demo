/**
 * Minor currency units for export (e.g. cents). ISO 4217 zero-decimal currencies use factor 1.
 */

const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function majorToMinorAmount(amountMajor: number, currency: string): number {
  const c = currency.trim().toUpperCase();
  if (!Number.isFinite(amountMajor)) return 0;
  const factor = ZERO_DECIMAL.has(c) ? 1 : 100;
  return Math.round(amountMajor * factor);
}

export function minorToDisplayMajor(amountMinor: number, currency: string): number {
  const c = currency.trim().toUpperCase();
  const factor = ZERO_DECIMAL.has(c) ? 1 : 100;
  return amountMinor / factor;
}
