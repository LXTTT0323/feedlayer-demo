# Demo iterations

Each subfolder documents one **shipped demo snapshot** (scope, test notes, and known limits). New iterations (e.g. 1.0) add a new directory here; keep older notes for comparison.

| Folder | Name | App location |
|--------|------|----------------|
| `0.5/` | Product 0.5 — CSV + paste + sample, rule-based pipeline | Superseded by 1.0 UI/API shape |
| `1.0/` | Product 1.0 — **complete**: CSV/XLSX + sheet picker, LLM batching, 100-SKU verify | **Current** |

---

## How to verify locally

From the project root:

```bash
npm run lint
npm run build
npm run verify
```

`npm run verify` runs `scripts/verify-pipeline.ts` (same pipeline as `POST /api/process`, including a **100-row** rules-only case on `public/test-catalog-100.csv`).

Deploy: [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md).
