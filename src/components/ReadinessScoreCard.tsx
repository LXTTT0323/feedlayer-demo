import type { FeedLayerFullReport } from "@/types/report";

function badge(status: FeedLayerFullReport["overall"]["status"]) {
  if (status === "Strong") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "Needs improvement") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "Weak") return "bg-orange-50 text-orange-800 border-orange-200";
  return "bg-rose-50 text-rose-800 border-rose-200";
}

export function ReadinessScoreCard({ report }: { report: FeedLayerFullReport }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">AI Commerce Readiness Score</div>
          <div className="mt-1 text-sm text-slate-600">
            Rolled up from per-product checks: completeness, variants, attributes, media, policies, and AI-ready fields.
          </div>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge(report.overall.status)}`}>
          {report.overall.status}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="text-5xl font-semibold tracking-tight text-slate-900">{report.overall.score}</div>
        <div className="text-sm text-slate-600">out of 100</div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-teal-600" style={{ width: `${report.overall.score}%` }} />
      </div>
    </div>
  );
}
