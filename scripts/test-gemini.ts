/**
 * Quick Gemini connectivity test (loads .env.local manually).
 * Usage: npx tsx scripts/test-gemini.ts
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
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
const model = process.env.FEEDLAYER_GEMINI_MODEL || "gemini-2.5-pro";

async function main() {
  if (!key) {
    console.error("FAIL: no GEMINI_API_KEY in .env.local");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{ parts: [{ text: 'Reply with JSON only: {"ok":true,"model":"test"}' }] }],
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`FAIL: Gemini HTTP ${res.status}`);
    console.error(text.slice(0, 800));
    process.exit(1);
  }

  const json = JSON.parse(text) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const out = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  console.log("OK  Gemini API reachable");
  console.log("    model:", model);
  console.log("    sample response:", out.slice(0, 120));
}

main().catch((e) => {
  console.error("FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
