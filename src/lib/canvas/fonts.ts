/** Resolve a next/font CSS variable to a canvas-safe family name. */
function familyFromVar(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  const first = raw
    .split(",")[0]
    .trim()
    .replace(/^["']|["']$/g, "");
  return first || fallback;
}

/** JCI primary typeface (Plus Jakarta Sans) for canvas. */
export function sansFont(size: number, weight: number | string = 400): string {
  const family = familyFromVar("--font-jakarta", "Plus Jakarta Sans");
  return `${weight} ${size}px "${family}"`;
}

/** JCI secondary typeface (Arvo) for large quotes on canvas. */
export function quoteFont(
  size: number,
  weight: number | string = 400,
  italic = false
): string {
  const family = familyFromVar("--font-arvo", "Arvo");
  return `${italic ? "italic " : ""}${weight} ${size}px "${family}"`;
}
