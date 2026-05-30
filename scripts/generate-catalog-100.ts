/**
 * Generates public/test-catalog-100.csv (100 SKU rows, messy headers/values).
 * Usage: npm run generate:catalog-100
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const headers = [
  "product_id",
  "sku",
  "product_name",
  "desc",
  "amount",
  "currency",
  "stock",
  "category",
  "img",
  "colour",
  "material",
  "return_policy_url",
  "shipping_policy_url",
];

const categories = ["Drinkware", "Home / Lighting", "Fitness", "Accessories", "Kitchen Appliances", "Misc"];
const colours = ["Black", "White", "Blue", "Green", "Red", ""];
const materials = ["stainless steel", "plastic", "TPU", "ABS plastic", "cotton", ""];

const lines: string[] = [headers.join(",")];

for (let i = 1; i <= 100; i++) {
  const pid = `P-${String(i).padStart(3, "0")}`;
  const sku = `SKU-${i}`;
  const title = `Sample Product ${i} — ${["Bottle", "Lamp", "Mat", "Case", "Blender"][i % 5]}`;
  const desc = i % 7 === 0 ? "" : `Demo description for catalog row ${i}. Features vary by SKU.`;
  const price = (9.99 + (i % 50)).toFixed(2);
  const currency = i % 11 === 0 ? "EUR" : "USD";
  const stock = ["in stock", "out of stock", "limited", "preorder", ""][i % 5];
  const category = categories[i % categories.length]!;
  const img = i % 9 === 0 ? "" : `https://images.example.com/p-${i}.jpg`;
  const colour = colours[i % colours.length]!;
  const material = materials[i % materials.length]!;
  const ret = i % 4 === 0 ? "" : "https://example.com/returns";
  const ship = i % 5 === 0 ? "" : "https://example.com/shipping";

  const row = [pid, sku, title, desc, price, currency, stock, category, img, colour, material, ret, ship].map(
    (v) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    },
  );
  lines.push(row.join(","));
}

const out = join(process.cwd(), "public", "test-catalog-100.csv");
writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${lines.length - 1} data rows to ${out}`);
