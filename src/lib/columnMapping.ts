/**
 * Canonical catalog columns + alias resolution for CSV/XLSX headers.
 */

export const CANONICAL_FIELDS = [
  "product_id",
  "sku",
  "title",
  "description",
  "supplier_description",
  "price",
  "currency",
  "availability",
  "category",
  "image_url",
  "image_alt_text",
  "color",
  "size",
  "material",
  "capacity",
  "listing_url",
  "return_policy_url",
  "shipping_policy_url",
  "faq_url",
  "variant_id",
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

/** Normalize a header for lookup (lowercase, underscores, strip junk). */
export function normalizeHeaderKey(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Maps normalized header -> canonical field. Multiple raw headers may map to the same canonical key.
 */
const ALIAS_TO_CANONICAL: Record<string, CanonicalField> = {
  // product id
  productid: "product_id",
  product_id: "product_id",
  id: "product_id",
  item_id: "product_id",
  parent_id: "product_id",
  shopify_product_id: "product_id",
  // sku / variant
  sku: "sku",
  item_sku: "sku",
  merchantsku: "sku",
  merchant_sku: "sku",
  variant_id: "variant_id",
  variantid: "variant_id",
  variant_code: "variant_id",
  // title
  product_name: "title",
  productname: "title",
  name: "title",
  title: "title",
  item_name: "title",
  listing_title: "title",
  // description
  desc: "description",
  description: "description",
  details: "description",
  body_html: "description",
  long_description: "description",
  web_description: "description",
  supplier_description: "supplier_description",
  supplier_desc: "supplier_description",
  vendor_description: "supplier_description",
  // price / currency
  amount: "price",
  price: "price",
  cost: "price",
  list_price: "price",
  sale_price: "price",
  compare_at_price: "price",
  currency: "currency",
  currency_code: "currency",
  iso_currency: "currency",
  // availability
  availability: "availability",
  stock: "availability",
  inventory: "availability",
  inventory_quantity: "availability",
  qty: "availability",
  quantity: "availability",
  stock_status: "availability",
  // category
  category: "category",
  product_type: "category",
  product_category: "category",
  google_product_category: "category",
  taxonomy: "category",
  // images
  img: "image_url",
  image: "image_url",
  image_url: "image_url",
  imageurl: "image_url",
  image_link: "image_url",
  primary_image: "image_url",
  image_alt_text: "image_alt_text",
  imagealttext: "image_alt_text",
  alt_text: "image_alt_text",
  alttext: "image_alt_text",
  // attributes
  colour: "color",
  color: "color",
  size: "size",
  material: "material",
  capacity: "capacity",
  volume: "capacity",
  // urls
  listing_url: "listing_url",
  product_url: "listing_url",
  url: "listing_url",
  link: "listing_url",
  return_policy_url: "return_policy_url",
  returns_policy_url: "return_policy_url",
  shipping_policy_url: "shipping_policy_url",
  faq_url: "faq_url",
};

export function mapHeaderToCanonical(rawHeader: string): CanonicalField | null {
  const k = normalizeHeaderKey(rawHeader);
  return ALIAS_TO_CANONICAL[k] ?? null;
}

export type ColumnMappingEntry = {
  canonical: CanonicalField | string;
  sources: string[];
};

export type ColumnMappingSummary = {
  fields: ColumnMappingEntry[];
};

function mergeSources(summary: Map<string, Set<string>>, canonical: string, source: string) {
  let set = summary.get(canonical);
  if (!set) {
    set = new Set();
    summary.set(canonical, set);
  }
  set.add(source);
}

/** Build mapping summary from raw header row (original strings preserved in sources). */
export function buildColumnMappingSummary(rawHeaders: string[]): ColumnMappingSummary {
  const summary = new Map<string, Set<string>>();
  for (const h of rawHeaders) {
    const trimmed = h.trim();
    if (!trimmed) continue;
    const canon = mapHeaderToCanonical(trimmed) ?? normalizeHeaderKey(trimmed);
    mergeSources(summary, canon, trimmed);
  }
  const fields: ColumnMappingEntry[] = [...summary.entries()].map(([canonical, sources]) => ({
    canonical,
    sources: [...sources],
  }));
  fields.sort((a, b) => a.canonical.localeCompare(b.canonical));
  return { fields };
}

export type TableRow = {
  /** Original header -> cell value (strings only). */
  raw: Record<string, string>;
  /** Canonical (or normalized fallback) keys used by extractors. */
  canonical: Record<string, string>;
};

/** Zip raw headers with cell values into raw record; map to canonical record. */
export function rowFromValues(rawHeaders: string[], values: string[]): TableRow {
  const raw: Record<string, string> = {};
  for (let i = 0; i < rawHeaders.length; i++) {
    const key = rawHeaders[i]?.trim();
    if (!key) continue;
    raw[key] = (values[i] ?? "").trim();
  }
  const canonical: Record<string, string> = {};
  for (let i = 0; i < rawHeaders.length; i++) {
    const orig = rawHeaders[i]?.trim();
    if (!orig) continue;
    const v = (values[i] ?? "").trim();
    const c = mapHeaderToCanonical(orig) ?? normalizeHeaderKey(orig);
    canonical[c] = v;
  }
  return { raw, canonical };
}
