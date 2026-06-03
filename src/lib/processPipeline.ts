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
import type { UserColumnOverrides } from "@/lib/columnMapping";
import { applyColumnOverrides, buildTablePreview, type TablePreview } from "@/lib/tableOverrides";
import { emitProgress, type ProgressCallback } from "@/lib/processProgress";

type Draft = Omit<FeedLayerProduct, "readiness">;

const EMPTY_TABLE: ParsedTable = { rows: [], column_mapping: { fields: [] }, raw_headers: [] };

export function parseCatalogTable(args: {
  kind: "csv_text" | "xlsx_buffer";
  csvText?: string;
  xlsxBuffer?: ArrayBuffer;
  sheetName?: string;
}): ParsedTable {
  if (args.kind === "csv_text") {
    return parseCsvToTable(args.csvText ?? "");
  }
  return parseXlsxFirstSheet(args.xlsxBuffer ?? new ArrayBuffer(0), args.sheetName);
}

export function buildCatalogPreview(table: ParsedTable): TablePreview {
  return buildTablePreview(table);
}

export async function runCatalogPipeline(args: {
  kind: "csv_text" | "xlsx_buffer" | "text" | "sample_catalog" | "sample_text";
  csvText?: string;
  xlsxBuffer?: ArrayBuffer;
  text?: string;
  skipLlm?: boolean;
  sheetName?: string;
  columnOverrides?: UserColumnOverrides;
  onProgress?: ProgressCallback;
}): Promise<FeedLayerFullReport> {
  const onProgress = args.onProgress;
  let table: ParsedTable = EMPTY_TABLE;
  let inputType: FeedInputType = "csv";
  let audits: Record<string, CatalogAudit> = {};
  let drafts: Draft[] = [];

  emitProgress(onProgress, { step: "parse", index: 1, total: 7, message: "Reading and mapping columns" });

  if (args.kind === "csv_text") {
    table = parseCsvToTable(args.csvText ?? "");
    inputType = "csv";
  } else if (args.kind === "xlsx_buffer") {
    table = parseXlsxFirstSheet(args.xlsxBuffer ?? new ArrayBuffer(0), args.sheetName);
    inputType = "xlsx";
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
  }

  if (args.kind === "csv_text" || args.kind === "xlsx_buffer" || args.kind === "sample_catalog") {
    if (args.columnOverrides && Object.keys(args.columnOverrides).length > 0) {
      table = applyColumnOverrides(table, args.columnOverrides);
    }
    emitProgress(onProgress, { step: "extract", index: 2, total: 7, message: "Extracting product rows" });
    const ex = extractFromTableRows(table.rows);
    audits = ex.audits;
    drafts = ex.products;
  } else {
    emitProgress(onProgress, { step: "extract", index: 2, total: 7, message: "Extracting from text" });
  }

  if (drafts.length === 0) {
    throw new Error("NO_PRODUCT_ROWS");
  }

  emitProgress(onProgress, { step: "normalize", index: 3, total: 7, message: "Normalizing variants and prices" });
  let normalized = normalizeProducts(drafts);

  if (!args.skipLlm) {
    normalized = await enrichDraftProductsWithOptionalLlm(normalized, (batch, total) => {
      emitProgress(onProgress, {
        step: "llm",
        index: batch,
        total,
        message: total > 1 ? `LLM enrichment batch ${batch}/${total}` : "Optional LLM enrichment",
      });
    });
  } else {
    emitProgress(onProgress, { step: "llm", index: 1, total: 1, message: "Skipping LLM (rules only)" });
  }

  emitProgress(onProgress, { step: "validate", index: 5, total: 7, message: "Validating feed rules" });
  const validated = validateProducts(normalized);

  emitProgress(onProgress, { step: "score", index: 6, total: 7, message: "Scoring readiness" });
  const scored = scoreProducts(validated.products);

  emitProgress(onProgress, { step: "report", index: 7, total: 7, message: "Building report" });
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
