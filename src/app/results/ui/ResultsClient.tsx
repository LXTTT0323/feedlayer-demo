"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FeedLayerFullReport } from "@/types/report";
import { isSupportedReportVersion } from "@/types/report";
import { loadLastResult, clearLastResult, saveLastResult } from "@/lib/clientStorage";
import { ReadinessScoreCard } from "@/components/ReadinessScoreCard";
import { SummaryCards } from "@/components/SummaryCards";
import { MissingFieldsReport } from "@/components/MissingFieldsReport";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { OpenAIStylePreview } from "@/components/OpenAIStylePreview";
import { ExportBar } from "@/components/ExportBar";
import { ColumnMappingCard } from "@/components/ColumnMappingCard";
import { ProductCatalogTable } from "@/components/ProductCatalogTable";
import { IssuePriorityPanel } from "@/components/IssuePriorityPanel";

export default function ResultsClient() {
  const searchParams = useSearchParams();
  const shareId = searchParams.get("id");
  const [report, setReport] = useState<FeedLayerFullReport | null>(() => (shareId ? null : loadLastResult()));
  const [loadingShare, setLoadingShare] = useState(Boolean(shareId));
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;
    let cancelled = false;
    fetch(`/api/share/${shareId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Share link not found");
        return res.json() as Promise<FeedLayerFullReport>;
      })
      .then((r) => {
        if (!cancelled) {
          setReport(r);
          saveLastResult(r);
        }
      })
      .catch(() => {
        if (!cancelled) setShareError("This share link is invalid or expired.");
      })
      .finally(() => {
        if (!cancelled) setLoadingShare(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (loadingShare) {
    return (
      <div className="min-h-full flex-1 bg-slate-50 px-6 py-14 text-center text-sm text-slate-600">Loading shared report…</div>
    );
  }

  if (shareError) {
    return (
      <div className="min-h-full flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-900">{shareError}</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-full flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">No results yet</div>
            <div className="mt-2 text-sm text-slate-600">Upload a catalog or open a share link.</div>
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
              Back to upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupportedReportVersion(report.version) || !report.ai_ready_feed?.length) {
    return (
      <div className="min-h-full flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">Unsupported report format</div>
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
              Run again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-slate-900">Catalog audit report</div>
              <div className="mt-1 text-sm text-slate-600">
                FeedLayer {report.version} · {new Date(report.processed_at).toLocaleString()}
                {report.input.sheet ? <> · Sheet: {report.input.sheet}</> : null}
                {shareId ? <> · <span className="text-teal-700">Shared link</span></> : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                New upload
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearLastResult();
                  setReport(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          <ExportBar report={report} shareId={shareId} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ReadinessScoreCard report={report} />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
              Separated <strong>AI-ready feed</strong> and <strong>readiness report</strong>. Use exports or copy the share link for pilots.
            </div>
          </div>

          <SummaryCards report={report} />
          <IssuePriorityPanel products={report.readiness_report.products} />
          <ColumnMappingCard report={report} />
          <ProductCatalogTable report={report} />
          <MissingFieldsReport products={report.readiness_report.products} />
          <SuggestionsPanel products={report.readiness_report.products} />
          <OpenAIStylePreview report={report} />
        </div>
      </div>
    </div>
  );
}
