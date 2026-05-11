# FeedLayer Product 1.0 — pilot-ready catalog audit

**Status:** implemented in `feedlayer-demo` (pilot-ready iteration).  
**Base:** Product 0.5 codebase (`feedlayer-demo`).  
**Remote:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

## Goals (vs 0.5)

| Area | 0.5 | 1.0 |
|------|-----|-----|
| Input | CSV + paste + sample | **+ `.xlsx`** (first sheet default; code structured for future sheet picker) |
| Column handling | Fixed alias table in parser | **Central mapping** + **UI mapping summary** |
| API output | Single `products[]` with `readiness` embedded | **`ai_ready_feed`**, **`readiness_report`**, **`summary`** — **no `readiness` inside feed items** |
| Validation | Basic | **Minor-unit prices**, **machine availability enum**, **category-aligned suggestions**, **explicit policy gap counting** |
| UX | Results cards + lists | **Report dashboard**: KPIs, **product table**, **product detail** (original → normalized → issues) |
| Export | One JSON | **Three downloads** + **OpenAI-style preview** (not official integration) |
| Intelligence | Rules only | **Rules always first**; optional **Gemini 2.5 Pro** (primary LLM), then **OpenAI GPT‑5.5** (fallback/validator), then rules-only if both fail or keys missing |

## Out of scope (unchanged)

- No auth, payments, Shopify/Amazon/TikTok, official OpenAI upload, product graph DB.

## LLM strategy (current)

Pipeline order after rule-based extract/normalize (`processPipeline` → `enrichDraftProductsWithOptionalLlm`):

1. **Rule-based** rows are always produced first (CSV/XLSX/text extractors + `normalizeProducts`).
2. **Primary LLM — Gemini 2.5 Pro** via Google Generative Language API (`generateContent`, JSON MIME type), when `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY` is set. Default model id: **`gemini-2.5-pro`** (`FEEDLAYER_GEMINI_MODEL` overrides if Google renames).
3. **Fallback / validator — OpenAI** (`chat.completions` + `response_format: json_object`) when `OPENAI_API_KEY` is set, **if** Gemini is not configured, errors, or returns JSON that fails Zod validation.
4. If neither model returns valid merged JSON → **unchanged rule drafts** (no invented fields).

### Environment variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY` | Enables **primary** Gemini pass. |
| `FEEDLAYER_GEMINI_MODEL` | Default: **`gemini-2.5-pro`**. Confirm in [Gemini API models](https://ai.google.dev/gemini-api/docs/models). |
| `OPENAI_API_KEY` | Enables **fallback/validator** OpenAI pass. |
| `FEEDLAYER_OPENAI_MODEL` | Default: **`gpt-5.5`**. |
| `FEEDLAYER_LLM_MAX_PRODUCTS` | Max products per LLM request (default `100`, max `200`). `0` = skip all LLM. |
| `FEEDLAYER_LLM_ENABLED` | `false` or `0` = skip all LLM. |

### LLM behavior constraints

- Same JSON schema + **Zod** on the server; invalid output from either provider is discarded for that pass.
- Prompts forbid inventing unavailable facts; `mergePatch` adds conservative guards.

### Catalog size

- **≥ 100 products** per run: parsing/scoring O(n). Each LLM pass sends up to `FEEDLAYER_LLM_MAX_PRODUCTS` rows (single request per provider attempt).

## Data model (1.0 response)

Top-level JSON (also what “Download full FeedLayer report” saves):

```text
processed_at
input { type, product_count, sheet? }
column_mapping { fields: [{ canonical, sources[] }] }
summary { products_processed, variants_detected, missing_fields_count, weak_descriptions_count, missing_policies_count, variant_issues_count }
overall { score, status }
ai_ready_feed: ProductFeedItem[]
readiness_report: { products: ReadinessProduct[] }
openai_style_feed_preview: { items: OpenAIStyleItem[] }
```

## Verification

```bash
npm run lint
npm run build
npm run verify
```

## Changelog

- **2026-05-10 (d):** LLM chain: **Gemini 2.5 Pro primary** (`gemini-2.5-pro` default), **OpenAI GPT‑5.5 fallback/validator**, then rules-only.
- **2026-05-10 (c):** OpenAI-only interim (reverted in favor of Gemini-primary stack).
- **2026-05-10:** Shipped 1.0 pilot (xlsx, mapping, split reports, dashboard, exports).

## Key code paths

| Concern | Location |
|--------|-----------|
| LLM chain | `src/lib/llm/enrichCatalog.ts` |
| Orchestration | `src/lib/processPipeline.ts` |
| HTTP entry | `src/app/api/process/route.ts` |
