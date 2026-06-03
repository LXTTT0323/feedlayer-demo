"use client";

import { CANONICAL_FIELDS, IGNORE_COLUMN } from "@/lib/tableOverrides";
import type { TablePreview } from "@/lib/tableOverrides";
import type { UserColumnOverrides } from "@/lib/columnMapping";

const FIELD_OPTIONS = [
  { value: "", label: "— Auto —" },
  { value: IGNORE_COLUMN, label: "Ignore column" },
  ...CANONICAL_FIELDS.map((f) => ({ value: f, label: f })),
];

export function ColumnMappingEditor({
  preview,
  overrides,
  onChange,
  onConfirm,
  onCancel,
}: {
  preview: TablePreview;
  overrides: UserColumnOverrides;
  onChange: (next: UserColumnOverrides) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-6">
          <div className="text-lg font-semibold text-slate-900">Review column mapping</div>
          <p className="mt-2 text-sm text-slate-600">
            {preview.row_count} product rows detected
            {preview.sheet ? ` on sheet “${preview.sheet}”` : ""}. Adjust mappings before processing.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2">Your column</th>
                  <th className="px-3 py-2">Maps to</th>
                  <th className="px-3 py-2">Sample value</th>
                </tr>
              </thead>
              <tbody>
                {preview.suggested.map((row) => {
                  const current = overrides[row.source] ?? "";
                  const sample = preview.sample_rows[0]?.[row.source] ?? "";
                  return (
                    <tr key={row.source} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs text-slate-900">{row.source}</td>
                      <td className="px-3 py-2">
                        <select
                          value={current}
                          onChange={(e) => {
                            const v = e.target.value;
                            const next = { ...overrides };
                            if (!v) delete next[row.source];
                            else next[row.source] = v;
                            onChange(next);
                          }}
                          className="w-full max-w-xs rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        >
                          {FIELD_OPTIONS.map((opt) => (
                            <option key={opt.value || "auto"} value={opt.value}>
                              {opt.label}
                              {opt.value === "" && row.status === "auto" && row.canonical
                                ? ` (${row.canonical})`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-600">{sample || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Process catalog
          </button>
        </div>
      </div>
    </div>
  );
}
