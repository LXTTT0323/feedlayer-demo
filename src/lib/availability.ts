/**
 * Machine-friendly availability for exports and AI-ready feed.
 */

export type MachineAvailability =
  | "in_stock"
  | "out_of_stock"
  | "preorder"
  | "backorder"
  | "discontinued"
  | "low_stock"
  | "unknown";

const SYNONYMS: Record<string, MachineAvailability> = {
  // in stock
  "in stock": "in_stock",
  instock: "in_stock",
  in_stock: "in_stock",
  available: "in_stock",
  yes: "in_stock",
  true: "in_stock",
  active: "in_stock",
  enable: "in_stock",
  有货: "in_stock",
  现货: "in_stock",
  // out of stock
  "out of stock": "out_of_stock",
  out_of_stock: "out_of_stock",
  oos: "out_of_stock",
  unavailable: "out_of_stock",
  no: "out_of_stock",
  false: "out_of_stock",
  sold_out: "out_of_stock",
  soldout: "out_of_stock",
  缺货: "out_of_stock",
  售罄: "out_of_stock",
  // preorder
  preorder: "preorder",
  "pre-order": "preorder",
  "pre order": "preorder",
  presale: "preorder",
  预售: "preorder",
  // backorder
  backorder: "backorder",
  "back order": "backorder",
  on_order: "backorder",
  订货: "backorder",
  // discontinued
  discontinued: "discontinued",
  inactive: "discontinued",
  archived: "discontinued",
  停产: "discontinued",
  // low stock
  limited: "low_stock",
  low: "low_stock",
  "low stock": "low_stock",
  low_stock: "low_stock",
  scarce: "low_stock",
  库存紧张: "low_stock",
  低库存: "low_stock",
};

export function normalizeAvailabilityMachine(raw?: string | null): MachineAvailability {
  if (!raw || !raw.trim()) return "unknown";
  const k = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const compact = k.replace(/\s+/g, "_");
  return SYNONYMS[k] ?? SYNONYMS[compact] ?? "unknown";
}
