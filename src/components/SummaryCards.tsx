import type { FeedLayerResult } from "@/types/product";

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

export function SummaryCards({ result }: { result: FeedLayerResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card label="Products processed" value={result.summary.products_processed} />
      <Card label="Missing fields" value={result.summary.missing_fields_total} />
      <Card label="Variant issues" value={result.summary.variant_issues_total} />
      <Card label="Weak descriptions" value={result.summary.weak_descriptions_total} />
      <Card label="Missing policies" value={result.summary.missing_policies_total} />
    </div>
  );
}

