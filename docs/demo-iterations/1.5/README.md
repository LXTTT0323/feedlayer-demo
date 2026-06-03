# FeedLayer Product 1.5 — shareable demo

**Status:** **shipped** in `feedlayer-demo`.  
**Base:** Product 1.0.  
**Remote:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

## Theme

**「可分享的 catalog audit demo」** — 外人能独立完成上传 → 修正映射 → 看懂问题 → 导出 / 分享 report。

## Goals (vs 1.0)

| Area | 1.0 | 1.5 |
|------|-----|-----|
| Column mapping | Auto only + post-hoc summary | **Preview + manual override** before process |
| Processing UX | Fake timer | **SSE progress** (incl. LLM batch n/N) |
| Results | `sessionStorage` only | **Share link** (`POST /api/share` + `/results?id=`) |
| Export | 3× JSON | + **CSV** + **preview before download** (JSON table / CSV grid) |
| Issues | Flat lists | **Blocking vs advisory** grouping |
| Product drawer | Raw JSON dumps | **Field-level before → after** |
| Verify | Rules + 100 SKU | + **column override** + share round-trip |
| Report version | `1.0` | **`1.5`** (1.0 reports still load) |

## Constraints (in scope)

- **No auth**, payments, marketplace connectors, PDF/image upload.
- **No dual-model validation** — LLM remains fallback pipeline only.
- **Share storage:** file-backed under `.feedlayer-shares/` (gitignored). Works on `next dev` / self-hosted `next start`. Vercel serverless may need KV for durable shares — see DEPLOYMENT.md.
- **SheetJS:** documented in SECURITY.md; no forced library swap in 1.5.
- **No i18n UI** — English UI only (Chinese *data* in fixtures still supported).

## Out of scope (2.0)

- Shopify / Amazon / TikTok connectors  
- Official OpenAI Merchant upload  
- Persistent user accounts / catalog history DB  
- PDF / image catalog ingestion  

## API (new / changed)

| Route | Purpose |
|-------|---------|
| `POST /api/process/preview` | Parse file/CSV only → headers, sample rows, suggested mapping |
| `POST /api/process/stream` | Same inputs as `/api/process` + optional `columnOverrides` → **SSE** progress + final report |
| `POST /api/share` | Store report JSON → `{ id, url }` |
| `GET /api/share/[id]` | Load shared report |

Existing `POST /api/process` unchanged for simple clients; Home UI uses **stream** path.

## Environment variables (unchanged + optional)

All 1.0 LLM vars still apply. Optional:

| Variable | Purpose |
|----------|---------|
| `FEEDLAYER_SHARE_DIR` | Override share JSON directory (default `.feedlayer-shares/`) |

## Verification

```bash
npm run lint && npm run build && npm run verify
```

New cases: column override remapping, share save/load, 1.5 report version.

## Key code paths

| Concern | Location |
|--------|-----------|
| Column overrides | `src/lib/columnMapping.ts`, `src/lib/tableOverrides.ts` |
| Progress events | `src/lib/processProgress.ts`, `src/lib/processPipeline.ts` |
| SSE | `src/app/api/process/stream/route.ts` |
| Share | `src/lib/shareStore.ts`, `src/app/api/share/` |
| CSV export | `src/lib/exportCsv.ts` |
| Issue tiers | `src/lib/issuePriority.ts` |
| Mapping editor | `src/components/ColumnMappingEditor.tsx` |

## Changelog

- **2026-05-28:** Shipped 1.5 (mapping preview, SSE, share, CSV, issue tiers, drawer UX).
