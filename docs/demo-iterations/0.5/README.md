# Product 0.5 demo — FeedLayer

**Date:** 2026-05-08 (initial)  
**Stack:** Next.js 16, React 19, Tailwind 4, TypeScript.  
**Remote:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

> **Note:** The live app in this repository has moved to **Product 1.0** (see [`../1.0/README.md`](../1.0/README.md)). This page documents the 0.5 snapshot for comparison.

## What this iteration proves

- **Input:** CSV (`.csv` only); pasted product listing text; built-in sample catalog / sample text.
- **Process:** Parse with column aliases → extract/normalize → validate missing & weak fields → readiness score.
- **Output:** “FeedLayer AI-Ready Feed (preview)” JSON, per-product missing-field report, suggestions, downloadable JSON.
- **No:** Auth, payments, Shopify/Amazon/OpenAI uploads, PDF/image extraction in-product (called out as coming later in UI).

## Architecture (for later 1.0+)

| Layer | Location |
|--------|-----------|
| API entry | `src/app/api/process/route.ts` |
| CSV parse | `src/lib/parseCsv.ts` |
| Extract | `src/lib/extractProductData.ts` |
| Normalize | `src/lib/normalizeProductData.ts` |
| Validate | `src/lib/validateFeed.ts` |
| Score | `src/lib/scoreReadiness.ts` |
| Types | `src/types/product.ts` |

Extraction is **rule-based/heuristic** (including basic Chinese patterns for prices, 毫升, 保温杯, etc.). It does **not** call cloud LLM APIs in this snapshot.

## Regression tests (automated)

`npm run verify` checks:

1. Sample catalog → **5** products; scores in **0–100**.
2. Sample text → **1** product; category **Drinkware** (bottle keywords).
3. `public/test-feedlayer-sample.csv` → **5** products (matches sample catalog).
4. English paste → **USD** price parsed.
5. Chinese paste → **CNY** + **500ml-class** capacity signal.
6. Same `product_id` on two CSV rows → **2** variants on one product.
7. Empty CSV string → parser returns **0** rows (API returns **400** for CSV with no data rows).

## Manual HTTP checks (optional)

With a running server:

- `POST /api/process` `{ "type": "csv", "csvText": "id\\n" }` → **400** (no data rows).
- `POST /api/process` `{ "type": "text", "text": "short" }` → **400** (too short).
- `POST /api/process` `{ "type": "sample", "sample": "catalog" }` → **200**, e.g. overall score **~78**, **5** products (scores depend on sample data).

## Known limitations (acceptable for 0.5)

- **Excel `.xlsx`:** not supported; export to CSV first.
- **Hallucination:** product facts are not invented; missing fields stay missing and appear under `readiness.missing_fields` / suggestions.
- **Paste quality:** very messy or multi-product walls of text may parse poorly; CSV is the reliable path for catalogs.

## Next iteration (1.0) — placeholder

Document 1.0 in a new folder `docs/demo-iterations/1.0/` when scope is locked (e.g. optional LLM extraction behind env, XLSX, etc.).
