"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadBox } from "@/components/UploadBox";
import { SampleDataButton } from "@/components/SampleDataButton";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { saveLastResult } from "@/lib/clientStorage";
import { SAMPLE_HELPERS } from "@/lib/sampleData";
import type { FeedLayerFullReport } from "@/types/report";

type Mode = "idle" | "processing";

export default function HomeClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmitText = useMemo(() => pasteText.trim().length > 10, [pasteText]);

  async function processJson(body: unknown) {
    setError(null);
    setMode("processing");
    setActiveStep(0);
    const tick = window.setInterval(() => {
      setActiveStep((s) => Math.min(5, s + 1));
    }, 450);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Processing failed (${res.status})`);
      }
      const result = (await res.json()) as FeedLayerFullReport;
      saveLastResult(result);
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setMode("idle");
    } finally {
      window.clearInterval(tick);
    }
  }

  async function processFile(file: File) {
    setError(null);
    setMode("processing");
    setActiveStep(0);
    const tick = window.setInterval(() => {
      setActiveStep((s) => Math.min(5, s + 1));
    }, 450);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/process", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Processing failed (${res.status})`);
      }
      const result = (await res.json()) as FeedLayerFullReport;
      saveLastResult(result);
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setMode("idle");
    } finally {
      window.clearInterval(tick);
    }
  }

  return (
    <div className="min-h-full flex-1 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10">
          <header className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              FeedLayer Product 1.0 — catalog audit pilot
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
              Turn messy product data into AI-ready feeds.
            </h1>
            <p className="mt-4 text-lg leading-7 text-slate-600">
              Upload a spreadsheet (CSV or Excel) or paste product listing text. FeedLayer maps columns, normalizes prices and
              availability, scores readiness, and produces a separated feed plus audit report for pilot sellers.
            </p>
            <div className="mt-5 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Coming later:</span> multi-sheet picker, PDFs, images, and
              marketplace connectors.
            </div>
          </header>

          {mode === "processing" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <ProcessingSteps activeIndex={activeStep} />
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">What’s happening</div>
                <div className="mt-2 text-sm text-slate-600">
                  Reading rows, mapping headers, optional LLM enrichment, validating, scoring, and building separated exports
                  (AI-ready feed vs readiness report).
                </div>
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Designed for small–medium catalogs (100+ SKUs per run). Large files may take longer when LLM is enabled.
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <UploadBox onFileSelected={(file) => processFile(file)} />

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Paste product listing text</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Paste unstructured text and we’ll extract a structured product record (rules first; optional LLM when
                    configured).
                  </div>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={7}
                    placeholder='Example: "500ml stainless steel insulated bottle, black and white colors, ... selling price $19.99"'
                    className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canSubmitText}
                      onClick={() => processJson({ type: "text", text: pasteText })}
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
                  <div className="mt-1 text-sm text-slate-600">
                    Load an intentionally messy sample catalog (CSV) or a short listing paragraph.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SampleDataButton
                      label={SAMPLE_HELPERS.sampleCatalogLabel}
                      onClick={() => processJson({ type: "sample", sample: "catalog" })}
                    />
                    <SampleDataButton
                      label={SAMPLE_HELPERS.sampleTextLabel}
                      onClick={() => processJson({ type: "sample", sample: "text" })}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">What you’ll get</div>
                  <div className="mt-4 grid gap-3">
                    {[
                      "AI-ready feed JSON (prices in minor units, no embedded readiness)",
                      "Readiness report JSON (per-product scores, missing fields, suggestions)",
                      "Summary KPIs + product table + row-level audit drawer",
                      "OpenAI-style feed preview (not an official integration)",
                      "Three download buttons (feed / readiness / full report)",
                    ].map((x) => (
                      <div key={x} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-600" />
                        <div className="text-sm font-medium text-slate-800">{x}</div>
                      </div>
                    ))}
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

          <footer className="pt-2 text-xs text-slate-500">
            Optional LLM: set <span className="font-mono">OPENAI_API_KEY</span>, <span className="font-mono">ANTHROPIC_API_KEY</span>, or{" "}
            <span className="font-mono">GOOGLE_GENERATIVE_AI_API_KEY</span> on the server. Use{" "}
            <span className="font-mono">FEEDLAYER_LLM_PROVIDER=auto|openai|anthropic|google</span> to choose.
          </footer>
        </div>
      </div>
    </div>
  );
}
