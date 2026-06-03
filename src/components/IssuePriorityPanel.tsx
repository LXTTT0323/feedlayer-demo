"use client";

import type { ReadinessReportProduct } from "@/types/report";
import { groupIssues, TIER_LABELS, type IssueTier } from "@/lib/issuePriority";

const TIER_STYLES: Record<IssueTier, string> = {
  blocking: "border-rose-200 bg-rose-50 text-rose-900",
  advisory: "border-amber-200 bg-amber-50 text-amber-900",
  other: "border-slate-200 bg-slate-50 text-slate-800",
};

export function IssuePriorityPanel({ products }: { products: ReadinessReportProduct[] }) {
  const allMissing = products.flatMap((p) => p.readiness.missing_fields);
  const grouped = groupIssues([...new Set(allMissing)]);
  const tiers: IssueTier[] = ["blocking", "advisory", "other"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Issue priority</div>
      <p className="mt-1 text-sm text-slate-600">Missing fields grouped by impact on AI-ready feed quality.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier} className={`rounded-xl border p-4 ${TIER_STYLES[tier]}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">{TIER_LABELS[tier]}</div>
            <div className="mt-2 text-2xl font-semibold">{grouped[tier].length}</div>
            <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs font-mono">
              {grouped[tier].length === 0 ? (
                <li className="font-sans text-slate-500">None</li>
              ) : (
                grouped[tier].slice(0, 12).map((f) => <li key={f}>{f}</li>)
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
