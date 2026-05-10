# FeedLayer — Product 0.5 demo

**Repository:** [github.com/LXTTT0323/feedlayer-demo](https://github.com/LXTTT0323/feedlayer-demo)

Web demo: upload **CSV**, paste **listing text**, or load **sample data** → AI-ready feed preview, missing-field report, readiness score, JSON download.

- **Iteration docs:** [`docs/demo-iterations/`](docs/demo-iterations/README.md) (each release gets a folder, e.g. `0.5/`, `1.0/`).
- **Sample file:** [`public/test-feedlayer-sample.csv`](public/test-feedlayer-sample.csv)

## Scripts

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run build
npm run verify
```

`verify` runs [`scripts/verify-pipeline.ts`](scripts/verify-pipeline.ts) against the same pipeline as `POST /api/process`.

## Stack

Next.js (App Router), React, Tailwind CSS, TypeScript — see `package.json`.
