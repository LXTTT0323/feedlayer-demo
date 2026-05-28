/**
 * Test enrichCatalog LLM path with .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { extractFromListingText } from "../src/lib/extractProductData";
import { normalizeProducts } from "../src/lib/normalizeProductData";
import { enrichDraftProductsWithOptionalLlm } from "../src/lib/llm/enrichCatalog";

function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

loadEnvLocal();

const text =
  "500ml stainless steel insulated bottle, black, selling price $19.99, in stock.";
const { products } = extractFromListingText(text);
const normalized = normalizeProducts(products);

enrichDraftProductsWithOptionalLlm(normalized).then((out) => {
  const p = out[0];
  if (!p) {
    console.error("FAIL: no product");
    process.exit(1);
  }
  const hasIntent = (p.buyer_intent?.length ?? 0) > 0;
  console.log("OK  enrichCatalog via Gemini");
  console.log("    model env:", process.env.FEEDLAYER_GEMINI_MODEL);
  console.log("    buyer_intent:", p.buyer_intent);
  console.log("    comparison_fields:", p.comparison_fields);
  if (!hasIntent && normalized[0]?.buyer_intent?.length) {
    console.log("    (buyer_intent unchanged from rules — LLM may have returned same data)");
  }
});
