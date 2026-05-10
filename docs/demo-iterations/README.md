# Demo iterations

Each subfolder documents one **shipped demo snapshot** (scope, test notes, and known limits). New iterations (e.g. 1.0) add a new directory here; keep older notes for comparison.

| Folder | Name | App location |
|--------|------|----------------|
| `0.5/` | Product 0.5 — CSV + paste + sample, rule-based pipeline | This repo (`feedlayer-demo`) |

---

## How to verify locally

From the project root:

```bash
npm run lint
npm run build
npm run verify
```

`npm run verify` runs `scripts/verify-pipeline.ts` (same data pipeline as `POST /api/process` without HTTP).
