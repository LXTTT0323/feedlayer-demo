import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { FeedLayerFullReport } from "@/types/report";

function shareDir(): string {
  return process.env.FEEDLAYER_SHARE_DIR || join(process.cwd(), ".feedlayer-shares");
}

export async function saveSharedReport(report: FeedLayerFullReport): Promise<string> {
  const dir = shareDir();
  await mkdir(dir, { recursive: true });
  const id = randomUUID();
  await writeFile(join(dir, `${id}.json`), JSON.stringify(report), "utf8");
  return id;
}

export async function loadSharedReport(id: string): Promise<FeedLayerFullReport | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const raw = await readFile(join(shareDir(), `${id}.json`), "utf8");
    return JSON.parse(raw) as FeedLayerFullReport;
  } catch {
    return null;
  }
}
