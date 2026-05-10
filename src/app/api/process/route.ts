import { NextResponse } from "next/server";
import { parseCsvToRows } from "@/lib/parseCsv";
import { extractFromCsvRows, extractFromListingText } from "@/lib/extractProductData";
import { normalizeProducts } from "@/lib/normalizeProductData";
import { validateProducts } from "@/lib/validateFeed";
import { scoreProducts, scoreStatus } from "@/lib/scoreReadiness";
import { SAMPLE_CSV, SAMPLE_TEXT } from "@/lib/sampleData";
import type { FeedLayerResult } from "@/types/product";

type ProcessRequest =
  | { type: "csv"; csvText: string }
  | { type: "text"; text: string }
  | { type: "sample"; sample: "catalog" | "text" };

export async function POST(req: Request) {
  let body: ProcessRequest | null = null;
  try {
    body = (await req.json()) as ProcessRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputType = body?.type;
  if (!inputType) return NextResponse.json({ error: "Missing type" }, { status: 400 });

  let products;
  if (body.type === "csv") {
    const rows = parseCsvToRows(body.csvText ?? "");
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No data rows found in the CSV. Add at least one row under the header, check the file is not empty, and save as UTF-8 CSV.",
        },
        { status: 400 },
      );
    }
    products = extractFromCsvRows(rows);
  } else if (body.type === "text") {
    const text = (body.text ?? "").trim();
    if (text.length < 10) {
      return NextResponse.json(
        { error: "Text is too short. Paste a fuller product description (at least a sentence)." },
        { status: 400 },
      );
    }
    products = extractFromListingText(text);
  } else {
    if (body.sample === "text") products = extractFromListingText(SAMPLE_TEXT);
    else products = extractFromCsvRows(parseCsvToRows(SAMPLE_CSV));
  }

  const normalized = normalizeProducts(products);
  const validated = validateProducts(normalized);
  const scored = scoreProducts(validated.products);

  const result: FeedLayerResult = {
    processed_at: new Date().toISOString(),
    input: {
      type: body.type === "sample" ? "sample" : body.type,
      product_count: scored.products.length,
    },
    summary: {
      products_processed: scored.products.length,
      missing_fields_total: validated.rollup.missing_fields_total,
      variant_issues_total: validated.rollup.variant_issues_total,
      weak_descriptions_total: validated.rollup.weak_descriptions_total,
      missing_policies_total: validated.rollup.missing_policies_total,
    },
    overall: {
      score: scored.overallScore,
      status: scoreStatus(scored.overallScore),
    },
    products: scored.products,
  };

  return NextResponse.json(result);
}

