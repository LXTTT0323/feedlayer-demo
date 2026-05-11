# FeedLayer — Product 1.0 catalog audit (pilot)

**Repository:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

Pilot-ready **catalog audit** demo: upload **CSV** or **Excel (.xlsx, first sheet)**, paste **listing text**, or load **sample data** → separated **`ai_ready_feed`**, **`readiness_report`**, and **`summary`**, plus dashboard exports.

- **Iteration docs:** [`docs/demo-iterations/`](docs/demo-iterations/README.md)
- **1.0 spec & env:** [`docs/demo-iterations/1.0/README.md`](docs/demo-iterations/1.0/README.md)
- **Sample CSV:** [`public/test-feedlayer-sample.csv`](public/test-feedlayer-sample.csv)

## API

- `POST /api/process` with **`application/json`** (same bodies as before: `type: csv|text|sample`).
- `POST /api/process` with **`multipart/form-data`** and field **`file`**: `.csv` or `.xlsx`.

## Optional LLM (server env)

Set **`OPENAI_API_KEY`** (official) or **`OPENROUTER_API_KEY`** (OpenAI-compatible gateway), **`ANTHROPIC_API_KEY`**, or **`GOOGLE_GENERATIVE_AI_API_KEY`** / **`GEMINI_API_KEY`**. Use **`FEEDLAYER_LLM_PROVIDER=auto|openai|openrouter|anthropic|google`**. See [`docs/demo-iterations/1.0/README.md`](docs/demo-iterations/1.0/README.md) for model env vars and limits.

## Scripts

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run build
npm run verify
```

`verify` runs [`scripts/verify-pipeline.ts`](scripts/verify-pipeline.ts) against the same pipeline as `POST /api/process`.

## Stack

Next.js (App Router), React, Tailwind CSS, TypeScript, SheetJS (`xlsx`), optional OpenAI / Anthropic / Gemini HTTP.
