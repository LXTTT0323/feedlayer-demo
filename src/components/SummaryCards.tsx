import type { FeedLayerFullReport } from "@/types/report";

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

export function SummaryCards({ report }: { report: FeedLayerFullReport }) {
  const s = report.summary;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Products processed" value={s.products_processed} />
      <Card label="Variants detected" value={s.variants_detected} />
      <Card label="Missing fields (total checks)" value={s.missing_fields_count} />
      <Card label="Weak descriptions" value={s.weak_descriptions_count} />
      <Card label="Missing policy slots (sum)" value={s.missing_policies_count} />
      <Card label="Products with policy gaps" value={s.missing_policy_products} />
      <Card label="Variant issues (rollup)" value={s.variant_issues_count} />
      <Card label="Overall score" value={`${report.overall.score}/100`} />
    </div>
  );
}
