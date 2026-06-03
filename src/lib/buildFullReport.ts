import type { FeedLayerProduct } from "@/types/product";
import type { ColumnMappingSummary } from "@/lib/columnMapping";
import type { FeedInputType, FeedLayerFullReport, AiReadyProduct, ReadinessReportProduct } from "@/types/report";
import { majorToMinorAmount } from "@/lib/priceMinor";
import { scoreStatus } from "@/lib/scoreReadiness";
import type { CatalogAudit } from "@/lib/extractProductData";
import { buildOpenAIStylePreview } from "@/lib/openaiStyleFeed";

function stripReadiness(p: FeedLayerProduct): Omit<FeedLayerProduct, "readiness"> {
  const { readiness, ...rest } = p;
  void readiness;
  return rest;
}

function toAiReadyProduct(p: FeedLayerProduct): AiReadyProduct {
  const base = stripReadiness(p);
  return {
    ...base,
    variants: (base.variants ?? []).map((v) => ({
      variant_id: v.variant_id,
      title: v.title,
      options: v.options ?? {},
      price:
        v.price && Number.isFinite(v.price.amount)
          ? {
              currency: v.price.currency,
              amount_major: v.price.amount,
              amount_minor: majorToMinorAmount(v.price.amount, v.price.currency),
            }
          : undefined,
      availability: v.availability as AiReadyProduct["variants"][number]["availability"],
    })),
  };
}

function toReadinessRow(p: FeedLayerProduct, audit?: CatalogAudit): ReadinessReportProduct {
  const snap = stripReadiness(p);
  return {
    product_id: p.product_id,
    title: p.title,
    readiness: p.readiness,
    original_input: audit?.original_input ?? {},
    normalized_snapshot: {
      title: snap.title,
      description: snap.description,
      category: snap.category,
      attributes: snap.attributes ?? {},
      variants: snap.variants ?? [],
      media: snap.media ?? [],
      buyer_intent: snap.buyer_intent ?? [],
      comparison_fields: snap.comparison_fields ?? [],
      trust_context: snap.trust_context,
    },
  };
}

export function buildFullReport(args: {
  products: FeedLayerProduct[];
  overallScore: number;
  column_mapping: ColumnMappingSummary;
  input: { type: FeedInputType; product_count: number; sheet?: string };
  rollup: {
    missing_fields_total: number;
    variant_issues_total: number;
    weak_descriptions_total: number;
    missing_policy_slots: number;
    missing_policy_products: number;
  };
  audits: Record<string, CatalogAudit>;
}): FeedLayerFullReport {
  const { products, overallScore, column_mapping, input, rollup, audits } = args;
  const variants_detected = products.reduce((n, p) => n + (p.variants?.length ?? 0), 0);

  return {
    version: "1.5",
    processed_at: new Date().toISOString(),
    input,
    column_mapping,
    summary: {
      products_processed: products.length,
      variants_detected,
      missing_fields_count: rollup.missing_fields_total,
      weak_descriptions_count: rollup.weak_descriptions_total,
      missing_policies_count: rollup.missing_policy_slots,
      missing_policy_products: rollup.missing_policy_products,
      variant_issues_count: rollup.variant_issues_total,
    },
    overall: {
      score: overallScore,
      status: scoreStatus(overallScore),
    },
    ai_ready_feed: products.map(toAiReadyProduct),
    readiness_report: {
      products: products.map((p) => toReadinessRow(p, audits[p.product_id])),
    },
    openai_style_feed_preview: {
      label: "OpenAI-style feed preview (not an official OpenAI integration or upload format).",
      items: buildOpenAIStylePreview(products),
    },
  };
}
