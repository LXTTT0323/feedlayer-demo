import { buildColumnMappingSummary, rowFromValues, type TableRow } from "@/lib/columnMapping";

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type ParsedTable = {
  rows: TableRow[];
  column_mapping: ReturnType<typeof buildColumnMappingSummary>;
  /** Set when source is XLSX (first sheet name). */
  sheet_name?: string;
  /** Original header row order (CSV/XLSX). */
  raw_headers: string[];
};

export function parseCsvToTable(csvText: string): ParsedTable {
  const trimmed = csvText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { rows: [], column_mapping: { fields: [] }, raw_headers: [] };
  }
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], column_mapping: { fields: [] }, raw_headers: [] };
  }

  const rawHeaders = splitCsvLine(lines[0]).map((h) => h.trim());
  const column_mapping = buildColumnMappingSummary(rawHeaders);

  const rows: TableRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    rows.push(rowFromValues(rawHeaders, cols));
  }
  return { rows, column_mapping, raw_headers: rawHeaders };
}

/** @deprecated Use parseCsvToTable for mapping metadata; kept for scripts/tests. */
export function parseCsvToRows(csvText: string): Record<string, string>[] {
  return parseCsvToTable(csvText).rows.map((r) => r.canonical);
}
