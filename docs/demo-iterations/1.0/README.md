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
| Intelligence | Rules only | **Optional LLM** when API key present; **rules fallback** always available |

## Out of scope (unchanged)

- No auth, payments, Shopify/Amazon/TikTok, official OpenAI upload, product graph DB.

## LLM provider strategy (decision)

**Recommendation: switchable providers with safe defaults — do not hard-lock to Gemini 2.5 Pro only.**

Reasons:

1. **Pilot reliability:** sellers care about stable JSON + your validation layer, not a specific model badge. Different orgs already have OpenAI vs Anthropic vs Google contracts.
2. **Latency / quotas:** Gemini 2.5 Pro can be strong on long catalogs but varies by region and quota; OpenAI/Anthropic mini/flash tiers are often enough for **structured JSON patch** tasks.
3. **Operational simplicity:** one codebase path (`FEEDLAYER_LLM_PROVIDER`) avoids “we only support Gemini” objections during pilots.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `FEEDLAYER_LLM_PROVIDER` | `auto` (default) \| `openai` \| `anthropic` \| `google` |
| `OPENAI_API_KEY` | If set (and provider allows), OpenAI is used. |
| `ANTHROPIC_API_KEY` | If set, Anthropic is used. |
| `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY` | If set, Google Generative Language API (Gemini) is used. |
| `FEEDLAYER_OPENAI_MODEL` | Default: `gpt-4o-mini` (override to newer chat models as your org allows). |
| `FEEDLAYER_ANTHROPIC_MODEL` | Default: `claude-3-5-haiku-latest` (cheap JSON); override to Sonnet for harder catalogs. |
| `FEEDLAYER_GOOGLE_MODEL` | Default: `gemini-2.0-flash` or org-approved **Gemini 2.5 Pro** id when you standardize it (e.g. preview IDs change — keep in env, not code). |

**`auto` order:** `openai` → `anthropic` → `google` (first with a usable key). Override with `FEEDLAYER_LLM_PROVIDER=google` to force Gemini when keys for multiple providers exist.

### LLM behavior constraints

- Prompt returns **structured JSON only** (no markdown).
- Server **parses + validates** with the same schemas as rule output; invalid LLM output is **discarded** and the run **falls back** to rules for that batch.
- LLM is used for **enrichment / suggestions / light normalization** grounded in existing row text — **no inventing** unavailable facts (enforced in prompt + post-check: filled fields must be traceable to input strings or safe merges like joining existing cells).

### Catalog size

- Target **≥ 100 products** per run without UI lock: parsing/scoring stays O(n); LLM calls are **chunked** (e.g. batches of rows) with a configurable cap `FEEDLAYER_LLM_MAX_PRODUCTS` (default `100`, set `0` to disable LLM entirely even if key exists).

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

Extend `scripts/verify-pipeline.ts` for: xlsx round-trip (optional fixture), new summary fields, feed without readiness, availability enum.

## Changelog

- **2026-05-10:** Shipped 1.0 pilot: `.xlsx` (first sheet), expanded column mapping + UI summary, split `ai_ready_feed` / `readiness_report` / `summary`, minor-unit prices + machine availability enums, anchored category suggestions, policy slot counts, report dashboard (KPIs, table, row detail drawer), OpenAI-style preview (disclaimed), three JSON downloads, optional LLM (`openai` | `anthropic` | `google`) via env with rules fallback (`src/lib/processPipeline.ts`, `src/lib/llm/enrichCatalog.ts`).

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
