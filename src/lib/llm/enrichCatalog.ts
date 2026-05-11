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

export type LlmProvider = "openai" | "anthropic" | "google";

function pickProvider(): LlmProvider | null {
  const forced = process.env.FEEDLAYER_LLM_PROVIDER?.toLowerCase();
  if (forced === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (forced === "google" && (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY))
    return "google";
  if (forced && forced !== "auto") return null;

  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) return "google";
  return null;
}

function maxProducts(): number {
  const raw = process.env.FEEDLAYER_LLM_MAX_PRODUCTS;
  if (raw === "0") return 0;
  const n = raw ? Number(raw) : 100;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 100;
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

async function callOpenAi(body: string): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.FEEDLAYER_OPENAI_MODEL || "gpt-4o-mini";
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

async function callAnthropic(body: string): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const model = process.env.FEEDLAYER_ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const res = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.1,
    messages: [{ role: "user", content: `${SYSTEM}\n\nINPUT:\n${body}` }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Empty Anthropic response");
  return block.text;
}

async function callGoogle(body: string): Promise<string> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing Google API key");
  const model = process.env.FEEDLAYER_GOOGLE_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM}\n\nINPUT:\n${body}` }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) throw new Error("Empty Gemini response");
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
 * Optional LLM enrichment after rules, before validation. On failure, returns drafts unchanged.
 */
export async function enrichDraftProductsWithOptionalLlm(products: DraftProduct[]): Promise<DraftProduct[]> {
  const provider = pickProvider();
  if (!provider || maxProducts() === 0) return products;

  try {
    const payload = JSON.stringify({ products: buildPromptPayload(products) }, null, 0);
    let raw: string;
    if (provider === "openai") raw = await callOpenAi(payload);
    else if (provider === "anthropic") raw = await callAnthropic(payload);
    else raw = await callGoogle(payload);

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
