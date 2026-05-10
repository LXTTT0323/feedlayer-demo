import type { FeedLayerProduct, ProductMedia, ProductVariant } from "@/types/product";

function norm(v?: string): string | undefined {
  const t = v?.trim();
  return t && t.length > 0 ? t : undefined;
}

function titleCaseColor(c?: string): string | undefined {
  const v = norm(c)?.toLowerCase();
  if (!v) return undefined;
  return v.replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeMedia(media: ProductMedia[]): ProductMedia[] {
  return media
    .map((m) => ({
      url: m.url.trim(),
      alt_text: norm(m.alt_text),
    }))
    .filter((m) => m.url.length > 0);
}

function normalizeVariants(variants: ProductVariant[], productTitle?: string): ProductVariant[] {
  return variants.map((v, idx) => {
    const color = titleCaseColor(v.options.color);
    const size = norm(v.options.size);
    const baseTitle = norm(v.title) ?? productTitle ?? `Variant ${idx + 1}`;
    const optionSuffix =
      [color ? `Color: ${color}` : null, size ? `Size: ${size}` : null].filter(Boolean).join(" • ");
    const title = optionSuffix ? `${baseTitle} (${optionSuffix})` : baseTitle;

    return {
      variant_id: norm(v.variant_id) ?? `v${idx + 1}`,
      title,
      options: { color, size },
      price: v.price,
      availability: norm(v.availability),
    };
  });
}

export function normalizeProducts(
  products: Omit<FeedLayerProduct, "readiness">[],
): Omit<FeedLayerProduct, "readiness">[] {
  return products.map((p) => {
    const title = norm(p.title);
    const description = norm(p.description);
    const category = norm(p.category);

    const attributes = {
      ...p.attributes,
      material: norm(p.attributes.material),
      color: titleCaseColor(p.attributes.color),
      size: norm(p.attributes.size),
      capacity: norm(p.attributes.capacity)?.replace(/\s+/g, ""),
    };

    return {
      ...p,
      product_id: p.product_id.trim(),
      title,
      description,
      category,
      attributes,
      variants: normalizeVariants(p.variants ?? [], title),
      media: normalizeMedia(p.media ?? []),
      buyer_intent: (p.buyer_intent ?? []).map((x) => x.trim()).filter(Boolean),
      comparison_fields: (p.comparison_fields ?? []).map((x) => x.trim()).filter(Boolean),
    };
  });
}

