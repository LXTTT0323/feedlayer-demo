import type { FeedLayerProduct, ProductMedia, ProductVariant } from "@/types/product";

type CsvRow = Record<string, string>;

function nonEmpty(v: string | undefined | null): v is string {
  return !!v && v.trim().length > 0;
}

function normalizeAvailability(raw?: string): string | undefined {
  if (!nonEmpty(raw)) return undefined;
  const v = raw.trim().toLowerCase();
  if (["in stock", "in_stock", "instock", "available", "yes", "true"].includes(v)) return "in stock";
  if (["out of stock", "out_of_stock", "oos", "no", "false"].includes(v)) return "out of stock";
  if (["preorder", "pre-order", "pre order"].includes(v)) return "preorder";
  if (["limited", "low"].includes(v)) return "limited";
  return raw.trim();
}

function looksLikeUrl(v?: string): boolean {
  if (!nonEmpty(v)) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function splitMaybeMulti(v?: string): string[] {
  if (!nonEmpty(v)) return [];
  return v
    .split(/[|/;,]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function keywordSignals(text: string) {
  const t = text.toLowerCase();
  return {
    isBottle:
      /\bbottle\b/.test(t) ||
      /\binsulated\b/.test(t) ||
      /保温杯|水杯|水壶|保温瓶/.test(text),
    isLamp: /\blamp\b/.test(t) || /台灯|落地灯|桌灯/.test(text),
    isYoga: /\byoga\b/.test(t) || /\bmat\b/.test(t) || /瑜伽垫/.test(text),
    isCase: /\bcase\b/.test(t) || /手机壳|保护壳|硅胶壳/.test(text),
    isBlender: /\bblender\b/.test(t) || /便携.*搅拌|榨汁杯|搅拌杯/.test(text),
  };
}

function buildBuyerIntent(titleDesc: string): string[] {
  const s = keywordSignals(titleDesc);
  if (s.isBottle) return ["daily hydration", "commuting"];
  if (s.isLamp) return ["desk work", "reading"];
  if (s.isYoga) return ["home workouts", "studio practice"];
  if (s.isCase) return ["everyday protection"];
  if (s.isBlender) return ["smoothies on the go", "travel"];
  return [];
}

function buildComparisonFields(titleDesc: string): string[] {
  const s = keywordSignals(titleDesc);
  if (s.isBottle) return ["capacity", "insulation duration", "leak resistance"];
  if (s.isLamp) return ["brightness levels", "color temperature", "power source"];
  if (s.isYoga) return ["thickness", "grip", "material"];
  if (s.isCase) return ["drop protection", "thickness", "compatibility"];
  if (s.isBlender) return ["capacity", "battery life", "blade power"];
  return [];
}

function normalizeCnMaterial(raw: string): string {
  const m: Record<string, string> = {
    不锈钢: "stainless steel",
    铝合金: "aluminum",
    硅胶: "silicone",
    TPU: "tpu",
    ABS塑料: "abs plastic",
    塑料: "plastic",
    橡胶: "rubber",
    玻璃: "glass",
    陶瓷: "ceramic",
  };
  return m[raw] ?? raw.toLowerCase();
}

function normalizeCnColor(raw: string): string {
  return raw;
}

function productKeyFromRow(row: CsvRow, index: number): string {
  const pid = row.product_id?.trim();
  const sku = row.sku?.trim();
  const fallback = `ROW-${index + 1}`;
  return pid || sku || fallback;
}

export function extractFromCsvRows(rows: CsvRow[]): Omit<FeedLayerProduct, "readiness">[] {
  const groups = new Map<string, CsvRow[]>();
  rows.forEach((r, i) => {
    const k = productKeyFromRow(r, i);
    const arr = groups.get(k) ?? [];
    arr.push(r);
    groups.set(k, arr);
  });

  const products: Omit<FeedLayerProduct, "readiness">[] = [];
  for (const [key, groupRows] of groups.entries()) {
    const first = groupRows[0] ?? {};
    const title = first.title?.trim() || first.product_name?.trim();
    const description = first.description?.trim();
    const category = first.category?.trim();

    const media: ProductMedia[] = [];
    if (looksLikeUrl(first.image_url)) {
      media.push({
        url: first.image_url.trim(),
        alt_text: first.image_alt_text?.trim() || first.alt_text?.trim() || "",
      });
    }

    const baseText = [title, description, category].filter(nonEmpty).join(" ");
    const buyer_intent = buildBuyerIntent(baseText);
    const comparison_fields = buildComparisonFields(baseText);

    const variants: ProductVariant[] = groupRows.map((r, idx) => {
      const variantId = (r.variant_id || r.sku || `${key}-v${idx + 1}`).trim();
      const vTitle = (r.title || title || key).trim();
      const priceAmount = nonEmpty(r.price) ? Number(r.price) : NaN;
      const currency = r.currency?.trim() || "USD";
      const price = Number.isFinite(priceAmount) ? { amount: priceAmount, currency } : undefined;
      const availability = normalizeAvailability(r.availability);
      const options = {
        color: nonEmpty(r.color) ? splitMaybeMulti(r.color)[0] : undefined,
        size: nonEmpty(r.size) ? splitMaybeMulti(r.size)[0] : undefined,
      };
      return { variant_id: variantId, title: vTitle, options, price, availability };
    });

    const attributes = {
      material: first.material?.trim() || undefined,
      color: splitMaybeMulti(first.color)[0] || undefined,
      size: splitMaybeMulti(first.size)[0] || undefined,
      capacity: first.capacity?.trim() || undefined,
    };

    const trust_context = {
      shipping_policy: looksLikeUrl(first.shipping_policy_url) ? "provided" : "missing",
      return_policy: looksLikeUrl(first.return_policy_url) ? "provided" : "missing",
      faq: looksLikeUrl(first.faq_url) ? "provided" : "missing",
    } as const;

    products.push({
      product_id: key,
      title: nonEmpty(title) ? title : undefined,
      description: nonEmpty(description) ? description : undefined,
      category: nonEmpty(category) ? category : undefined,
      attributes,
      variants,
      media,
      buyer_intent,
      comparison_fields,
      trust_context,
    });
  }

  return products;
}

export function extractFromListingText(text: string): Omit<FeedLayerProduct, "readiness">[] {
  const t = text.trim();
  const lower = t.toLowerCase();

  const cap =
    t.match(/\b(\d+(?:\.\d+)?)\s*(ml|l|oz)\b/i) ||
    t.match(/(\d+(?:\.\d+)?)\s*(毫升|升|mL|ML|ml)/) ||
    t.match(/(\d+(?:\.\d+)?)(毫升|升)/);
  const capacity = cap
    ? cap[2] === "毫升" || cap[2] === "升"
      ? `${cap[1]}${cap[2]}`
      : `${cap[1]}${String(cap[2]).toLowerCase()}`
    : undefined;

  const materialEn = t.match(/\b(stainless steel|steel|aluminum|aluminium|tpu|silicone|abs plastic|plastic|rubber)\b/i);
  const materialCn = t.match(/(不锈钢|铝合金|硅胶|TPU|ABS塑料|塑料|橡胶|玻璃|陶瓷)/);
  const material =
    materialEn?.[1]?.toLowerCase() ||
    (materialCn ? normalizeCnMaterial(materialCn[1]) : undefined);

  const colorEn = t.match(/\b(black|white|blue|green|red|pink|purple|gray|grey|silver|gold|transparent|clear)\b/i);
  const colorCn = t.match(
    /(黑色|白色|蓝色|绿色|红色|粉色|紫色|灰色|银色|金色|透明|墨绿|深蓝|浅蓝|米色|磨砂白|曜石黑|午夜黑|珍珠白)/,
  );
  const color = colorEn?.[1]?.toLowerCase() || (colorCn ? normalizeCnColor(colorCn[1]) : undefined);

  const priceUsd =
    t.match(/(?:selling price|price|now)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i) ?? t.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  const priceCny =
    t.match(/(?:售价|卖价|特价|定价|人民币|RMB|CNY)\s*[：:]?\s*￥?\s*(\d+(?:\.\d{1,2})?)/i) ??
    t.match(/￥\s*(\d+(?:\.\d{1,2})?)/) ??
    t.match(/(\d+(?:\.\d{1,2})?)\s*元(?!件)/);
  const amount = priceUsd ? Number(priceUsd[1]) : priceCny ? Number(priceCny[1]) : NaN;
  const currency = priceCny && !priceUsd ? "CNY" : "USD";
  const price = Number.isFinite(amount) ? { amount, currency } : undefined;

  const availability =
    lower.includes("preorder") || lower.includes("pre-order") || /预售|预定|订金/.test(t)
      ? "preorder"
      : /现货|有货|库存充足|In stock/i.test(t)
        ? "in stock"
        : undefined;

  const title =
    t.split(/[，,。．\.]/)[0]?.slice(0, 80) ||
    t.split(/[,.]/)[0]?.slice(0, 80) ||
    "Product from text";

  const baseText = `${title} ${t}`;
  const buyer_intent = buildBuyerIntent(baseText);
  const comparison_fields = buildComparisonFields(baseText);

  const variant: ProductVariant = {
    variant_id: "TEXT-1-V1",
    title,
    options: { color },
    price,
    availability,
  };

  const category =
    lower.includes("bottle") || /保温杯|水杯|保温瓶/.test(t) ? "Drinkware" :
    lower.includes("lamp") || /台灯|桌灯/.test(t) ? "Home / Lighting" :
    lower.includes("yoga") || /瑜伽垫/.test(t) ? "Fitness" :
    lower.includes("case") || /手机壳|保护壳/.test(t) ? "Accessories" :
    lower.includes("blender") || /搅拌|榨汁/.test(t) ? "Kitchen Appliances" :
    undefined;

  return [
    {
      product_id: "TEXT-1",
      title,
      description: t,
      category,
      attributes: { material, color, capacity },
      variants: [variant],
      media: [],
      buyer_intent,
      comparison_fields,
      trust_context: { shipping_policy: "missing", return_policy: "missing", faq: "missing" },
    },
  ];
}

