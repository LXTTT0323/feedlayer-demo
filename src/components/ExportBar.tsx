"use client";

import type { FeedLayerFullReport } from "@/types/report";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportBar({ report }: { report: FeedLayerFullReport }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => downloadJson("feedlayer-ai-ready-feed.json", report.ai_ready_feed)}
        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
      >
        Download AI-ready feed JSON
      </button>
      <button
        type="button"
        onClick={() => downloadJson("feedlayer-readiness-report.json", report.readiness_report)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
      >
        Download readiness report JSON
      </button>
      <button
        type="button"
        onClick={() => downloadJson("feedlayer-full-report.json", report)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
      >
        Download full FeedLayer report JSON
      </button>
    </div>
  );
}
