export type Money = {
  amount: number;
  currency: string;
};

export type TrustProvided = "provided" | "missing";

export type ProductVariant = {
  variant_id: string;
  title: string;
  options: {
    color?: string;
    size?: string;
  };
  price?: Money;
  availability?: string;
};

export type ProductMedia = {
  url: string;
  alt_text?: string;
};

export type ProductAttributes = {
  material?: string;
  color?: string;
  size?: string;
  capacity?: string;
  [key: string]: string | undefined;
};

export type ProductReadiness = {
  score: number;
  missing_fields: string[];
  warnings: string[];
  suggestions: string[];
};

export type FeedLayerProduct = {
  product_id: string;
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
  readiness: ProductReadiness;
};

export type FeedLayerResult = {
  processed_at: string;
  input: {
    type: "csv" | "text" | "sample";
    product_count: number;
  };
  summary: {
    products_processed: number;
    missing_fields_total: number;
    variant_issues_total: number;
    weak_descriptions_total: number;
    missing_policies_total: number;
  };
  overall: {
    score: number;
    status: "Strong" | "Needs improvement" | "Weak" | "Not ready";
  };
  products: FeedLayerProduct[];
};

