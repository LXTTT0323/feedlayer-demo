import type { ReadinessReportProduct } from "@/types/report";

export function MissingFieldsReport({ products }: { products: ReadinessReportProduct[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Missing-field report</div>
      <div className="mt-1 text-sm text-slate-600">Per product, what’s missing or weak (readiness layer only).</div>

      <div className="mt-5 space-y-5">
        {products.map((p) => (
          <div key={p.product_id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold text-slate-900">{p.title ?? p.product_id}</div>
              <div className="text-xs font-semibold text-slate-600">
                Score: <span className="text-slate-900">{p.readiness.score}/100</span>
              </div>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold text-slate-700">Missing</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {p.readiness.missing_fields.length === 0 ? (
                    <li className="text-slate-500">None</li>
                  ) : (
                    p.readiness.missing_fields.slice(0, 14).map((f) => (
                      <li key={f} className="font-mono text-xs">
                        {f}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">Warnings</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {p.readiness.warnings.length === 0 ? (
                    <li className="text-slate-500">None</li>
                  ) : (
                    p.readiness.warnings.slice(0, 8).map((w) => <li key={w}>{w}</li>)
                  )}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">Suggestions</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {p.readiness.suggestions.length === 0 ? (
                    <li className="text-slate-500">None</li>
                  ) : (
                    p.readiness.suggestions.slice(0, 8).map((s) => <li key={s}>{s}</li>)
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
