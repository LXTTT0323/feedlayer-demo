import { Suspense } from "react";
import ResultsClient from "./ui/ResultsClient";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex-1 bg-slate-50 px-6 py-14 text-center text-sm text-slate-600">Loading…</div>}>
      <ResultsClient />
    </Suspense>
  );
}
