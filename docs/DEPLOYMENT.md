# Deploy FeedLayer 1.0 (Vercel)

Minimal steps to run the pilot demo online. Keys stay in the hosting dashboard — never commit them to Git.

## Prerequisites

- GitHub repo: [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)
- [Vercel](https://vercel.com) account connected to that repo
- **Root directory:** if the repo root is `FeedLayer`, set Vercel **Root Directory** to `feedlayer-demo`

## Deploy

1. Vercel → **Add New Project** → import `feedlayer-demo`.
2. Framework preset: **Next.js** (defaults are fine).
3. Add environment variables (below), then **Deploy**.

Build command: `npm run build` (default). No database required.

## Environment variables

Set these in **Project → Settings → Environment Variables** (Production + Preview).

| Variable | Required | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | Recommended | Primary LLM ([Google AI Studio](https://aistudio.google.com/apikey)). |
| `FEEDLAYER_GEMINI_MODEL` | Optional | Default: `gemini-2.5-pro`. |
| `OPENAI_API_KEY` | Optional | **Fallback only** if Gemini fails or returns invalid JSON. |
| `FEEDLAYER_OPENAI_MODEL` | Optional | Default: `gpt-5.5`. |
| `FEEDLAYER_LLM_ENABLED` | Optional | `false` = rules-only (no API calls). |
| `FEEDLAYER_LLM_BATCH_SIZE` | Optional | SKUs per LLM HTTP request (default **25**). |
| `FEEDLAYER_LLM_MAX_PRODUCTS` | Optional | Max SKUs enriched via LLM per run (default **500**). `0` = disable LLM. |

**Without keys:** rule-based pipeline only.

## Local vs production

| | Local | Vercel |
|---|--------|--------|
| Secrets | `.env.local` (gitignored) | Vercel env vars |
| LLM batching | Same env vars | Same |
| Results storage | Browser `sessionStorage` only | Same — no server DB |

Redeploy after changing env vars.

## Share links (1.5)

Reports are stored under `.feedlayer-shares/` on the server filesystem (gitignored). Works reliably on **`next dev`** and self-hosted **`next start`**. On Vercel serverless, share links may not persist across instances — use self-hosted or add KV for production.

Optional: `FEEDLAYER_SHARE_DIR` overrides the storage directory.

## Smoke test after deploy

1. Open your `*.vercel.app` URL.
2. **Try sample data** (5 products) or upload `test-catalog-100.csv` (100 SKUs).
3. Upload `test-full-demo.xlsx` → review mapping → confirm → watch progress → **Copy share link** on results.
4. **Results** page: score, mapping, three JSON downloads.

## Security

See [`SECURITY.md`](SECURITY.md) for SheetJS / `npm audit` notes on `.xlsx` parsing.
