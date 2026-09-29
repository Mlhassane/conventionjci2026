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

/**
 * next/font enregistre les faces sous un nom interne
 * (`__Plus_Jakarta_Sans_xxxx`) : c'est ce nom que le canvas doit utiliser,
 * pas le nom « logique » contenu dans la variable CSS.
 */
function registeredFamily(needle: string, fallback: string): string {
  if (typeof document === "undefined" || !document.fonts) return fallback;
  for (const face of Array.from(document.fonts)) {
    if (face.family.toLowerCase().includes(needle.toLowerCase())) return face.family;
  }
  return fallback;
}

let sansFamily: string | null = null;
let quoteFamily: string | null = null;

/**
 * Charge réellement les polices JCI avant un rendu canvas.
 *
 * `document.fonts.ready` ne fait qu'attendre les polices déjà demandées par la
 * page : sans appel explicite, le canvas retombe sur la police par défaut
 * (serif) et les visuels / badges sont imprimés avec la mauvaise typographie.
 */
export async function ensureCanvasFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;

  sansFamily = registeredFamily(
    "jakarta",
    familyFromVar("--font-jakarta", "Plus Jakarta Sans")
  );
  quoteFamily = registeredFamily("arvo", familyFromVar("--font-arvo", "Arvo"));

  const weights = ["400", "500", "600", "700", "800"];
  await Promise.all([
    ...weights.map((weight) =>
      document.fonts.load(`${weight} 40px "${sansFamily}"`).catch(() => undefined)
    ),
    document.fonts.load(`italic 400 40px "${quoteFamily}"`).catch(() => undefined),
    document.fonts.load(`700 40px "${quoteFamily}"`).catch(() => undefined),
  ]);
  await document.fonts.ready;
}

/** JCI primary typeface (Plus Jakarta Sans) for canvas. */
export function sansFont(size: number, weight: number | string = 400): string {
  const family =
    sansFamily ?? familyFromVar("--font-jakarta", "Plus Jakarta Sans");
  return `${weight} ${size}px "${family}"`;
}

/** JCI secondary typeface (Arvo) for large quotes on canvas. */
export function quoteFont(
  size: number,
  weight: number | string = 400,
  italic = false
): string {
  const family = quoteFamily ?? familyFromVar("--font-arvo", "Arvo");
  return `${italic ? "italic " : ""}${weight} ${size}px "${family}"`;
}
