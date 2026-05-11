import { parseCsvToTable, type ParsedTable } from "@/lib/parseCsv";
import { parseXlsxFirstSheet } from "@/lib/parseExcel";
import {
  extractFromTableRows,
  extractFromListingText,
  extractFromCsvRows,
  type CatalogAudit,
} from "@/lib/extractProductData";
import type { FeedLayerProduct } from "@/types/product";
import { normalizeProducts } from "@/lib/normalizeProductData";
import { validateProducts } from "@/lib/validateFeed";
import { scoreProducts } from "@/lib/scoreReadiness";
import { buildFullReport } from "@/lib/buildFullReport";
import { enrichDraftProductsWithOptionalLlm } from "@/lib/llm/enrichCatalog";
import { SAMPLE_CSV, SAMPLE_TEXT } from "@/lib/sampleData";
import type { FeedLayerFullReport, FeedInputType } from "@/types/report";

type Draft = Omit<FeedLayerProduct, "readiness">;

export async function runCatalogPipeline(args: {
  kind: "csv_text" | "xlsx_buffer" | "text" | "sample_catalog" | "sample_text";
  csvText?: string;
  xlsxBuffer?: ArrayBuffer;
  text?: string;
}): Promise<FeedLayerFullReport> {
  let table: ParsedTable = { rows: [], column_mapping: { fields: [] } };
  let inputType: FeedInputType = "csv";
  let audits: Record<string, CatalogAudit> = {};
  let drafts: Draft[] = [];

  if (args.kind === "csv_text") {
    table = parseCsvToTable(args.csvText ?? "");
    inputType = "csv";
    const ex = extractFromTableRows(table.rows);
    audits = ex.audits;
    drafts = ex.products;
  } else if (args.kind === "xlsx_buffer") {
    table = parseXlsxFirstSheet(args.xlsxBuffer ?? new ArrayBuffer(0));
    inputType = "xlsx";
    const ex = extractFromTableRows(table.rows);
    audits = ex.audits;
    drafts = ex.products;
  } else if (args.kind === "text") {
    inputType = "text";
    const ex = extractFromListingText(args.text ?? "");
    audits = ex.audits;
    drafts = ex.products;
  } else if (args.kind === "sample_text") {
    inputType = "sample";
    const ex = extractFromListingText(SAMPLE_TEXT);
    audits = ex.audits;
    drafts = ex.products;
  } else {
    inputType = "sample";
    table = parseCsvToTable(SAMPLE_CSV);
    const ex = extractFromTableRows(table.rows);
    audits = ex.audits;
    drafts = ex.products;
  }

  if (drafts.length === 0) {
    throw new Error("NO_PRODUCT_ROWS");
  }

  let normalized = normalizeProducts(drafts);
  normalized = await enrichDraftProductsWithOptionalLlm(normalized);
  const validated = validateProducts(normalized);
  const scored = scoreProducts(validated.products);

  return buildFullReport({
    products: scored.products,
    overallScore: scored.overallScore,
    column_mapping: table.column_mapping,
    input: {
      type: inputType,
      product_count: scored.products.length,
      sheet: inputType === "xlsx" ? table.sheet_name : undefined,
    },
    rollup: validated.rollup,
    audits,
  });
}

/** Legacy path for tests that only need canonical rows (no mapping metadata). */
export function runRulesOnlyFromCsvRows(csvText: string) {
  const rows = parseCsvToTable(csvText).rows.map((r) => r.canonical);
  return extractFromCsvRows(rows);
}
