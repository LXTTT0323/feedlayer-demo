"use client";

import Link from "next/link";
import { useState } from "react";
import type { FeedLayerResult } from "@/types/product";
import { loadLastResult, clearLastResult } from "@/lib/clientStorage";
import { ReadinessScoreCard } from "@/components/ReadinessScoreCard";
import { SummaryCards } from "@/components/SummaryCards";
import { MissingFieldsReport } from "@/components/MissingFieldsReport";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { FeedPreview } from "@/components/FeedPreview";

export default function ResultsClient() {
  const [result, setResult] = useState<FeedLayerResult | null>(() => loadLastResult());

  if (!result) {
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

  if (result.products.length === 0) {
    return (
      <div className="min-h-full flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">No products in this result</div>
            <div className="mt-2 text-sm text-slate-700">
              Processing finished but returned zero products. Try a non-empty CSV with data rows, or a longer pasted description.
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Back to upload
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearLastResult();
                  setResult(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Clear saved result
              </button>
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
              <div className="text-2xl font-semibold tracking-tight text-slate-900">Results</div>
              <div className="mt-1 text-sm text-slate-600">
                Feed preview + report generated at{" "}
                <span className="font-medium text-slate-900">{new Date(result.processed_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Process new data
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearLastResult();
                  setResult(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ReadinessScoreCard result={result} />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">About this demo</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                This is a <span className="font-semibold text-slate-900">platform-agnostic</span> AI-ready feed preview. It
                doesn’t upload to any external AI platform. Missing fields are marked as missing; suggestions are listed
                separately.
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Tip: Bring your real catalog CSV to quickly see what’s blocking AI shopping agents from understanding your
                products.
              </div>
            </div>
          </div>

          <SummaryCards result={result} />

          <div className="grid gap-6">
            <SuggestionsPanel products={result.products} />
            <MissingFieldsReport products={result.products} />
            <FeedPreview result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}

