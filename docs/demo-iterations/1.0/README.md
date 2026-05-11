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
| Intelligence | Rules only | **Rule-based pipeline always**; **optional OpenAI** enrichment when `OPENAI_API_KEY` is set (same JSON schema + Zod validation; failures → rules) |

## Out of scope (unchanged)

- No auth, payments, Shopify/Amazon/TikTok, official OpenAI upload, product graph DB.

## LLM strategy (current)

**Single path: official OpenAI Chat Completions only.** No OpenRouter, Anthropic, or Gemini in this repo.

1. **Rule-based parser / extractors** run first (`parseCsv`, `parseExcel`, `extractProductData`, `normalizeProductData`).
2. **Optional OpenAI pass** (`src/lib/llm/enrichCatalog.ts`): same structured JSON contract; merged only after **JSON parse + Zod**; any error → **unchanged drafts** (rules remain the source of truth).
3. **Default model id:** `FEEDLAYER_OPENAI_MODEL` defaults to **`gpt-5.5`** (placeholder for your org’s stable id when available). Override in env if the API uses a different slug.
4. **Disable LLM:** omit `OPENAI_API_KEY`, or set `FEEDLAYER_LLM_ENABLED=false`, or `FEEDLAYER_LLM_MAX_PRODUCTS=0`.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for any LLM enrichment (official OpenAI). |
| `FEEDLAYER_OPENAI_MODEL` | Default: **`gpt-5.5`**. Set to the model id your account supports. |
| `FEEDLAYER_LLM_MAX_PRODUCTS` | Max products sent in one LLM payload (default `100`, max `200`). Set `0` to skip LLM even if key is set. |
| `FEEDLAYER_LLM_ENABLED` | Set `false` or `0` to force rules-only. |

### LLM behavior constraints

- Prompt returns **structured JSON only** (chat `response_format: json_object` when the model supports it).
- **Zod validation** on the server; invalid output is **discarded** → rules-only merge for that run.
- No invented facts beyond prompt rules + existing `mergePatch` guards.

### Catalog size

- **≥ 100 products** per run: parsing/scoring is O(n). LLM sends up to `FEEDLAYER_LLM_MAX_PRODUCTS` rows in one request (batching multiple requests can be added later).

## Data model (1.0 response)

Top-level JSON (also what “Download full FeedLayer report” saves):

```text
processed_at
input { type, product_count, sheet? }
column_mapping { fields: [{ canonical, sources[] }] }
summary { products_processed, variants_detected, missing_fields_count, weak_descriptions_count, missing_policies_count, variant_issues_count }
overall { score, status }
ai_ready_feed: ProductFeedItem[]     // NO readiness; prices include minor units where applicable
readiness_report: { products: ReadinessProduct[] }
openai_style_feed_preview: { items: OpenAIStyleItem[] }   // label in UI, not official spec
```

## Verification

```bash
npm run lint
npm run build
npm run verify
```

## Changelog

- **2026-05-10 (c):** LLM stack simplified to **OpenAI only** (no OpenRouter / Anthropic / Gemini). Default `FEEDLAYER_OPENAI_MODEL=gpt-5.5`; rules-only fallback unchanged.
- **2026-05-10:** Shipped 1.0 pilot: `.xlsx` (first sheet), column mapping UI, split `ai_ready_feed` / `readiness_report` / `summary`, minor-unit prices, availability enums, anchored category suggestions, policy counts, report dashboard, OpenAI-style preview (disclaimed), three JSON downloads (`src/lib/processPipeline.ts`, `src/lib/llm/enrichCatalog.ts`).

## Key code paths

| Concern | Location |
|--------|-----------|
| HTTP entry | `src/app/api/process/route.ts` |
| Orchestration | `src/lib/processPipeline.ts` |
| XLSX | `src/lib/parseExcel.ts` |
| Column mapping | `src/lib/columnMapping.ts` |
| Availability / price minor | `src/lib/availability.ts`, `src/lib/priceMinor.ts` |
| Full report shape | `src/types/report.ts`, `src/lib/buildFullReport.ts` |
| LLM enrichment | `src/lib/llm/enrichCatalog.ts` |
| UI | `src/app/ui/HomeClient.tsx`, `src/app/results/ui/ResultsClient.tsx`, `src/components/*` |
