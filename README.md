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

**Primary:** **`GOOGLE_GENERATIVE_AI_API_KEY`** or **`GEMINI_API_KEY`** → Gemini **2.5 Pro** (default model id `gemini-2.5-pro`, override with `FEEDLAYER_GEMINI_MODEL`).  
**Fallback / validator:** **`OPENAI_API_KEY`** → **`gpt-5.5`** by default (`FEEDLAYER_OPENAI_MODEL`).  
If both fail or keys are missing → **rules only**. See [`docs/demo-iterations/1.0/README.md`](docs/demo-iterations/1.0/README.md).

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

Next.js (App Router), React, Tailwind CSS, TypeScript, SheetJS (`xlsx`), optional Gemini (REST) + OpenAI (`openai` package).
