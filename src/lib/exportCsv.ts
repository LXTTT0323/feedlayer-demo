import type { FeedLayerFullReport } from "@/types/report";

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function row(cells: string[]): string {
  return cells.map((c) => csvEscape(c)).join(",");
}

/** Flatten AI-ready feed (one row per variant). */
export function feedToCsv(report: FeedLayerFullReport): string {
  const headers = [
    "product_id",
    "variant_id",
    "title",
    "description",
    "category",
    "currency",
    "price_major",
    "price_minor",
    "availability",
    "color",
    "size",
    "material",
    "image_url",
  ];
  const lines = [row(headers)];
  for (const p of report.ai_ready_feed) {
    for (const v of p.variants) {
      lines.push(
        row([
          p.product_id,
          v.variant_id,
          v.title ?? p.title ?? "",
          p.description ?? "",
          p.category ?? "",
          v.price?.currency ?? "",
          v.price ? String(v.price.amount_major) : "",
          v.price ? String(v.price.amount_minor) : "",
          v.availability ?? "",
          v.options?.color ?? p.attributes?.color ?? "",
          v.options?.size ?? p.attributes?.size ?? "",
          p.attributes?.material ?? "",
          p.media?.[0]?.url ?? "",
        ]),
      );
    }
  }
  return lines.join("\n") + "\n";
}

/** Readiness audit spreadsheet (one row per product). */
export function readinessToCsv(report: FeedLayerFullReport): string {
  const headers = ["product_id", "title", "score", "missing_fields", "warnings", "suggestions"];
  const lines = [row(headers)];
  for (const p of report.readiness_report.products) {
    lines.push(
      row([
        p.product_id,
        p.title ?? "",
        String(p.readiness.score),
        p.readiness.missing_fields.join("; "),
        p.readiness.warnings.join("; "),
        p.readiness.suggestions.join("; "),
      ]),
    );
  }
  return lines.join("\n") + "\n";
}
