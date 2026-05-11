import type { MachineAvailability } from "@/lib/availability";
import type { ColumnMappingSummary } from "@/lib/columnMapping";
import type { ProductAttributes, ProductMedia, ProductReadiness, ProductVariant, TrustProvided } from "@/types/product";

export type FeedInputType = "csv" | "xlsx" | "text" | "sample";

export type AiReadyVariant = {
  variant_id: string;
  title: string;
  options: { color?: string; size?: string };
  price?: {
    currency: string;
    /** Major units as in source (e.g. dollars). */
    amount_major: number;
    /** Minor units for export (e.g. cents). */
    amount_minor: number;
  };
  availability?: MachineAvailability;
};

export type AiReadyProduct = {
  product_id: string;
  title?: string;
  description?: string;
  category?: string;
  attributes: ProductAttributes;
  variants: AiReadyVariant[];
  media: ProductMedia[];
  buyer_intent: string[];
  comparison_fields: string[];
  trust_context: {
    shipping_policy: TrustProvided;
    return_policy: TrustProvided;
    faq: TrustProvided;
  };
};

export type ReadinessReportProduct = {
  product_id: string;
  title?: string;
  readiness: ProductReadiness;
  original_input: Record<string, string>;
  normalized_snapshot: {
    title?: string;
    description?: string;
    category?: string;
    attributes: ProductAttributes;
    variants: ProductVariant[];
    media: ProductMedia[];
    buyer_intent: string[];
    comparison_fields: string[];
    trust_context: {
      shipping_policy: TrustProvided;
      return_policy: TrustProvided;
      faq: TrustProvided;
    };
  };
};

export type OpenAIStyleFeedItem = {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  image_link?: string;
  availability?: MachineAvailability;
  /** Major display price string for preview only. */
  price?: string;
  product_type?: string;
  brand?: string;
};

export type FeedLayerFullReport = {
  version: "1.0";
  processed_at: string;
  input: {
    type: FeedInputType;
    product_count: number;
    /** First sheet name when XLSX; omitted for CSV/text. */
    sheet?: string;
  };
  column_mapping: ColumnMappingSummary;
  summary: {
    products_processed: number;
    variants_detected: number;
    missing_fields_count: number;
    weak_descriptions_count: number;
    /** Total missing policy slots (shipping + return + FAQ) summed across products. */
    missing_policies_count: number;
    /** Products missing at least one policy slot. */
    missing_policy_products: number;
    variant_issues_count: number;
  };
  overall: {
    score: number;
    status: "Strong" | "Needs improvement" | "Weak" | "Not ready";
  };
  ai_ready_feed: AiReadyProduct[];
  readiness_report: {
    products: ReadinessReportProduct[];
  };
  openai_style_feed_preview: {
    label: string;
    items: OpenAIStyleFeedItem[];
  };
};
