import type { FeedLayerProduct } from "@/types/product";

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const k = it.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export function SuggestionsPanel({ products }: { products: FeedLayerProduct[] }) {
  const variantSuggestions = unique(
    products
      .flatMap((p) => p.readiness.suggestions)
      .filter((s) => /variant|options|color|size|unique/i.test(s)),
  );

  const attributeSuggestions = unique(
    products
      .flatMap((p) => p.readiness.suggestions)
      .filter((s) => /material|capacity|attributes|category/i.test(s)),
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Cleanup suggestions</div>
      <div className="mt-1 text-sm text-slate-600">Quick actions to improve data quality.</div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-xs font-semibold text-slate-700">Variant cleanup</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {variantSuggestions.length === 0 ? (
              <li className="text-slate-500">No variant issues detected.</li>
            ) : (
              variantSuggestions.slice(0, 8).map((s) => <li key={s}>{s}</li>)
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-xs font-semibold text-slate-700">Attribute normalization</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {attributeSuggestions.length === 0 ? (
              <li className="text-slate-500">No major attribute gaps detected.</li>
            ) : (
              attributeSuggestions.slice(0, 8).map((s) => <li key={s}>{s}</li>)
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

