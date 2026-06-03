"use client";

import { useMemo, useState } from "react";
import type { FeedLayerFullReport } from "@/types/report";
import { EXPORT_DEFINITIONS, getExportDefinition, type ExportKind } from "@/lib/previewExport";
import { ExportPreviewDrawer } from "@/components/ExportPreviewDrawer";

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExport(filename: string, mime: string, data: string | unknown) {
  if (typeof data === "string") {
    downloadBlob(filename, data, mime);
  } else {
    downloadBlob(filename, JSON.stringify(data, null, 2), mime);
  }
}

export function ExportBar({ report, shareId }: { report: FeedLayerFullReport; shareId?: string | null }) {
  const [copied, setCopied] = useState(false);
  const [previewId, setPreviewId] = useState<ExportKind | null>(null);

  const previewDef = previewId ? getExportDefinition(previewId) : null;
  const previewContent = useMemo(
    () => (previewDef ? previewDef.getText(report) : ""),
    [previewDef, report],
  );

  async function copyShareLink() {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error("Share failed");
      const { url } = (await res.json()) as { url: string };
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const fallback = shareId ? `${window.location.origin}/results?id=${shareId}` : window.location.href;
      await navigator.clipboard.writeText(fallback);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {previewDef ? (
        <ExportPreviewDrawer
          open
          title={previewDef.label}
          description={previewDef.description}
          format={previewDef.format}
          content={previewContent}
          filename={previewDef.filename}
          onClose={() => setPreviewId(null)}
          onDownload={() => downloadExport(previewDef.filename, previewDef.mime, previewDef.getDownloadData(report))}
        />
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Exports</div>
        <p className="mt-1 text-sm text-slate-600">Preview any file before downloading — pick the format that fits your workflow.</p>

        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {EXPORT_DEFINITIONS.map((def) => (
            <li key={def.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{def.label}</div>
                <div className="mt-0.5 text-xs text-slate-600">{def.description}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewId(def.id)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => downloadExport(def.filename, def.mime, def.getDownloadData(report))}
                  className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                    def.id === "feed-json"
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-teal-900">Share this report</div>
            <div className="text-xs text-teal-800/80">Send a link — recipients see the same dashboard (not a file download).</div>
          </div>
          <button
            type="button"
            onClick={() => void copyShareLink()}
            className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            {copied ? "Link copied!" : "Copy share link"}
          </button>
        </div>
      </div>
    </>
  );
}
