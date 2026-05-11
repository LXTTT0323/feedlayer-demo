"use client";

import { useMemo, useState } from "react";
import type { FeedLayerFullReport } from "@/types/report";

type Tab = "ai_ready" | "readiness_slice";

export function FeedPreview({ report }: { report: FeedLayerFullReport }) {
  const [tab, setTab] = useState<Tab>("ai_ready");
  const [expanded, setExpanded] = useState(false);
  const json = useMemo(() => {
    if (tab === "ai_ready") return JSON.stringify(report.ai_ready_feed, null, 2);
    return JSON.stringify(report.readiness_report.products.map((p) => ({ product_id: p.product_id, readiness: p.readiness })), null, 2);
  }, [report, tab]);
  const shown = expanded ? json : json.slice(0, 8000);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
        <span className="text-sm font-semibold text-slate-900">JSON preview</span>
        <button
          type="button"
          onClick={() => setTab("ai_ready")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "ai_ready" ? "bg-teal-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
        >
          AI-ready feed
        </button>
        <button
          type="button"
          onClick={() => setTab("readiness_slice")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "readiness_slice" ? "bg-teal-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
        >
          Readiness (per product)
        </button>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {tab === "ai_ready"
          ? "Export-ready product objects. Prices include minor units; readiness is not embedded here."
          : "Scores and issues only — full readiness JSON is available via export."}
      </p>
      <pre className="mt-4 max-h-[480px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800">
        {shown}
        {!expanded && json.length > shown.length ? "\n\n… (truncated) …" : ""}
      </pre>
      {json.length > 8000 ? (
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
