"use client";

import { useMemo, useState } from "react";
import type { FeedLayerResult } from "@/types/product";

export function FeedPreview({ result }: { result: FeedLayerResult }) {
  const [expanded, setExpanded] = useState(false);
  const json = useMemo(() => JSON.stringify(result.products, null, 2), [result.products]);
  const shown = expanded ? json : json.slice(0, 6000);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">FeedLayer AI-Ready Feed (preview)</div>
          <div className="mt-1 text-sm text-slate-600">Platform-agnostic JSON structure you can export.</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(json);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Copy JSON
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "feedlayer-ai-ready-feed.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Download JSON
          </button>
        </div>
      </div>

      <pre className="mt-5 max-h-[520px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800">
        {shown}
        {!expanded && json.length > shown.length ? "\n\n… (truncated) …" : ""}
      </pre>

      {json.length > 6000 ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : "Show full JSON"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

