/**
 * Runs the catalog pipeline (same as POST /api/process logic).
 * Usage: npm run verify
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runCatalogPipeline, runRulesOnlyFromCsvRows } from "../src/lib/processPipeline";
import { parseCsvToTable } from "../src/lib/parseCsv";
import { chunkProducts, llmBatchSize, maxLlmProducts } from "../src/lib/llm/enrichCatalog";
import { listXlsxSheetNames, parseXlsxFirstSheet } from "../src/lib/parseExcel";
import { applyColumnOverrides } from "../src/lib/tableOverrides";
import { saveSharedReport, loadSharedReport } from "../src/lib/shareStore";
import { feedToCsv } from "../src/lib/exportCsv";
import { classifyIssue } from "../src/lib/issuePriority";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function runCase(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}:`, e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
}

async function main() {
  await runCase("Sample catalog: 5 products, v1.5 report shape", async () => {
    const r = await runCatalogPipeline({ kind: "sample_catalog" });
    assert(r.version === "1.5", "version");
    assert(r.ai_ready_feed.length === 5, "5 feed items");
    assert(r.readiness_report.products.length === 5, "5 readiness rows");
    assert(!("readiness" in (r.ai_ready_feed[0] as object)), "no readiness on feed item");
    const v0 = r.ai_ready_feed[0]?.variants[0];
    if (v0?.price) {
      assert(typeof v0.price.amount_minor === "number", "minor units");
    }
    assert(r.summary.variants_detected >= 5, "variants rollup");
  });

  await runCase("Sample text: 1 product, Drinkware", async () => {
    const r = await runCatalogPipeline({ kind: "sample_text" });
    assert(r.ai_ready_feed.length === 1, "one product");
    assert(r.ai_ready_feed[0]?.category === "Drinkware", "category");
  });

  await runCase("Public test CSV file", async () => {
    const csv = readFileSync(join(process.cwd(), "public", "test-feedlayer-sample.csv"), "utf8");
    const r = await runCatalogPipeline({ kind: "csv_text", csvText: csv });
    assert(r.ai_ready_feed.length === 5, "5 products");
  });

  await runCase("English paste pipeline", async () => {
    const text =
      "500ml stainless steel bottle, black, selling price $19.99, in stock.";
    const r = await runCatalogPipeline({ kind: "text", text });
    const v = r.ai_ready_feed[0]?.variants[0];
    assert(v?.price?.currency === "USD" && v.price.amount_minor === 1999, "usd minor");
    assert(v?.availability === "in_stock", "availability enum");
  });

  await runCase("Chinese paste: CNY minor", async () => {
    const text = "500毫升不锈钢保温杯，曜石黑，售价人民币89元，现货。";
    const r = await runCatalogPipeline({ kind: "text", text });
    const v = r.ai_ready_feed[0]?.variants[0];
    assert(v?.price?.currency === "CNY" && v.price.amount_minor === 8900, "cny minor (fen)");
  });

  await runCase("Variant grouping: two rows same product_id", async () => {
    const csv = `product_id,sku,title,desc,price,currency,availability,category,image_url
P-X,SKU-A,Widget,,10,USD,in stock,Cat,https://example.com/a.jpg
P-X,SKU-B,Widget,,12,USD,out of stock,Cat,https://example.com/a.jpg`;
    const r = await runCatalogPipeline({ kind: "csv_text", csvText: csv });
    assert(r.ai_ready_feed.length === 1, "one product");
    assert(r.summary.variants_detected === 2, "two variants");
  });

  await runCase("parseCsv empty", async () => {
    const t = parseCsvToTable("");
    assert(t.rows.length === 0, "empty");
  });

  await runCase("Legacy row-only extract still works", async () => {
    const rows = runRulesOnlyFromCsvRows("product_id,title\nA,Hi");
    assert(rows.length === 1 && rows[0]?.product_id === "A", "legacy");
  });

  await runCase("100-SKU catalog (rules-only, skip LLM)", async () => {
    const csv = readFileSync(join(process.cwd(), "public", "test-catalog-100.csv"), "utf8");
    const r = await runCatalogPipeline({ kind: "csv_text", csvText: csv, skipLlm: true });
    assert(r.ai_ready_feed.length === 100, "100 products");
    assert(r.readiness_report.products.length === 100, "100 readiness rows");
    assert(r.summary.products_processed === 100, "summary count");
    assert(r.version === "1.5", "version");
  });

  await runCase("LLM batch chunking helpers", async () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const chunks = chunkProducts(items, llmBatchSize());
    assert(chunks.length === Math.ceil(100 / llmBatchSize()), "chunk count");
    assert(chunks.flat().length === 100, "all items preserved");
    assert(maxLlmProducts() >= 100, "default max covers 100 SKUs");
  });

  await runCase("Multi-sheet XLSX: sheet list + Products sheet", async () => {
    const buf = readFileSync(join(process.cwd(), "public", "test-multisheet.xlsx"));
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const sheets = listXlsxSheetNames(ab);
    assert(sheets.length === 2, "two sheets");
    assert(sheets.includes("Products"), "Products sheet");
    const table = parseXlsxFirstSheet(ab, "Products");
    assert(table.rows.length === 5, "five product rows on Products sheet");
    const r = await runCatalogPipeline({
      kind: "xlsx_buffer",
      xlsxBuffer: ab,
      sheetName: "Products",
      skipLlm: true,
    });
    assert(r.ai_ready_feed.length === 5, "five products from selected sheet");
    assert(r.input.sheet === "Products", "report sheet name");
  });

  await runCase("Column override: map custom header to title", async () => {
    const csv = `weird_title_col,sku,price,currency,availability,category,image_url
My Product,SKU-1,10,USD,in stock,Cat,https://example.com/x.jpg`;
    const table = parseCsvToTable(csv);
    const remapped = applyColumnOverrides(table, { weird_title_col: "title" });
    const r = await runCatalogPipeline({
      kind: "csv_text",
      csvText: csv,
      columnOverrides: { weird_title_col: "title" },
      skipLlm: true,
    });
    assert(remapped.rows[0]?.canonical.title === "My Product", "override applied");
    assert(r.ai_ready_feed[0]?.title === "My Product", "title extracted");
  });

  await runCase("Share store round-trip", async () => {
    const r = await runCatalogPipeline({ kind: "sample_catalog", skipLlm: true });
    const id = await saveSharedReport(r);
    const loaded = await loadSharedReport(id);
    assert(loaded?.version === "1.5", "shared version");
    assert(loaded?.ai_ready_feed.length === 5, "shared products");
  });

  await runCase("CSV export helpers", async () => {
    const r = await runCatalogPipeline({ kind: "sample_catalog", skipLlm: true });
    const csv = feedToCsv(r);
    assert(csv.includes("product_id"), "feed csv header");
    assert(classifyIssue("variants[0].price.amount") === "blocking", "blocking tier");
  });

  await runCase("Export preview helpers", async () => {
    const { parseCsvPreview, truncateJsonPreview } = await import("../src/lib/previewExport");
    const r = await runCatalogPipeline({ kind: "sample_catalog", skipLlm: true });
    const csv = feedToCsv(r);
    const table = parseCsvPreview(csv, 3);
    assert(table.headers.includes("product_id"), "csv preview headers");
    assert(table.rows.length <= 3, "csv preview row cap");
    const json = JSON.stringify(r.ai_ready_feed);
    const t = truncateJsonPreview(json, 100);
    assert(t.truncated || json.length <= 100, "json truncate");
  });

  console.log("");
  if (process.exitCode === 1) console.error("verify-pipeline: FAILED");
  else console.log("verify-pipeline: all checks passed");
}

main();
