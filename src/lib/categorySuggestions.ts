/**
 * Category refinement suggestions anchored to the seller's current category string.
 * Never suggests unrelated top-level taxonomy branches.
 */

function isBroadCategory(cat?: string): boolean {
  if (!cat || !cat.trim()) return true;
  const c = cat.trim().toLowerCase();
  if (c.length <= 3) return true;
  const broad = ["home", "accessories", "fitness", "kitchen", "lighting", "electronics", "beauty", "toys", "sport"];
  return broad.includes(c) || /^misc/i.test(c);
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[/|>\\]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Returns a single suggestion string that extends `currentCategory`, or null if none.
 */
export function anchoredCategorySuggestion(
  currentCategory: string | undefined,
  title: string | undefined,
  description: string | undefined,
): string | null {
  if (!isBroadCategory(currentCategory)) return null;
  const base = (currentCategory ?? "").trim();
  const blob = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  const baseTokens = base ? tokens(base) : [];

  const candidates: string[] = [];

  const push = (suffix: string) => {
    const suffixClean = suffix.trim();
    if (!suffixClean) return;
    if (!base) {
      candidates.push(suffixClean);
      return;
    }
    // Suggestion must be same trail or extend it (prefix match on first token or full string contains base)
    const lower = suffixClean.toLowerCase();
    if (lower.startsWith(base.toLowerCase()) || lower.includes(base.toLowerCase())) {
      candidates.push(suffixClean);
      return;
    }
    if (baseTokens.length > 0) {
      const first = baseTokens[0] ?? "";
      if (first && lower.includes(first)) {
        candidates.push(`${base} / ${suffixClean}`);
        return;
      }
    }
    candidates.push(`${base ? `${base} / ` : ""}${suffixClean}`);
  };

  if (/bottle|insulated|保温杯|水壶|水杯|保温瓶/.test(blob)) push("Drinkware / Insulated bottles");
  else if (/lamp|台灯|桌灯|light/.test(blob)) push("Home / Lighting / Desk lamps");
  else if (/yoga|mat|瑜伽垫/.test(blob)) push("Fitness / Yoga mats");
  else if (/case|cover|手机壳|保护壳/.test(blob)) push("Accessories / Phone cases");
  else if (/blender|mixer|搅拌|榨汁/.test(blob)) push("Kitchen / Blenders & mixers");
  else if (/lamp|bulb|led/.test(blob)) push("Home / Lighting");

  if (candidates.length > 0) return candidates[0] ?? null;

  if (base) {
    return `Keep “${base}” and add one more level (e.g. material + primary use case) so buyers can compare similar items.`;
  }
  return "Add a clearer category path (e.g. “Home / Kitchen / Coffee makers”) based on what you actually sell.";
}
