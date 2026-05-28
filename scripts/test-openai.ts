/**
 * Test OpenAI fallback path (loads .env.local).
 * Usage: npx tsx scripts/test-openai.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

async function main() {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.FEEDLAYER_OPENAI_MODEL || "gpt-5.5";
  if (!key) {
    console.error("FAIL: no OPENAI_API_KEY in .env.local");
    process.exit(1);
  }

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: key });

  const res = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: 'Reply JSON only: {"ok":true,"provider":"openai"}',
      },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  if (!text) {
    console.error("FAIL: empty OpenAI response");
    process.exit(1);
  }

  console.log("OK  OpenAI API reachable (fallback/validator path)");
  console.log("    model:", model);
  console.log("    sample response:", text.slice(0, 120));
}

main().catch((e) => {
  console.error("FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
