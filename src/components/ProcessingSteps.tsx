"use client";

import type { ProcessProgressEvent } from "@/lib/processProgress";

const STEP_LABELS: Record<ProcessProgressEvent["step"], string> = {
  parse: "Reading and mapping columns",
  extract: "Extracting product fields",
  normalize: "Normalizing variants and prices",
  llm: "Optional LLM enrichment",
  validate: "Validating feed rules",
  score: "Scoring readiness",
  report: "Building report",
};

export function ProcessingSteps({
  progress,
}: {
  progress: { step: ProcessProgressEvent["step"]; message: string; index: number; total: number } | null;
}) {
  const activeStep = progress ? ["parse", "extract", "normalize", "llm", "validate", "score", "report"].indexOf(progress.step) : 0;
  const pct = progress ? Math.min(100, Math.round((activeStep / 7) * 100 + (progress.step === "llm" && progress.total > 1 ? progress.index / progress.total / 7 : 0) * 100)) : 5;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Processing</div>
      {progress?.message ? (
        <div className="mt-2 text-sm text-teal-700">{progress.message}</div>
      ) : (
        <div className="mt-2 text-sm text-slate-500">Starting…</div>
      )}
      <div className="mt-4 space-y-3">
        {Object.entries(STEP_LABELS).map(([key, label], idx) => {
          const state = idx < activeStep ? "done" : idx === activeStep ? "active" : "todo";
          return (
            <div key={key} className="flex items-center gap-3">
              <div
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  state === "done" ? "bg-teal-600" : "",
                  state === "active" ? "bg-teal-600 animate-pulse" : "",
                  state === "todo" ? "bg-slate-200" : "",
                ].join(" ")}
              />
              <div className={state === "todo" ? "text-slate-500" : "text-slate-900"}>{label}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
