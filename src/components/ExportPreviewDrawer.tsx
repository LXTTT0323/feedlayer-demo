"use client";

import { parseCsvPreview, truncateJsonPreview } from "@/lib/previewExport";

export function ExportPreviewDrawer({
  open,
  title,
  description,
  format,
  content,
  filename,
  onClose,
  onDownload,
}: {
  open: boolean;
  title: string;
  description: string;
  format: "json" | "csv";
  content: string;
  filename: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  if (!open) return null;

  const jsonPreview = format === "json" ? truncateJsonPreview(content) : null;
  const csvPreview = format === "csv" ? parseCsvPreview(content) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">{title}</div>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">{filename}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {format === "json" && jsonPreview ? (
            <pre className="max-h-[50vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800">
              {jsonPreview.shown}
            </pre>
          ) : null}

          {format === "csv" && csvPreview ? (
            <div>
              <p className="mb-3 text-xs text-slate-600">
                Showing first {csvPreview.rows.length} of {csvPreview.totalRows} data rows
              </p>
              <div className="max-h-[50vh] overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      {csvPreview.headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {row.map((cell, j) => (
                          <td key={j} className="max-w-[12rem] truncate px-3 py-2 text-slate-800">
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              onDownload();
              onClose();
            }}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Download {filename}
          </button>
        </div>
      </div>
    </div>
  );
}
