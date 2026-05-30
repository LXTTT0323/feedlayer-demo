# Security notes (demo / pilot)

## Excel parsing (`xlsx` / SheetJS)

FeedLayer uses the community [`xlsx`](https://www.npmjs.com/package/xlsx) package (SheetJS) to read `.xlsx` uploads.

`npm audit` may report **high** advisories on `xlsx` (prototype pollution, ReDoS). There is **no patched release** on the default npm package at this time.

**Mitigations in this demo:**

- Parsing runs **server-side only** (Next.js API routes); uploaded files are not executed.
- Treat uploads as **untrusted input** — do not expose this endpoint on the public internet without rate limits.
- For production hardening, evaluate alternatives (`read-excel-file`, SheetJS Pro/CE, or vendor-hosted conversion) and re-run `npm audit`.

Run locally:

```bash
npm audit
```

PostCSS advisories may appear via the `next` dependency chain; follow Next.js upgrade guidance separately.
