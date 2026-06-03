"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadBox } from "@/components/UploadBox";
import { SheetPicker } from "@/components/SheetPicker";
import { ColumnMappingEditor } from "@/components/ColumnMappingEditor";
import { SampleDataButton } from "@/components/SampleDataButton";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { saveLastResult } from "@/lib/clientStorage";
import { SAMPLE_HELPERS } from "@/lib/sampleData";
import type { FeedLayerFullReport } from "@/types/report";
import type { TablePreview } from "@/lib/tableOverrides";
import type { UserColumnOverrides } from "@/lib/columnMapping";
import type { ProcessProgressEvent } from "@/lib/processProgress";

type Mode = "idle" | "processing";

type MappingFlow = {
  file: File;
  sheet?: string;
  preview: TablePreview;
  overrides: UserColumnOverrides;
};

function parseSseBuffer(
  buffer: string,
  onEvent: (event: string, data: string) => void,
): string {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    if (!block.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (data) onEvent(event, data);
  }
  return rest;
}

export default function HomeClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [progress, setProgress] = useState<ProcessProgressEvent | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sheetPicker, setSheetPicker] = useState<{ file: File; sheets: string[] } | null>(null);
  const [mappingFlow, setMappingFlow] = useState<MappingFlow | null>(null);

  const canSubmitText = useMemo(() => pasteText.trim().length > 10, [pasteText]);

  async function runStream(body: FormData | Record<string, unknown>): Promise<FeedLayerFullReport> {
    const isForm = body instanceof FormData;
    const res = await fetch("/api/process/stream", {
      method: "POST",
      body: isForm ? body : JSON.stringify(body),
      headers: isForm ? undefined : { "content-type": "application/json" },
    });

    if (!res.ok || !res.body) {
      throw new Error(`Processing failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let report: FeedLayerFullReport | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      buf = parseSseBuffer(buf, (event, data) => {
        if (event === "progress") {
          setProgress(JSON.parse(data) as ProcessProgressEvent);
        } else if (event === "result") {
          report = JSON.parse(data) as FeedLayerFullReport;
        } else if (event === "error") {
          const j = JSON.parse(data) as { error?: string };
          throw new Error(j.error || "Processing failed");
        }
      });
    }

    if (!report) throw new Error("No result returned");
    return report;
  }

  async function finishWithReport(report: FeedLayerFullReport) {
    saveLastResult(report);
    try {
      const shareRes = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(report),
      });
      if (shareRes.ok) {
        const { id } = (await shareRes.json()) as { id: string };
        router.push(`/results?id=${id}`);
        return;
      }
    } catch {
      /* fall back to session only */
    }
    router.push("/results");
  }

  async function processStreamRequest(body: FormData | Record<string, unknown>) {
    setError(null);
    setMode("processing");
    setProgress(null);
    try {
      const result = await runStream(body);
      await finishWithReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setMode("idle");
    }
  }

  async function startFilePreview(file: File, sheet?: string) {
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    if (sheet) fd.append("sheet", sheet);
    const res = await fetch("/api/process/preview", { method: "POST", body: fd });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(j?.error || `Preview failed (${res.status})`);
    }
    const preview = (await res.json()) as TablePreview;
    setMappingFlow({ file, sheet, preview, overrides: {} });
  }

  async function onFileSelected(file: File) {
    setError(null);
    const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
    if (isXlsx) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/process/sheets", { method: "POST", body: fd });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error || `Could not read workbook (${res.status})`);
        }
        const { sheets } = (await res.json()) as { sheets: string[] };
        if (sheets.length > 1) {
          setSheetPicker({ file, sheets });
          return;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read Excel file");
        return;
      }
    }
    try {
      await startFilePreview(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }

  function confirmMappingFlow() {
    if (!mappingFlow) return;
    const fd = new FormData();
    fd.append("file", mappingFlow.file);
    if (mappingFlow.sheet) fd.append("sheet", mappingFlow.sheet);
    if (Object.keys(mappingFlow.overrides).length > 0) {
      fd.append("columnOverrides", JSON.stringify(mappingFlow.overrides));
    }
    setMappingFlow(null);
    void processStreamRequest(fd);
  }

  return (
    <div className="min-h-full flex-1 bg-slate-50">
      {sheetPicker ? (
        <SheetPicker
          fileName={sheetPicker.file.name}
          sheets={sheetPicker.sheets}
          onCancel={() => setSheetPicker(null)}
          onConfirm={(sheet) => {
            const file = sheetPicker.file;
            setSheetPicker(null);
            void startFilePreview(file, sheet).catch((e) =>
              setError(e instanceof Error ? e.message : "Preview failed"),
            );
          }}
        />
      ) : null}

      {mappingFlow ? (
        <ColumnMappingEditor
          preview={mappingFlow.preview}
          overrides={mappingFlow.overrides}
          onChange={(overrides) => setMappingFlow({ ...mappingFlow, overrides })}
          onConfirm={confirmMappingFlow}
          onCancel={() => setMappingFlow(null)}
        />
      ) : null}

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10">
          <header className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              FeedLayer Product 1.5 — shareable catalog audit demo
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
              Turn messy product data into AI-ready feeds.
            </h1>
            <p className="mt-4 text-lg leading-7 text-slate-600">
              Upload CSV or Excel, review column mapping, track real processing progress, and share your audit report link.
            </p>
          </header>

          {mode === "processing" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <ProcessingSteps progress={progress} />
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">What’s happening</div>
                <div className="mt-2 text-sm text-slate-600">
                  Live progress from the server pipeline — including LLM batches when API keys are configured.
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <UploadBox onFileSelected={(file) => void onFileSelected(file)} />
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Paste product listing text</div>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={7}
                    placeholder='Example: "500ml stainless steel insulated bottle..."'
                    className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canSubmitText}
                      onClick={() => processStreamRequest({ type: "text", text: pasteText })}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                        canSubmitText ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-slate-200 text-slate-500",
                      ].join(" ")}
                    >
                      Process text
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasteText("")}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Try sample data</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SampleDataButton
                      label={SAMPLE_HELPERS.sampleCatalogLabel}
                      onClick={() => processStreamRequest({ type: "sample", sample: "catalog" })}
                    />
                    <SampleDataButton
                      label={SAMPLE_HELPERS.sampleTextLabel}
                      onClick={() => processStreamRequest({ type: "sample", sample: "text" })}
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
                    <div className="font-semibold">Couldn’t process input</div>
                    <div className="mt-1">{error}</div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
