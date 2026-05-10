/**
 * Runs the same pipeline as POST /api/process (no HTTP) to guard regressions.
 * Usage: npm run verify
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseCsvToRows } from "../src/lib/parseCsv";
import { extractFromCsvRows, extractFromListingText } from "../src/lib/extractProductData";
import { normalizeProducts } from "../src/lib/normalizeProductData";
import { validateProducts } from "../src/lib/validateFeed";
import { scoreProducts, scoreStatus } from "../src/lib/scoreReadiness";
import { SAMPLE_CSV, SAMPLE_TEXT } from "../src/lib/sampleData";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function runCase(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}:`, e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
}

function pipeline(csvText?: string, text?: string, sample?: "catalog" | "text") {
  let products;
  if (csvText !== undefined) {
    const rows = parseCsvToRows(csvText);
    assert(rows.length > 0, "csv has no rows");
    products = extractFromCsvRows(rows);
  } else if (text !== undefined) {
    products = extractFromListingText(text);
  } else if (sample === "text") {
    products = extractFromListingText(SAMPLE_TEXT);
  } else {
    products = extractFromCsvRows(parseCsvToRows(SAMPLE_CSV));
  }
  const normalized = normalizeProducts(products);
  const validated = validateProducts(normalized);
  const scored = scoreProducts(validated.products);
  return { scored, rollup: validated.rollup, status: scoreStatus(scored.overallScore) };
}

const publicCsv = readFileSync(join(process.cwd(), "public", "test-feedlayer-sample.csv"), "utf8");

runCase("Sample catalog: 5 products, score 0–100", () => {
  const { scored } = pipeline(undefined, undefined, "catalog");
  assert(scored.products.length === 5, `expected 5 products, got ${scored.products.length}`);
  assert(scored.overallScore >= 0 && scored.overallScore <= 100, "overall score range");
  for (const p of scored.products) {
    assert(p.readiness.score >= 0 && p.readiness.score <= 100, `product score range ${p.product_id}`);
  }
});

runCase("Sample text snippet: 1 product, Drinkware", () => {
  const { scored } = pipeline(undefined, undefined, "text");
  assert(scored.products.length === 1, "one product");
  assert(scored.products[0]?.category === "Drinkware", "category from bottle keywords");
});

runCase("Public test CSV matches sample row count", () => {
  const { scored } = pipeline(publicCsv);
  assert(scored.products.length === 5, "5 grouped products");
});

runCase("English paste: price USD", () => {
  const text =
    "500ml stainless steel bottle, black, selling price $19.99, in stock.";
  const { scored } = pipeline(undefined, text);
  const v = scored.products[0]?.variants[0];
  assert(v?.price?.currency === "USD" && v.price.amount === 19.99, "usd price");
});

runCase("Chinese paste: CNY + capacity", () => {
  const text = "500毫升不锈钢保温杯，曜石黑，售价人民币89元，现货。";
  const { scored } = pipeline(undefined, text);
  const p = scored.products[0];
  assert(p?.attributes.capacity?.includes("500"), "capacity");
  assert(p?.variants[0]?.price?.currency === "CNY", "cny");
  assert(p?.variants[0]?.price?.amount === 89, "amount 89");
});

runCase("Variant grouping: same product_id two rows => 2 variants", () => {
  const csv = `product_id,sku,title,desc,price,currency,availability,category,image_url
P-X,SKU-A,Widget,,10,USD,in stock,Cat,https://example.com/a.jpg
P-X,SKU-B,Widget,,12,USD,out of stock,Cat,https://example.com/a.jpg`;
  const { scored } = pipeline(csv);
  assert(scored.products.length === 1, "one product");
  assert(scored.products[0]?.variants.length === 2, "two variants");
});

runCase("Empty rows: parseCsv returns []", () => {
  const rows = parseCsvToRows("");
  assert(rows.length === 0, "empty");
});

console.log("");
if (process.exitCode === 1) {
  console.error("verify-pipeline: FAILED");
} else {
  console.log("verify-pipeline: all checks passed");
}
