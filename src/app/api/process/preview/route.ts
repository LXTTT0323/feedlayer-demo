import { NextResponse } from "next/server";
import { buildCatalogPreview, parseCatalogTable } from "@/lib/processPipeline";
import { inputFromJson, inputFromMultipart, isTabularInput } from "@/lib/processRequest";

export const runtime = "nodejs";

/** POST — parse only; returns column mapping preview (no LLM). */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let input;
    if (contentType.includes("multipart/form-data")) {
      input = await inputFromMultipart(await req.formData());
    } else {
      input = inputFromJson(await req.json());
    }

    if (!isTabularInput(input)) {
      return NextResponse.json({ error: "Preview is only for CSV/XLSX uploads." }, { status: 400 });
    }

    const table =
      input.mode === "csv_text"
        ? parseCatalogTable({ kind: "csv_text", csvText: input.csvText })
        : parseCatalogTable({
            kind: "xlsx_buffer",
            xlsxBuffer: input.xlsxBuffer,
            sheetName: input.sheetName,
          });

    if (table.rows.length === 0) {
      return NextResponse.json({ error: "No product rows found in this sheet." }, { status: 400 });
    }

    return NextResponse.json(buildCatalogPreview(table));
  } catch (e) {
    if (e instanceof Error && e.message === "UNSUPPORTED_FILE") {
      return NextResponse.json({ error: "Unsupported file type. Upload .csv or .xlsx." }, { status: 400 });
    }
    if (e instanceof Error && e.message === "MISSING_FILE") {
      return NextResponse.json({ error: "Missing file or csvText." }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Preview failed." }, { status: 500 });
  }
}
