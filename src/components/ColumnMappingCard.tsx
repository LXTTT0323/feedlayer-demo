import type { FeedLayerFullReport } from "@/types/report";

export function ColumnMappingCard({ report }: { report: FeedLayerFullReport }) {
  const fields = report.column_mapping.fields;
  if (fields.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Column mapping</div>
        <p className="mt-2 text-sm text-slate-600">No tabular columns (e.g. pasted text only). CSV/XLSX uploads show header → field mapping here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Column mapping summary</div>
      <p className="mt-1 text-sm text-slate-600">How your file headers map to FeedLayer canonical fields.</p>
      <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">Canonical field</th>
              <th className="px-3 py-2 font-semibold">Source column(s)</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.canonical} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-slate-900">{f.canonical}</td>
                <td className="px-3 py-2 text-slate-700">{f.sources.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
