import type { FeedLayerProduct } from "@/types/product";
import { anchoredCategorySuggestion } from "@/lib/categorySuggestions";

function isMissing(v?: string | null): boolean {
  return !v || v.trim().length === 0;
}

function looksLikeUrl(v?: string): boolean {
  if (isMissing(v)) return false;
  try {
    const u = new URL(v!);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isBroadCategory(cat?: string): boolean {
  if (isMissing(cat)) return true;
  const c = cat!.toLowerCase();
  return ["home", "accessories", "fitness", "kitchen", "lighting"].includes(c) || c.length <= 3;
}

function isAvailabilityMissing(v?: string | null): boolean {
  if (isMissing(v)) return true;
  return v === "unknown";
}

export type ValidationRollup = {
  missing_fields_total: number;
  variant_issues_total: number;
  weak_descriptions_total: number;
  /** Sum over products of missing trust slots (shipping / return / FAQ). */
  missing_policy_slots: number;
  /** Products missing at least one policy URL. */
  missing_policy_products: number;
};

export function validateProducts(
  products: Omit<FeedLayerProduct, "readiness">[],
): { products: FeedLayerProduct[]; rollup: ValidationRollup } {
  let missing_fields_total = 0;
  let variant_issues_total = 0;
  let weak_descriptions_total = 0;
  let missing_policy_slots = 0;
  let missing_policy_products = 0;

  const out: FeedLayerProduct[] = products.map((p) => {
    const missing_fields: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (isMissing(p.product_id)) missing_fields.push("product_id");
    if (isMissing(p.title)) missing_fields.push("title");
    if (isMissing(p.description)) missing_fields.push("description");
    if (isMissing(p.category)) missing_fields.push("category");
    if (!p.variants || p.variants.length === 0) missing_fields.push("variants");

    const descLen = (p.description ?? "").trim().length;
    if (descLen > 0 && descLen < 60) {
      warnings.push("description is too short");
      weak_descriptions_total += 1;
      suggestions.push("Expand the description with key features, materials, sizing, and usage context.");
    }

    if (isBroadCategory(p.category)) {
      warnings.push("category is too broad");
      const catS = anchoredCategorySuggestion(p.category, p.title, p.description);
      if (catS) suggestions.push(catS);
    }

    const attr = p.attributes ?? {};
    if (isMissing(attr.material)) {
      missing_fields.push("attributes.material");
      suggestions.push("Add a concrete material (e.g. stainless steel, TPU, ABS plastic).");
    }
    if (isMissing(attr.capacity) && /bottle|blender/i.test(`${p.title ?? ""} ${p.description ?? ""}`)) {
      missing_fields.push("attributes.capacity");
      suggestions.push("Add capacity (e.g. 450ml) for easier comparisons.");
    }

    // Variant-level checks
    if (p.variants && p.variants.length > 0) {
      for (let i = 0; i < p.variants.length; i++) {
        const v = p.variants[i]!;
        if (isMissing(v.variant_id)) missing_fields.push(`variants[${i}].variant_id`);
        if (isMissing(v.title)) missing_fields.push(`variants[${i}].title`);
        if (!v.price || !Number.isFinite(v.price.amount)) missing_fields.push(`variants[${i}].price.amount`);
        if (!v.price || isMissing(v.price.currency)) missing_fields.push(`variants[${i}].price.currency`);
        if (isAvailabilityMissing(v.availability)) {
          missing_fields.push(`variants[${i}].availability`);
          if (v.availability === "unknown") {
            warnings.push(`variants[${i}].availability not recognized from source`);
          }
        }
      }

      const hasMultiple = p.variants.length > 1;
      if (hasMultiple) {
        const optionFilled = p.variants.some((v) => !!v.options?.color || !!v.options?.size);
        if (!optionFilled) {
          warnings.push("variant options are unclear (multiple variants but no color/size options)");
          suggestions.push("Add clear variant options like color and size for each variant.");
          variant_issues_total += 1;
        }
      }

      const titles = p.variants.map((v) => (v.title ?? "").toLowerCase());
      const uniqueTitles = new Set(titles.filter((t) => t.length > 0));
      if (uniqueTitles.size !== titles.length && titles.length > 1) {
        warnings.push("variants use inconsistent or duplicate naming");
        suggestions.push("Ensure each variant title is unique and includes key option values (color/size).");
        variant_issues_total += 1;
      }
    }

    // Media checks
    if (!p.media || p.media.length === 0) {
      missing_fields.push("media[0].url");
      suggestions.push("Add at least one product image URL.");
    } else {
      const first = p.media[0]!;
      if (!looksLikeUrl(first.url)) {
        warnings.push("image URL appears invalid");
        suggestions.push("Fix image URL formatting (must be http(s) URL).");
      }
      if (isMissing(first.alt_text)) {
        missing_fields.push("media[0].alt_text");
        suggestions.push("Add image alt text (helps accessibility and AI understanding).");
      }
    }

    // Trust context — count each missing slot explicitly
    let productPolicyMissing = 0;
    if (p.trust_context.shipping_policy === "missing") {
      productPolicyMissing += 1;
      missing_policy_slots += 1;
      suggestions.push("Add a shipping policy link (trust context).");
    }
    if (p.trust_context.return_policy === "missing") {
      productPolicyMissing += 1;
      missing_policy_slots += 1;
      suggestions.push("Add a return policy link (trust context).");
    }
    if (p.trust_context.faq === "missing") {
      productPolicyMissing += 1;
      missing_policy_slots += 1;
      suggestions.push("Add an FAQ page link or common questions (trust context).");
    }
    if (productPolicyMissing > 0) missing_policy_products += 1;

    // AI-agent readiness fields
    if (!p.buyer_intent || p.buyer_intent.length === 0) {
      missing_fields.push("buyer_intent");
      suggestions.push("Add buyer intent tags (e.g. commuting, daily hydration, desk work).");
    }
    if (!p.comparison_fields || p.comparison_fields.length === 0) {
      missing_fields.push("comparison_fields");
      suggestions.push("Add comparison fields (e.g. capacity, material, insulation duration).");
    }

    missing_fields_total += missing_fields.length;

    const seen = new Set<string>();
    const uniqSuggestions = suggestions.filter((s) => {
      const k = s.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      ...p,
      readiness: {
        score: 0,
        missing_fields,
        warnings,
        suggestions: uniqSuggestions,
      },
    };
  });

  return {
    products: out,
    rollup: {
      missing_fields_total,
      variant_issues_total,
      weak_descriptions_total,
      missing_policy_slots,
      missing_policy_products,
    },
  };
}
