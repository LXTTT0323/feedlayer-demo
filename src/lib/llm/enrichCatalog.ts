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

const SHARED_RULES = `Return JSON ONLY matching this shape:
{"products":[{"product_id":"string","title":"string?","description":"string?","category":"string?","buyer_intent":["string"]?,"comparison_fields":["string"]?}]}

Rules:
- Only refine or fill fields using facts already implied by the input strings. Do NOT invent specs, materials, sizes, prices, or URLs.
- If a field cannot be grounded in the provided strings, omit it or leave it empty.
- buyer_intent and comparison_fields must be short phrases (2-5 words each), max 5 items each.
- Keep category aligned with the product's existing category string when present; you may append a more specific sub-segment using " / ".
`;

/** Primary: Gemini 2.5 Pro (Google Generative Language API). */
const GEMINI_SYSTEM = `You are a catalog data assistant for ecommerce (primary enrichment pass). ${SHARED_RULES}`;

/** Fallback: OpenAI when Gemini fails or returns invalid JSON — not a second pass after Gemini succeeds. */
const OPENAI_FALLBACK_SYSTEM = `You refine ecommerce catalog rows produced by deterministic rules. Do not invent facts. ${SHARED_RULES}`;

function llmDisabled(): boolean {
  if (process.env.FEEDLAYER_LLM_ENABLED === "0" || process.env.FEEDLAYER_LLM_ENABLED === "false") return true;
  return false;
}

/** Max products to send through LLM enrichment (all batches combined). `0` = skip LLM. */
export function maxLlmProducts(): number {
  const raw = process.env.FEEDLAYER_LLM_MAX_PRODUCTS;
  if (raw === "0") return 0;
  const n = raw ? Number(raw) : 500;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 5000) : 500;
}

/** Products per LLM HTTP request when catalog is large. */
export function llmBatchSize(): number {
  const raw = process.env.FEEDLAYER_LLM_BATCH_SIZE;
  const n = raw ? Number(raw) : 25;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.max(n, 5), 100) : 25;
}

/** Split array into fixed-size chunks (exported for verify). */
export function chunkProducts<T>(items: T[], size: number): T[][] {
  if (size <= 0 || items.length === 0) return items.length ? [items] : [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function geminiApiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || undefined;
}

/** Default: Gemini 2.5 Pro (see https://ai.google.dev/gemini-api/docs/models — override if Google renames). */
function geminiModel(): string {
  return (process.env.FEEDLAYER_GEMINI_MODEL || "gemini-2.5-pro").trim();
}

function openAiModel(): string {
  return (process.env.FEEDLAYER_OPENAI_MODEL || "gpt-5.5").trim();
}

function anyLlmConfigured(): boolean {
  return !!(geminiApiKey() || process.env.OPENAI_API_KEY);
}

function buildPromptPayload(products: DraftProduct[]): unknown[] {
  return products.map((p) => ({
    product_id: p.product_id,
    title: p.title ?? "",
    description: p.description ?? "",
    category: p.category ?? "",
    buyer_intent: p.buyer_intent ?? [],
    comparison_fields: p.comparison_fields ?? [],
  }));
}

async function callGeminiJson(userBody: string): Promise<string> {
  const key = geminiApiKey();
  if (!key) throw new Error("Missing Gemini API key");

  const model = geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${GEMINI_SYSTEM}\n\nINPUT:\n${userBody}` }] }],
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

async function callOpenAiFallbackJson(userBody: string): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });
  const model = openAiModel();

  const res = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: OPENAI_FALLBACK_SYSTEM },
      { role: "user", content: userBody },
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

function applyPatchesOrNull(drafts: DraftProduct[], raw: string): DraftProduct[] | null {
  let parsed: z.infer<typeof ResponseSchema>;
  try {
    const j = JSON.parse(raw);
    const r = ResponseSchema.safeParse(j);
    if (!r.success) return null;
    parsed = r.data;
  } catch {
    return null;
  }

  const byId = new Map(parsed.products.map((p) => [p.product_id, p]));
  return drafts.map((p) => {
    const patch = byId.get(p.product_id);
    if (!patch) return p;
    return mergePatch(p, patch);
  });
}

/** Gemini primary → OpenAI fallback for one batch. Returns original batch if both fail. */
async function enrichOneBatch(batch: DraftProduct[]): Promise<DraftProduct[]> {
  const payload = JSON.stringify({ products: buildPromptPayload(batch) }, null, 0);

  if (geminiApiKey()) {
    try {
      const raw = await callGeminiJson(payload);
      const merged = applyPatchesOrNull(batch, raw);
      if (merged) return merged;
    } catch {
      /* fall through to OpenAI or rules */
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const raw = await callOpenAiFallbackJson(payload);
      const merged = applyPatchesOrNull(batch, raw);
      if (merged) return merged;
    } catch {
      /* rules only for this batch */
    }
  }

  return batch;
}

/**
 * After **rule-based** extraction/normalization:
 *
 * 1. **Primary:** Gemini **2.5 Pro** per batch when keys are set.
 * 2. **Fallback:** OpenAI only if Gemini fails for that batch — not a second pass after success.
 * 3. **Final fallback:** unchanged rule drafts for failed batches.
 *
 * Large catalogs are split into batches of `FEEDLAYER_LLM_BATCH_SIZE` (default 25).
 * Disable: no keys, `FEEDLAYER_LLM_ENABLED=false`, or `FEEDLAYER_LLM_MAX_PRODUCTS=0`.
 */
export async function enrichDraftProductsWithOptionalLlm(
  products: DraftProduct[],
  onBatch?: (batch: number, total: number) => void,
): Promise<DraftProduct[]> {
  const cap = maxLlmProducts();
  if (llmDisabled() || cap === 0 || !anyLlmConfigured()) {
    return products;
  }

  const toEnrich = products.slice(0, cap);
  const tail = products.slice(cap);
  const batches = chunkProducts(toEnrich, llmBatchSize());

  const enriched: DraftProduct[] = [];
  for (let i = 0; i < batches.length; i++) {
    onBatch?.(i + 1, batches.length);
    enriched.push(...(await enrichOneBatch(batches[i]!)));
  }

  return [...enriched, ...tail];
}
