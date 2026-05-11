"use client";

import Link from "next/link";
import { useState } from "react";
import type { FeedLayerFullReport } from "@/types/report";
import { loadLastResult, clearLastResult } from "@/lib/clientStorage";
import { ReadinessScoreCard } from "@/components/ReadinessScoreCard";
import { SummaryCards } from "@/components/SummaryCards";
import { MissingFieldsReport } from "@/components/MissingFieldsReport";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { FeedPreview } from "@/components/FeedPreview";
import { OpenAIStylePreview } from "@/components/OpenAIStylePreview";
import { ExportBar } from "@/components/ExportBar";
import { ColumnMappingCard } from "@/components/ColumnMappingCard";
import { ProductCatalogTable } from "@/components/ProductCatalogTable";

export default function ResultsClient() {
  const [report, setReport] = useState<FeedLayerFullReport | null>(() => loadLastResult());

  if (!report) {
    return (
      <div className="min-h-full flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">No results yet</div>
            <div className="mt-2 text-sm text-slate-600">Go back to upload data or load sample data.</div>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Back to upload
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (report.version !== "1.0" || !report.ai_ready_feed?.length) {
    return (
      <div className="min-h-full flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">Stored results are from an older demo</div>
            <div className="mt-2 text-sm text-slate-700">Please run the catalog again from the home page (Product 1.0 format).</div>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Back to upload
              </Link>
            </div>
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
                FeedLayer 1.0 · Generated{" "}
                <span className="font-medium text-slate-900">{new Date(report.processed_at).toLocaleString()}</span>
                {report.input.sheet ? (
                  <>
                    {" "}
                    · Sheet: <span className="font-medium text-slate-900">{report.input.sheet}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
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

          <ExportBar report={report} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ReadinessScoreCard report={report} />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Pilot notes</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                This dashboard separates the <span className="font-semibold text-slate-900">AI-ready feed</span> from the{" "}
                <span className="font-semibold text-slate-900">readiness report</span>. Policy gaps are counted as individual
                missing slots across shipping, returns, and FAQ. Optional enrichment: **Gemini 2.5 Pro** first (Google API key),
                then **OpenAI** as fallback; otherwise this run stays rules-only.
              </div>
            </div>
          </div>

          <SummaryCards report={report} />

          <ColumnMappingCard report={report} />

          <ProductCatalogTable report={report} />

          <SuggestionsPanel products={report.readiness_report.products} />
          <MissingFieldsReport products={report.readiness_report.products} />

          <div className="grid gap-6 lg:grid-cols-2">
            <FeedPreview report={report} />
            <OpenAIStylePreview report={report} />
          </div>
        </div>
      </div>
    </div>
  );
}
