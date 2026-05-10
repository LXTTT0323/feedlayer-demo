"use client";

import { useRef } from "react";

export function UploadBox({
  onCsvSelected,
}: {
  onCsvSelected: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Upload CSV</div>
          <div className="mt-1 text-sm text-slate-600">
            Upload a <span className="font-medium">.csv</span> export from a spreadsheet or marketplace listing.
          </div>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          Choose file
        </button>
      </div>

      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCsvSelected(f);
          if (ref.current) ref.current.value = "";
        }}
      />

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Columns can be messy — we’ll try to map common aliases (e.g. <span className="font-mono">desc → description</span>,{" "}
        <span className="font-mono">img → image_url</span>, <span className="font-mono">stock → availability</span>).
      </div>
    </div>
  );
}

