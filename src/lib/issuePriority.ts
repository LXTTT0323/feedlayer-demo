const BLOCKING_PATTERNS = [
  /^product_id$/,
  /^title$/,
  /^description$/,
  /^category$/,
  /^variants$/,
  /^media\[0\]\.url$/,
  /variants\[\d+\]\.price/,
  /variants\[\d+\]\.availability/,
  /variants\[\d+\]\.variant_id/,
];

const ADVISORY_PATTERNS = [
  /policy/,
  /buyer_intent/,
  /comparison_fields/,
  /alt_text/,
  /attributes\./,
  /weak/i,
];

export type IssueTier = "blocking" | "advisory" | "other";

export function classifyIssue(field: string): IssueTier {
  if (BLOCKING_PATTERNS.some((re) => re.test(field))) return "blocking";
  if (ADVISORY_PATTERNS.some((re) => re.test(field))) return "advisory";
  return "other";
}

export function groupIssues(fields: string[]): Record<IssueTier, string[]> {
  const out: Record<IssueTier, string[]> = { blocking: [], advisory: [], other: [] };
  for (const f of fields) {
    out[classifyIssue(f)].push(f);
  }
  return out;
}

export const TIER_LABELS: Record<IssueTier, string> = {
  blocking: "Blocks AI-ready feed",
  advisory: "Recommended improvements",
  other: "Other gaps",
};
