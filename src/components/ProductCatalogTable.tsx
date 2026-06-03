"use client";

import { useState } from "react";
import type { FeedLayerFullReport, ReadinessReportProduct } from "@/types/report";
import { groupIssues, TIER_LABELS } from "@/lib/issuePriority";

const COMPARE_FIELDS: { label: string; orig: (p: ReadinessReportProduct) => string; norm: (p: ReadinessReportProduct) => string }[] = [
  { label: "Title", orig: (p) => pickRaw(p, ["product_name", "title", "name"]), norm: (p) => p.normalized_snapshot.title ?? "" },
  { label: "Description", orig: (p) => pickRaw(p, ["desc", "description"]), norm: (p) => p.normalized_snapshot.description ?? "" },
  { label: "Category", orig: (p) => pickRaw(p, ["category", "product_type"]), norm: (p) => p.normalized_snapshot.category ?? "" },
  { label: "Price", orig: (p) => pickRaw(p, ["price", "amount", "sale_price"]), norm: (p) => formatPrice(p) },
  { label: "Availability", orig: (p) => pickRaw(p, ["stock", "availability", "stock_status"]), norm: (p) => p.normalized_snapshot.variants[0]?.availability ?? "" },
  { label: "Image", orig: (p) => pickRaw(p, ["img", "image_url", "image"]), norm: (p) => p.normalized_snapshot.media[0]?.url ?? "" },
];

function pickRaw(p: ReadinessReportProduct, keys: string[]): string {
  for (const k of keys) {
    const v = p.original_input[k];
    if (v?.trim()) return v;
  }
  return "";
}

function formatPrice(p: ReadinessReportProduct): string {
  const v = p.normalized_snapshot.variants[0];
  if (!v?.price) return "";
  return `${v.price.currency} ${v.price.amount}`;
}

export function ProductCatalogTable({ report }: { report: FeedLayerFullReport }) {
  const [open, setOpen] = useState<ReadinessReportProduct | null>(null);
  const rows = report.readiness_report.products;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Product audit table</div>
        <p className="mt-1 text-sm text-slate-600">Click a row for before → after field comparison and issues.</p>
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

            <div className="mt-4 text-2xl font-semibold text-slate-900">{open.readiness.score}/100</div>

            <div className="mt-6">
              <div className="text-xs font-semibold text-slate-700">Before → after (key fields)</div>
              <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Field</th>
                      <th className="px-3 py-2 text-left">Original</th>
                      <th className="px-3 py-2 text-left">Normalized</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_FIELDS.map((f) => {
                      const before = f.orig(open) || "—";
                      const after = f.norm(open) || "—";
                      const changed = before !== "—" && after !== "—" && before !== after;
                      return (
                        <tr key={f.label} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-700">{f.label}</td>
                          <td className="max-w-[10rem] truncate px-3 py-2 text-slate-600">{before}</td>
                          <td className={`max-w-[10rem] truncate px-3 py-2 ${changed ? "font-medium text-teal-800" : "text-slate-800"}`}>
                            {after}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {(["blocking", "advisory", "other"] as const).map((tier) => {
                const items = groupIssues(open.readiness.missing_fields)[tier];
                return (
                  <div key={tier}>
                    <div className="text-xs font-semibold text-slate-700">{TIER_LABELS[tier]}</div>
                    <ul className="mt-2 list-inside list-disc text-xs text-slate-800">
                      {items.length === 0 ? (
                        <li className="list-none text-slate-500">None</li>
                      ) : (
                        items.map((m) => <li key={m}>{m}</li>)
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
