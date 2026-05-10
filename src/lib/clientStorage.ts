import type { FeedLayerResult } from "@/types/product";

const KEY = "feedlayer:lastResult";

export function saveLastResult(result: FeedLayerResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadLastResult(): FeedLayerResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FeedLayerResult;
  } catch {
    return null;
  }
}

export function clearLastResult() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

