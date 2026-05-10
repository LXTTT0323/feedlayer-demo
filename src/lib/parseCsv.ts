type CsvRow = Record<string, string>;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const ALIASES: Record<string, string> = {
  productid: "product_id",
  product_id: "product_id",
  id: "product_id",
  sku: "sku",
  variant_id: "variant_id",
  variantid: "variant_id",
  product_name: "title",
  productname: "title",
  name: "title",
  title: "title",
  desc: "description",
  description: "description",
  details: "description",
  amount: "price",
  price: "price",
  cost: "price",
  currency: "currency",
  availability: "availability",
  stock: "availability",
  inventory: "availability",
  category: "category",
  product_type: "category",
  img: "image_url",
  image: "image_url",
  image_url: "image_url",
  imageurl: "image_url",
  image_alt_text: "image_alt_text",
  imagealttext: "image_alt_text",
  alt_text: "alt_text",
  alttext: "alt_text",
  colour: "color",
  color: "color",
  size: "size",
  material: "material",
  capacity: "capacity",
  listing_url: "listing_url",
  return_policy_url: "return_policy_url",
  shipping_policy_url: "shipping_policy_url",
  faq_url: "faq_url",
};

export function parseCsvToRows(csvText: string): CsvRow[] {
  const trimmed = csvText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => ALIASES[normalizeHeader(h)] ?? normalizeHeader(h));

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const row: CsvRow = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      row[key] = (cols[i] ?? "").trim();
    }
    rows.push(row);
  }
  return rows;
}

