import type { FeedLayerFullReport } from "@/types/report";
import { feedToCsv, readinessToCsv } from "@/lib/exportCsv";

export type ExportKind = "feed-json" | "feed-csv" | "readiness-json" | "readiness-csv" | "full-json";

export type ExportFormat = "json" | "csv";

export type ExportDefinition = {
  id: ExportKind;
  label: string;
  filename: string;
  description: string;
  format: ExportFormat;
  mime: string;
  getText: (report: FeedLayerFullReport) => string;
  getDownloadData: (report: FeedLayerFullReport) => string | unknown;
};

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
  return out;
}

export function parseCsvPreview(csv: string, maxRows = 12): { headers: string[]; rows: string[][]; totalRows: number } {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };
  const headers = splitCsvLine(lines[0] ?? "");
  const dataLines = lines.slice(1);
  return {
    headers,
    rows: dataLines.slice(0, maxRows).map((l) => splitCsvLine(l)),
    totalRows: dataLines.length,
  };
}

export function truncateJsonPreview(text: string, maxChars = 12000): { shown: string; truncated: boolean } {
  if (text.length <= maxChars) return { shown: text, truncated: false };
  return { shown: `${text.slice(0, maxChars)}\n\n… (${text.length - maxChars} more characters — download for full file)`, truncated: true };
}

export const EXPORT_DEFINITIONS: ExportDefinition[] = [
  {
    id: "feed-json",
    label: "AI-ready feed JSON",
    filename: "feedlayer-ai-ready-feed.json",
    description: "Clean product feed for integrations. Prices in minor units; no readiness scores embedded.",
    format: "json",
    mime: "application/json",
    getText: (r) => JSON.stringify(r.ai_ready_feed, null, 2),
    getDownloadData: (r) => r.ai_ready_feed,
  },
  {
    id: "feed-csv",
    label: "AI-ready feed CSV",
    filename: "feedlayer-ai-ready-feed.csv",
    description: "One row per variant — open in Excel to review or share with ops teams.",
    format: "csv",
    mime: "text/csv",
    getText: feedToCsv,
    getDownloadData: feedToCsv,
  },
  {
    id: "readiness-json",
    label: "Readiness report JSON",
    filename: "feedlayer-readiness-report.json",
    description: "Per-product scores, missing fields, warnings, and audit snapshots.",
    format: "json",
    mime: "application/json",
    getText: (r) => JSON.stringify(r.readiness_report, null, 2),
    getDownloadData: (r) => r.readiness_report,
  },
  {
    id: "readiness-csv",
    label: "Readiness audit CSV",
    filename: "feedlayer-readiness-audit.csv",
    description: "Spreadsheet-friendly audit — one row per product with issues summarized.",
    format: "csv",
    mime: "text/csv",
    getText: readinessToCsv,
    getDownloadData: readinessToCsv,
  },
  {
    id: "full-json",
    label: "Full FeedLayer report JSON",
    filename: "feedlayer-full-report.json",
    description: "Everything: feed, readiness, mapping, summary, and metadata in one file.",
    format: "json",
    mime: "application/json",
    getText: (r) => JSON.stringify(r, null, 2),
    getDownloadData: (r) => r,
  },
];

export function getExportDefinition(id: ExportKind): ExportDefinition {
  const def = EXPORT_DEFINITIONS.find((d) => d.id === id);
  if (!def) throw new Error(`Unknown export: ${id}`);
  return def;
}
