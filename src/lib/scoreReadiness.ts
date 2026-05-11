import type { FeedLayerProduct } from "@/types/product";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isPresent(v?: string | null): boolean {
  return !!v && v.trim().length > 0;
}

function scoreProduct(p: FeedLayerProduct): number {
  let score = 0;

  // 25: Required fields completeness
  const requiredChecks = [
    isPresent(p.product_id),
    isPresent(p.title),
    isPresent(p.description),
    isPresent(p.category),
    (p.variants?.length ?? 0) > 0,
  ];
  score += (requiredChecks.filter(Boolean).length / requiredChecks.length) * 25;

  // 20: Variant clarity
  const variants = p.variants ?? [];
  if (variants.length > 0) {
    let ok = 0;
    let total = 0;
    for (const v of variants) {
      total += 5;
      if (isPresent(v.variant_id)) ok += 1;
      if (isPresent(v.title)) ok += 1;
      if (v.price && Number.isFinite(v.price.amount) && isPresent(v.price.currency)) ok += 1;
      if (isPresent(v.availability) && v.availability !== "unknown") ok += 1;
      const needsOptions = variants.length > 1;
      const hasOptions = !!v.options?.color || !!v.options?.size;
      if (!needsOptions || hasOptions) ok += 1;
    }
    score += (ok / total) * 20;
  }

  // 15: Attribute completeness
  const attrs = p.attributes ?? {};
  const attrChecks = [isPresent(attrs.material), isPresent(attrs.color), isPresent(attrs.size), isPresent(attrs.capacity)];
  score += (attrChecks.filter(Boolean).length / attrChecks.length) * 15;

  // 15: Price and availability quality
  if (variants.length > 0) {
    const priced = variants.filter((v) => !!v.price && Number.isFinite(v.price.amount) && isPresent(v.price.currency)).length;
    const avail = variants.filter((v) => isPresent(v.availability)).length;
    score += ((priced / variants.length) * 0.6 + (avail / variants.length) * 0.4) * 15;
  }

  // 10: Media quality
  if ((p.media?.length ?? 0) > 0) {
    const m = p.media[0]!;
    const hasUrl = isPresent(m.url);
    const hasAlt = isPresent(m.alt_text);
    score += ((hasUrl ? 1 : 0) * 0.7 + (hasAlt ? 1 : 0) * 0.3) * 10;
  }

  // 10: Policy / trust context
  const trust = p.trust_context;
  const trustChecks = [
    trust?.shipping_policy === "provided",
    trust?.return_policy === "provided",
    trust?.faq === "provided",
  ];
  score += (trustChecks.filter(Boolean).length / trustChecks.length) * 10;

  // 5: Buyer intent and comparison readiness
  const aiChecks = [(p.buyer_intent?.length ?? 0) > 0, (p.comparison_fields?.length ?? 0) > 0];
  score += (aiChecks.filter(Boolean).length / aiChecks.length) * 5;

  return clamp(Math.round(score), 0, 100);
}

export function scoreProducts(products: FeedLayerProduct[]): { products: FeedLayerProduct[]; overallScore: number } {
  if (products.length === 0) return { products, overallScore: 0 };
  const scored = products.map((p) => ({
    ...p,
    readiness: { ...p.readiness, score: scoreProduct(p) },
  }));
  const overall = Math.round(scored.reduce((sum, p) => sum + p.readiness.score, 0) / scored.length);
  return { products: scored, overallScore: overall };
}

export function scoreStatus(score: number): "Strong" | "Needs improvement" | "Weak" | "Not ready" {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Needs improvement";
  if (score >= 40) return "Weak";
  return "Not ready";
}

