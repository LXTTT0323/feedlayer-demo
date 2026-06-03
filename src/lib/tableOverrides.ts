import type { ParsedTable } from "@/lib/parseCsv";
import {
  buildColumnMappingSummaryWithOverrides,
  rowFromValuesWithOverrides,
  type UserColumnOverrides,
  mapHeaderToCanonical,
  normalizeHeaderKey,
  IGNORE_COLUMN,
  CANONICAL_FIELDS,
} from "@/lib/columnMapping";

export type MappingPreviewRow = {
  source: string;
  canonical: string;
  status: "auto" | "override" | "unmapped" | "ignored";
};

export type TablePreview = {
  raw_headers: string[];
  sample_rows: Record<string, string>[];
  suggested: MappingPreviewRow[];
  row_count: number;
  sheet?: string;
};

export function buildTablePreview(table: ParsedTable, sampleSize = 3): TablePreview {
  const headers = table.raw_headers ?? [];
  const sample_rows = table.rows.slice(0, sampleSize).map((r) => r.raw);
  const suggested: MappingPreviewRow[] = headers.map((source) => {
    const auto = mapHeaderToCanonical(source);
    if (auto) return { source, canonical: auto, status: "auto" };
    const norm = normalizeHeaderKey(source);
    return { source, canonical: norm, status: "unmapped" };
  });
  return {
    raw_headers: headers,
    sample_rows,
    suggested,
    row_count: table.rows.length,
    sheet: table.sheet_name,
  };
}

export function applyColumnOverrides(table: ParsedTable, overrides?: UserColumnOverrides): ParsedTable {
  if (!overrides || Object.keys(overrides).length === 0) return table;
  const headers = table.raw_headers ?? [];
  const rows = table.rows.map((row) => {
    const values = headers.map((h) => row.raw[h] ?? "");
    return rowFromValuesWithOverrides(headers, values, overrides);
  });
  return {
    ...table,
    rows,
    column_mapping: buildColumnMappingSummaryWithOverrides(headers, overrides),
  };
}

export { CANONICAL_FIELDS, IGNORE_COLUMN };
