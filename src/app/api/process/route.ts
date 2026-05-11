import { NextResponse } from "next/server";
import { runCatalogPipeline } from "@/lib/processPipeline";

export const runtime = "nodejs";

type JsonBody =
  | { type: "csv"; csvText: string }
  | { type: "text"; text: string }
  | { type: "sample"; sample: "catalog" | "text" };

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof Blob)) {
        return NextResponse.json({ error: "Missing form field \"file\"." }, { status: 400 });
      }
      const name = "name" in file && typeof file.name === "string" ? file.name.toLowerCase() : "";
      const buf = await file.arrayBuffer();
      if (name.endsWith(".xlsx")) {
        const report = await runCatalogPipeline({ kind: "xlsx_buffer", xlsxBuffer: buf });
        return NextResponse.json(report);
      }
      if (name.endsWith(".csv")) {
        const text = new TextDecoder("utf-8").decode(buf);
        const report = await runCatalogPipeline({ kind: "csv_text", csvText: text });
        return NextResponse.json(report);
      }
      return NextResponse.json(
        { error: "Unsupported file type. Upload a .csv or .xlsx file." },
        { status: 400 },
      );
    }

    let body: JsonBody;
    try {
      body = (await req.json()) as JsonBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const inputType = body?.type;
    if (!inputType) return NextResponse.json({ error: "Missing type." }, { status: 400 });

    if (body.type === "csv") {
      const csvText = body.csvText ?? "";
      if (!csvText.trim()) {
        return NextResponse.json({ error: "csvText is empty." }, { status: 400 });
      }
      try {
        const report = await runCatalogPipeline({ kind: "csv_text", csvText });
        return NextResponse.json(report);
      } catch (e) {
        if (e instanceof Error && e.message === "NO_PRODUCT_ROWS") {
          return NextResponse.json(
            {
              error:
                "No data rows found in the CSV. Add at least one row under the header, check the file is not empty, and save as UTF-8 CSV.",
            },
            { status: 400 },
          );
        }
        throw e;
      }
    }

    if (body.type === "text") {
      const text = (body.text ?? "").trim();
      if (text.length < 10) {
        return NextResponse.json(
          { error: "Text is too short. Paste a fuller product description (at least a sentence)." },
          { status: 400 },
        );
      }
      const report = await runCatalogPipeline({ kind: "text", text });
      return NextResponse.json(report);
    }

    const report =
      body.sample === "text"
        ? await runCatalogPipeline({ kind: "sample_text" })
        : await runCatalogPipeline({ kind: "sample_catalog" });
    return NextResponse.json(report);
  } catch (e) {
    if (e instanceof Error && e.message === "NO_PRODUCT_ROWS") {
      return NextResponse.json(
        {
          error:
            "No product rows found. For Excel, ensure the first sheet has a header row and data below it.",
        },
        { status: 400 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}
