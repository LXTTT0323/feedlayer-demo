"use client";

import { useMemo, useState } from "react";
import type { FeedLayerFullReport } from "@/types/report";

export function OpenAIStylePreview({ report }: { report: FeedLayerFullReport }) {
  const [expanded, setExpanded] = useState(false);
  const json = useMemo(() => JSON.stringify(report.openai_style_feed_preview, null, 2), [report.openai_style_feed_preview]);
  const shown = expanded ? json : json.slice(0, 5000);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">OpenAI-style feed preview</div>
          <div className="mt-1 text-sm text-slate-600">{report.openai_style_feed_preview.label}</div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(json);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Copy JSON
        </button>
      </div>
      <pre className="mt-5 max-h-[420px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800">
        {shown}
        {!expanded && json.length > shown.length ? "\n\n… (truncated) …" : ""}
      </pre>
      {json.length > 5000 ? (
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-800"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show full JSON"}
        </button>
      ) : null}
    </div>
  );
}
