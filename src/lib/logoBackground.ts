"use client";

/**
 * Suppression de l'arrière-plan d'un logo — traitement 100 % navigateur.
 *
 * Principe : on part des quatre coins de l'image, on propage (remplissage par
 * flood fill) sur tous les pixels voisins dont la couleur est proche de celle
 * du coin, puis on rend ces pixels transparents. Les contours reçoivent un
 * lissage léger pour éviter un contour dur.
 *
 * Fonctionne très bien sur un fond uni (blanc, noir, gris clair) ; inutile
 * sur une photo complexe, où il vaut mieux un modèle de segmentation.
 */

export type RemoveBackgroundOptions = {
  /** Tolérance de couleur, 0-100. */
  tolerance?: number;
  /** Lissage du contour, 0-100. */
  smoothness?: number;
};

export type BackgroundResult = {
  dataUrl: string;
  /** Part de pixels devenus transparents, en pourcentage. */
  removedRatio: number;
  width: number;
  height: number;
};

type Rgb = { r: number; g: number; b: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Nécessaire pour garder un canvas lisible (pas "tainted") : le bucket
    // public Supabase renvoie des en-têtes CORS permissifs.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = src;
  });
}

function cornerColors(data: Uint8ClampedArray, width: number, height: number): Rgb[] {
  const points = [
    0,
    width - 1,
    (height - 1) * width,
    (height - 1) * width + (width - 1),
  ];
  return points.map((index) => ({
    r: data[index * 4],
    g: data[index * 4 + 1],
    b: data[index * 4 + 2],
  }));
}

function distance(a: Rgb, b: Rgb) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function closest(color: Rgb, seeds: Rgb[]) {
  let best = Infinity;
  for (const seed of seeds) {
    const d = distance(color, seed);
    if (d < best) best = d;
  }
  return best;
}

/** Supprime le fond d'un logo et renvoie un PNG transparent. */
export async function removeLogoBackground(
  src: string,
  options: RemoveBackgroundOptions = {}
): Promise<BackgroundResult> {
  const tolerance = options.tolerance ?? 18;
  const smoothness = options.smoothness ?? 60;

  const img = await loadImage(src);
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  if (!width || !height) throw new Error("Image vide");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const maxDistance = 441.67; // distance maximale entre (0,0,0) et (255,255,255)
  const threshold = (tolerance / 100) * maxDistance;

  const seeds = cornerColors(data, width, height);
  // Un seuil minuscule ne retirerait rien d'utile : on évite le bruit.
  if (threshold < 6) throw new Error("Tolérance trop faible");

  const total = width * height;
  const visited = new Uint8Array(total);
  const stack: number[] = [];

  const pushIfBackground = (index: number) => {
    if (index < 0 || index >= total || visited[index]) return;
    const p = index * 4;
    if (data[p + 3] === 0) {
      visited[index] = 1;
      stack.push(index);
      return;
    }
    const color = { r: data[p], g: data[p + 1], b: data[p + 2] };
    if (closest(color, seeds) <= threshold) {
      visited[index] = 1;
      stack.push(index);
    }
  };

  // amorçage : tous les pixels du bord, pas seulement les coins
  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x);
    pushIfBackground((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    pushIfBackground(y * width);
    pushIfBackground(y * width + (width - 1));
  }

  // flood fill
  while (stack.length) {
    const index = stack.pop() as number;
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) pushIfBackground(index - 1);
    if (x < width - 1) pushIfBackground(index + 1);
    if (y > 0) pushIfBackground(index - width);
    if (y < height - 1) pushIfBackground(index + width);
  }

  // Lissage : les pixels non transparents mais proches du fond deviennent
  // progressivement translucides, ce qui supprime la bordure blanche/black.
  if (smoothness > 0) {
    const feather = (smoothness / 100) * threshold;
    const alphaCopy = new Uint8Array(total);
    for (let i = 0; i < total; i += 1) alphaCopy[i] = data[i * 4 + 3];

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const p = index * 4;
        if (alphaCopy[index] === 0) continue;

        const nearTransparent =
          alphaCopy[index - 1] === 0 ||
          alphaCopy[index + 1] === 0 ||
          alphaCopy[index - width] === 0 ||
          alphaCopy[index + width] === 0;
        if (!nearTransparent) continue;

        const color = { r: data[p], g: data[p + 1], b: data[p + 2] };
        const d = closest(color, seeds);
        if (d >= feather) continue;

        const ratio = 1 - d / feather; // 0 = fond, 1 = sujet
        data[p + 3] = Math.round(255 * Math.min(1, Math.max(0, ratio * 1.4)));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  let removed = 0;
  for (let i = 0; i < total; i += 1) {
    if (data[i * 4 + 3] === 0) removed += 1;
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    removedRatio: (removed / total) * 100,
    width,
    height,
  };
}

/** Convertit le résultat en File prêt à être envoyé sur Supabase. */
export function dataUrlToFile(dataUrl: string, name: string): File {
  const [header, payload] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(header)?.[1] ?? "image/png";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}
