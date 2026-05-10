"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadBox } from "@/components/UploadBox";
import { SampleDataButton } from "@/components/SampleDataButton";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { saveLastResult } from "@/lib/clientStorage";
import { SAMPLE_HELPERS } from "@/lib/sampleData";
import type { FeedLayerResult } from "@/types/product";

type Mode = "idle" | "processing";

async function readFileText(file: File): Promise<string> {
  return await file.text();
}

export default function HomeClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmitText = useMemo(() => pasteText.trim().length > 10, [pasteText]);

  async function process(body: unknown) {
    setError(null);
    setMode("processing");
    setActiveStep(0);

    // Smooth stepper: advance a few steps while request runs.
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
      const result = (await res.json()) as FeedLayerResult;
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
              FeedLayer Product 0.5 Demo
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
              Turn messy product data into AI-ready feeds.
            </h1>
            <p className="mt-4 text-lg leading-7 text-slate-600">
              Upload a spreadsheet or paste product listing data. FeedLayer generates a feed preview, missing-field report,
              and AI commerce readiness score.
            </p>
            <div className="mt-5 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Coming soon:</span> PDFs, images, and supplier URLs (not in v0.5).
            </div>
          </header>

          {mode === "processing" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <ProcessingSteps activeIndex={activeStep} />
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">What’s happening</div>
                <div className="mt-2 text-sm text-slate-600">
                  We read your input, map messy columns, normalize variants and attributes, validate missing fields, then score
                  readiness.
                </div>
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  You’ll get:
                  <ul className="mt-2 list-disc pl-5">
                    <li>AI-ready feed preview</li>
                    <li>Missing-field report</li>
                    <li>Variant + attribute cleanup suggestions</li>
                    <li>Readiness score + downloadable JSON</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <UploadBox
                  onCsvSelected={async (file) => {
                    const text = await readFileText(file);
                    await process({ type: "csv", csvText: text });
                  }}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Paste product listing text</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Paste unstructured text and we’ll extract a structured product record (no hallucinated facts).
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
                      onClick={() => process({ type: "text", text: pasteText })}
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
                    Load an intentionally messy sample to see the before/after transformation instantly.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SampleDataButton
                      label={SAMPLE_HELPERS.sampleCatalogLabel}
                      onClick={() => process({ type: "sample", sample: "catalog" })}
                    />
                    <SampleDataButton
                      label={SAMPLE_HELPERS.sampleTextLabel}
                      onClick={() => process({ type: "sample", sample: "text" })}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">What you’ll get</div>
                  <div className="mt-4 grid gap-3">
                    {[
                      "AI-ready product feed preview",
                      "Missing-field report (per product)",
                      "Variant cleanup suggestions",
                      "Attribute normalization suggestions",
                      "AI commerce readiness score",
                      "Downloadable JSON output",
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
            This demo generates an <span className="font-semibold">AI-ready feed preview</span>. Platform exports and official
            integrations are coming later.
          </footer>
        </div>
      </div>
    </div>
  );
}

