/**
 * Generates public/test-multisheet.xlsx (2 sheets: metadata + 5-row catalog).
 * Usage: npm run generate:multisheet-xlsx
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const catalogCsv = `product_id,sku,title,desc,price,currency,availability,category,image_url
P-001,SKU-1,Sample Bottle,500ml steel bottle,19.99,USD,in stock,Drinkware,https://example.com/1.jpg
P-002,SKU-2,Desk Lamp,LED lamp,49.00,USD,in stock,Home / Lighting,https://example.com/2.jpg
P-003,SKU-3,Yoga Mat,6mm mat,29.99,USD,out of stock,Fitness,https://example.com/3.jpg
P-004,SKU-4,Phone Case,TPU case,14.99,USD,in stock,Accessories,https://example.com/4.jpg
P-005,SKU-5,Blender,1.5L blender,89.00,USD,limited,Kitchen Appliances,https://example.com/5.jpg`;

const catalogRows = catalogCsv.trim().split("\n").map((line) => line.split(","));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ["note", "This sheet is not the product catalog"],
    ["version", "1.0 test fixture"],
  ]),
  "Readme",
);
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catalogRows), "Products");

const out = join(process.cwd(), "public", "test-multisheet.xlsx");
writeFileSync(out, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
console.log(`Wrote ${out} (sheets: Readme, Products)`);
