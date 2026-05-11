"use client";

import { useState } from "react";
import type { FeedLayerFullReport, ReadinessReportProduct } from "@/types/report";

export function ProductCatalogTable({ report }: { report: FeedLayerFullReport }) {
  const [open, setOpen] = useState<ReadinessReportProduct | null>(null);
  const rows = report.readiness_report.products;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Product audit table</div>
        <p className="mt-1 text-sm text-slate-600">Click a row for original input, normalized snapshot, and issues.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Product ID</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Missing</th>
                <th className="px-3 py-2">Warnings</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.product_id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  onClick={() => setOpen(p)}
                >
                  <td className="px-3 py-2 font-mono text-xs text-slate-900">{p.product_id}</td>
                  <td className="max-w-xs truncate px-3 py-2 text-slate-800">{p.title ?? "—"}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{p.readiness.score}</td>
                  <td className="px-3 py-2 text-slate-700">{p.readiness.missing_fields.length}</td>
                  <td className="px-3 py-2 text-slate-700">{p.readiness.warnings.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">{open.title ?? open.product_id}</div>
                <div className="mt-1 font-mono text-xs text-slate-500">{open.product_id}</div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => setOpen(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-700">Readiness score</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{open.readiness.score}/100</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">Issues</div>
                <div className="mt-1 text-sm text-slate-700">
                  {open.readiness.missing_fields.length} missing · {open.readiness.warnings.length} warnings ·{" "}
                  {open.readiness.suggestions.length} suggestions
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-700">Original input (first row / paste)</div>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                  {JSON.stringify(open.original_input, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">Normalized snapshot (internal model)</div>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                  {JSON.stringify(open.normalized_snapshot, null, 2)}
                </pre>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Missing fields</div>
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-800">
                    {open.readiness.missing_fields.length === 0 ? (
                      <li className="list-none text-slate-500">None</li>
                    ) : (
                      open.readiness.missing_fields.map((m) => <li key={m}>{m}</li>)
                    )}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">Warnings</div>
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-800">
                    {open.readiness.warnings.length === 0 ? (
                      <li className="list-none text-slate-500">None</li>
                    ) : (
                      open.readiness.warnings.map((w) => <li key={w}>{w}</li>)
                    )}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">Suggestions</div>
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-800">
                    {open.readiness.suggestions.length === 0 ? (
                      <li className="list-none text-slate-500">None</li>
                    ) : (
                      open.readiness.suggestions.map((s) => <li key={s}>{s}</li>)
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
