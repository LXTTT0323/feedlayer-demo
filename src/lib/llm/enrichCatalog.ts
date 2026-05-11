import { z } from "zod";
import type { FeedLayerProduct } from "@/types/product";

type DraftProduct = Omit<FeedLayerProduct, "readiness">;

const PatchSchema = z.object({
  product_id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  buyer_intent: z.array(z.string()).optional(),
  comparison_fields: z.array(z.string()).optional(),
});

const ResponseSchema = z.object({
  products: z.array(PatchSchema),
});

function llmDisabled(): boolean {
  if (process.env.FEEDLAYER_LLM_ENABLED === "0" || process.env.FEEDLAYER_LLM_ENABLED === "false") return true;
  return false;
}

function maxProducts(): number {
  const raw = process.env.FEEDLAYER_LLM_MAX_PRODUCTS;
  if (raw === "0") return 0;
  const n = raw ? Number(raw) : 100;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 100;
}

/** OpenAI model for catalog enrichment / optional validation pass (same API). Override when your org pins a stable id. */
function openAiModel(): string {
  return (process.env.FEEDLAYER_OPENAI_MODEL || "gpt-5.5").trim();
}

function buildPromptPayload(products: DraftProduct[]): unknown[] {
  const cap = maxProducts();
  return products.slice(0, cap).map((p) => ({
    product_id: p.product_id,
    title: p.title ?? "",
    description: p.description ?? "",
    category: p.category ?? "",
    buyer_intent: p.buyer_intent ?? [],
    comparison_fields: p.comparison_fields ?? [],
  }));
}

const SYSTEM = `You are a catalog data assistant for ecommerce. Return JSON ONLY matching this shape:
{"products":[{"product_id":"string","title":"string?","description":"string?","category":"string?","buyer_intent":["string"]?,"comparison_fields":["string"]?}]}

Rules:
- Only refine or fill fields using facts already implied by the input strings. Do NOT invent specs, materials, sizes, prices, or URLs.
- If a field cannot be grounded in the provided strings, omit it or leave it empty.
- buyer_intent and comparison_fields must be short phrases (2-5 words each), max 5 items each.
- Keep category aligned with the product's existing category string when present; you may append a more specific sub-segment using " / ".
`;

/**
 * Single OpenAI Chat Completions call (official API only).
 * If the API rejects json_object or the model id, the caller catches and falls back to rules.
 */
async function callOpenAiChatJson(body: string): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });
  const model = openAiModel();

  const res = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: body },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty OpenAI response");
  return text;
}

function mergePatch(base: DraftProduct, patch: z.infer<typeof PatchSchema>): DraftProduct {
  const grounded = (next?: string, prev?: string) => {
    if (!next || !next.trim()) return prev;
    const n = next.trim();
    const p = (prev ?? "").trim();
    if (p && p.length > 40 && n.length < 20 && !n.toLowerCase().includes(p.toLowerCase().slice(0, 12))) return prev;
    return n;
  };

  return {
    ...base,
    title: grounded(patch.title, base.title) ?? base.title,
    description: grounded(patch.description, base.description) ?? base.description,
    category: grounded(patch.category, base.category) ?? base.category,
    buyer_intent: patch.buyer_intent?.length ? patch.buyer_intent : base.buyer_intent,
    comparison_fields: patch.comparison_fields?.length ? patch.comparison_fields : base.comparison_fields,
  };
}

/**
 * Optional OpenAI enrichment after rule-based extraction, before validation.
 *
 * - **No `OPENAI_API_KEY`**, `FEEDLAYER_LLM_ENABLED=false`, or `FEEDLAYER_LLM_MAX_PRODUCTS=0` → returns drafts unchanged (rules only).
 * - On HTTP/model/JSON errors or schema validation failure → returns drafts unchanged (rules as fallback).
 *
 * Model: **`FEEDLAYER_OPENAI_MODEL`** (default **`gpt-5.5`**). Set when your account exposes a stable model id.
 */
export async function enrichDraftProductsWithOptionalLlm(products: DraftProduct[]): Promise<DraftProduct[]> {
  if (llmDisabled() || maxProducts() === 0 || !process.env.OPENAI_API_KEY) {
    return products;
  }

  try {
    const payload = JSON.stringify({ products: buildPromptPayload(products) }, null, 0);
    const raw = await callOpenAiChatJson(payload);

    const parsed = ResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return products;

    const byId = new Map(parsed.data.products.map((p) => [p.product_id, p]));
    return products.map((p) => {
      const patch = byId.get(p.product_id);
      if (!patch) return p;
      return mergePatch(p, patch);
    });
  } catch {
    return products;
  }
}
