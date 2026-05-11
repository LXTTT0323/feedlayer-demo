import type { FeedLayerProduct } from "@/types/product";
import type { OpenAIStyleFeedItem } from "@/types/report";
import { majorToMinorAmount, minorToDisplayMajor } from "@/lib/priceMinor";

/**
 * Approximate “shopping feed” style rows for preview only — not an official OpenAI Product Feed spec.
 */
export function buildOpenAIStylePreview(products: FeedLayerProduct[]): OpenAIStyleFeedItem[] {
  return products.map((p) => {
    const v0 = p.variants[0];
    const priceStr =
      v0?.price && Number.isFinite(v0.price.amount)
        ? `${minorToDisplayMajor(majorToMinorAmount(v0.price.amount, v0.price.currency), v0.price.currency).toFixed(2)} ${v0.price.currency}`
        : undefined;
    return {
      id: p.product_id,
      title: p.title,
      description: p.description,
      link: undefined,
      image_link: p.media[0]?.url,
      availability: v0?.availability as OpenAIStyleFeedItem["availability"],
      price: priceStr,
      product_type: p.category,
      brand: undefined,
    };
  });
}
