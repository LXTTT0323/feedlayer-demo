import * as XLSX from "xlsx";
import { buildColumnMappingSummary, rowFromValues, type TableRow } from "@/lib/columnMapping";
import type { ParsedTable } from "@/lib/parseCsv";

/**
 * Parse first worksheet of an .xlsx workbook into the same `TableRow` shape as CSV.
 * Sheet selection UI can be added later by passing `sheetName`.
 */
export function parseXlsxFirstSheet(buffer: ArrayBuffer, sheetName?: string): ParsedTable {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const name = sheetName ?? wb.SheetNames[0];
  if (!name) {
    return { rows: [], column_mapping: { fields: [] } };
  }
  const sheet = wb.Sheets[name];
  if (!sheet) {
    return { rows: [], column_mapping: { fields: [] } };
  }
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false }) as string[][];
  if (!aoa || aoa.length === 0) {
    return { rows: [], column_mapping: { fields: [] } };
  }

  const rawHeaders = (aoa[0] ?? []).map((c) => String(c ?? "").trim());
  const column_mapping = buildColumnMappingSummary(rawHeaders);

  const rows: TableRow[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const line = aoa[r] ?? [];
    const values = rawHeaders.map((_, i) => String(line[i] ?? "").trim());
    if (values.every((v) => v === "")) continue;
    rows.push(rowFromValues(rawHeaders, values));
  }
  return { rows, column_mapping, sheet_name: name };
}
