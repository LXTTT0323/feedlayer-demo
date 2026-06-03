# FeedLayer Product 1.0 — pilot-ready catalog audit

**Status:** **1.0 complete** — 100-SKU verified, multi-sheet Excel, LLM batching, deploy docs.  
**Remote:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

## Goals (vs 0.5)

| Area | 0.5 | 1.0 |
|------|-----|-----|
| Input | CSV + paste + sample | **+ `.xlsx`** with **worksheet picker** when multiple sheets |
| Column handling | Fixed alias table | **Central mapping** + **UI mapping summary** |
| API output | Single `products[]` with embedded readiness | **`ai_ready_feed`**, **`readiness_report`**, **`summary`** |
| Validation | Basic | Minor-unit prices, availability enum, category suggestions, policy gaps |
| UX | Results cards | **Dashboard**: KPIs, product table, row audit drawer |
| Export | One JSON | Three downloads + OpenAI-style preview |
| Intelligence | Rules only | Rules first → **Gemini 2.5 Pro** (batched) → **OpenAI fallback** → rules |

## LLM strategy

1. Rule-based extract + normalize (always).
2. **Gemini 2.5 Pro** in batches of `FEEDLAYER_LLM_BATCH_SIZE` (default 25).
3. **OpenAI fallback** per batch only if Gemini fails — **not** a second pass after Gemini succeeds.
4. Invalid/missing LLM → unchanged rule drafts for that batch.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | — | Primary LLM |
| `FEEDLAYER_GEMINI_MODEL` | `gemini-2.5-pro` | Gemini model id |
| `OPENAI_API_KEY` | — | Fallback after Gemini failure |
| `FEEDLAYER_OPENAI_MODEL` | `gpt-5.5` | OpenAI model id |
| `FEEDLAYER_LLM_BATCH_SIZE` | `25` | SKUs per LLM request (5–100) |
| `FEEDLAYER_LLM_MAX_PRODUCTS` | `500` | Max SKUs enriched per run (`0` = off) |
| `FEEDLAYER_LLM_ENABLED` | on | `false` = skip all LLM |

### Catalog size

- Rules path: **100+ SKUs** verified (`test-catalog-100.csv`).
- LLM path: batched — e.g. 500 SKUs ≈ 20 requests at default batch size.

## Excel

- `POST /api/process/sheets` lists worksheet names.
- UI shows picker when workbook has **2+ sheets**; multipart field **`sheet`** selects worksheet.
- Fixture: [`public/test-multisheet.xlsx`](../../../public/test-multisheet.xlsx).

## Verification

```bash
npm run lint && npm run build && npm run verify
```

Cases: 5-SKU samples, **100-SKU** CSV, **LLM chunk helpers**, **multi-sheet XLSX**.

## Deploy & security

- Deploy: [`docs/DEPLOYMENT.md`](../../DEPLOYMENT.md)
- SheetJS audit: [`docs/SECURITY.md`](../../SECURITY.md)

## Changelog

- **2026-05-28 (b):** Worksheet picker, LLM batching, multi-sheet test fixture, security doc.
- **2026-05-28:** 100-SKU verify, deployment doc, 1.0 complete marker.
- **2026-05-10:** Initial 1.0 pilot (xlsx, mapping, split reports, dashboard).

## Key code paths

| Concern | Location |
|--------|-----------|
| LLM batching + fallback | `src/lib/llm/enrichCatalog.ts` |
| Sheet list / parse | `src/lib/parseExcel.ts` |
| Sheet picker UI | `src/components/SheetPicker.tsx` |
| Orchestration | `src/lib/processPipeline.ts` |
| HTTP | `src/app/api/process/route.ts`, `.../sheets/route.ts` |

---

## Product 1.5 — plan & constraints

**Status:** **shipped** — see [`../1.5/README.md`](../1.5/README.md) for implementation details.

1.0 remains the **rules + split-report + LLM fallback** baseline. 1.5 adds **seller-facing demo polish** without new platforms.

### 1.5 scope (what we build)

| # | Feature | Why |
|---|---------|-----|
| P0-1 | **Column mapping preview + manual override** | Real Excel headers are wrong often; auto-only mapping blocks trust |
| P0-2 | **SSE processing progress** | LLM batches can take minutes; fake timer is misleading |
| P0-3 | **Shareable results URL** | YC / pilot needs a link, not screen-share |
| P0-4 | **Verify: overrides + share round-trip** | Credibility beyond “should work” |
| P1-1 | **CSV export** (feed + audit) | Non-technical sellers |
| P1-2 | **Issue priority** (blocking vs advisory) | Actionable audit narrative |
| P1-3 | **Drawer before → after** | Less JSON, more clarity |

### 1.5 constraints (what we do *not* build)

- **No** auth, payments, Shopify/Amazon/TikTok, PDF/image upload, dual-model validation.
- **Share links:** file store under `.feedlayer-shares/` — reliable on local/self-hosted; Vercel may need KV later.
- **Report version:** new runs emit `version: "1.5"`; **1.0 stored reports still load**.
- **API compatibility:** `POST /api/process` kept; Home UI prefers `POST /api/process/stream`.
- **SheetJS:** security note only — no forced migration in 1.5.

### 1.5 definition of done

1. Upload `test-full-demo.xlsx` → fix a mapping → process with visible batch progress → results share link opens in new tab.
2. `npm run verify` passes including override + share tests.
3. Docs: [`../1.5/README.md`](../1.5/README.md), DEPLOYMENT smoke section updated.

### Deferred to 2.0

Marketplace connectors, official OpenAI upload, user accounts, catalog DB, PDF/image ingestion, optional i18n UI.

