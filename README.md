# FeedLayer — Product 1.0 (complete)

**Repository:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

Pilot **catalog audit** demo: upload **CSV** or **Excel (.xlsx)** with **worksheet picker**, paste **listing text**, or load **sample data** → **`ai_ready_feed`**, **`readiness_report`**, **`summary`**, dashboard exports.

**Verified:** `npm run verify` — **100-SKU** rules path + multi-sheet Excel + LLM batch helpers.

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/demo-iterations/`](docs/demo-iterations/README.md) | Iteration history (0.5 → 1.0) |
| [`docs/demo-iterations/1.0/README.md`](docs/demo-iterations/1.0/README.md) | 1.0 spec, LLM env |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | **Vercel deploy** + environment variables |
| [`docs/SECURITY.md`](docs/SECURITY.md) | SheetJS / `npm audit` notes |

## Samples

| File | Purpose |
|------|---------|
| [`public/test-feedlayer-sample.csv`](public/test-feedlayer-sample.csv) | 5 rows — quick demo |
| [`public/test-catalog-100.csv`](public/test-catalog-100.csv) | 100 rows — CI stress test |
| [`public/test-multisheet.xlsx`](public/test-multisheet.xlsx) | 2 sheets — worksheet picker test |

Regenerate: `npm run generate:catalog-100` · `npm run generate:multisheet-xlsx`

## API

- `POST /api/process` — JSON (`type: csv|text|sample`) or multipart **`file`** (`.csv` / `.xlsx`), optional field **`sheet`** for Excel.
- `POST /api/process/sheets` — multipart **`file`** (`.xlsx`) → `{ sheets: string[] }`.

## Optional LLM (server env)

**Primary:** `GEMINI_API_KEY` → Gemini **2.5 Pro**.  
**Fallback:** `OPENAI_API_KEY` → only if Gemini fails (**LLM fallback pipeline**, not dual-model validation).  
**Batching:** `FEEDLAYER_LLM_BATCH_SIZE` (default **25**), `FEEDLAYER_LLM_MAX_PRODUCTS` (default **500**).  
No keys → **rules only**.

Local: `.env.local`. Production: [Vercel env vars](docs/DEPLOYMENT.md).

## Scripts

```bash
npm install && npm run dev
npm run lint && npm run build && npm run verify
```

## Remaining notes

| Topic | Status |
|-------|--------|
| Deploy keys | Configure in Vercel dashboard before sharing the live URL |
| SheetJS `xlsx` | Documented in [`docs/SECURITY.md`](docs/SECURITY.md); reassess before hard production |
| LLM wording | Fallback only — do not call it “multi-model validation” |

## Stack

Next.js, React, Tailwind, TypeScript, SheetJS (`xlsx`), optional Gemini + OpenAI.
