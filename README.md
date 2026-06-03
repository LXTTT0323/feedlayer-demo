# FeedLayer — Product 1.5 (current)

**Repository:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

Shareable **catalog audit** demo: upload → **review column mapping** → **live progress** → **shareable results** + JSON/CSV exports.

**Verified:** `npm run verify` — 100-SKU, overrides, share round-trip, multi-sheet Excel.

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/demo-iterations/1.5/README.md`](docs/demo-iterations/1.5/README.md) | **1.5 spec & constraints** |
| [`docs/demo-iterations/1.0/README.md`](docs/demo-iterations/1.0/README.md) | 1.0 baseline + 1.5 plan |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel deploy + env vars |
| [`docs/SECURITY.md`](docs/SECURITY.md) | SheetJS notes |

## Samples

| File | Purpose |
|------|---------|
| [`public/test-full-demo.xlsx`](public/test-full-demo.xlsx) | Full manual test (mapping + variants + gaps) |
| [`public/test-catalog-100.csv`](public/test-catalog-100.csv) | 100-row CI stress test |

## API

| Route | Purpose |
|-------|---------|
| `POST /api/process/preview` | Column mapping preview (CSV/XLSX) |
| `POST /api/process/stream` | SSE progress + final report |
| `POST /api/process` | Legacy one-shot JSON (unchanged) |
| `POST /api/share` / `GET /api/share/[id]` | Shareable result links |

## Scripts

```bash
npm install && npm run dev
npm run lint && npm run build && npm run verify
```

## Stack

Next.js, React, Tailwind, TypeScript, SheetJS, optional Gemini + OpenAI (LLM fallback, batched).
