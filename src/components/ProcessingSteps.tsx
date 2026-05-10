"use client";

const STEPS = [
  "Reading product data",
  "Extracting product fields",
  "Normalizing variants and attributes",
  "Checking missing fields",
  "Generating AI-ready feed",
  "Scoring readiness",
] as const;

export function ProcessingSteps({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Processing</div>
      <div className="mt-4 space-y-3">
        {STEPS.map((label, idx) => {
          const state = idx < activeIndex ? "done" : idx === activeIndex ? "active" : "todo";
          return (
            <div key={label} className="flex items-center gap-3">
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
        <div
          className="h-2 rounded-full bg-teal-600 transition-all"
          style={{ width: `${Math.min(100, Math.round(((activeIndex + 1) / STEPS.length) * 100))}%` }}
        />
      </div>
    </div>
  );
}

