export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image_load_failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Loads an image from a remote URL (e.g. the participant photo stored in
 * Supabase Storage) so generators can prefill it. Requires the host to
 * serve CORS headers (Supabase Storage does).
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}
