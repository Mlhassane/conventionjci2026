/**
 * Rogne les marges d'un logo — pixels transparents ou blanc de fond — pour
 * qu'il occupe toute la boîte dans laquelle il est dessiné.
 *
 * Indispensable pour les logos JCI Niger / JCI Maradi : leurs fichiers
 * comportent de larges marges, sans quoi ils paraissent bien plus petits
 * que le logo de la Convention.
 */
export function trimLogoEdges(image: HTMLImageElement): HTMLCanvasElement {
  const limit = 900;
  const ratio = Math.min(1, limit / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.drawImage(image, 0, 0, width, height);

  try {
    const { data } = ctx.getImageData(0, 0, width, height);
    const isEmpty = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      // Transparent, ou blanc d'un ancien fond JPEG.
      return (
        data[i + 3] < 8 ||
        (data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 230)
      );
    };
    const rowIsEmpty = (y: number) => {
      for (let x = 0; x < width; x += 1) if (!isEmpty(x, y)) return false;
      return true;
    };
    const colIsEmpty = (x: number) => {
      for (let y = 0; y < height; y += 1) if (!isEmpty(x, y)) return false;
      return true;
    };

    let top = 0;
    let bottom = height - 1;
    let left = 0;
    let right = width - 1;
    while (top < bottom && rowIsEmpty(top)) top += 1;
    while (bottom > top && rowIsEmpty(bottom)) bottom -= 1;
    while (left < right && colIsEmpty(left)) left += 1;
    while (right > left && colIsEmpty(right)) right -= 1;

    const cropped = document.createElement("canvas");
    cropped.width = right - left + 1;
    cropped.height = bottom - top + 1;
    cropped
      .getContext("2d")
      ?.drawImage(
        canvas,
        left,
        top,
        cropped.width,
        cropped.height,
        0,
        0,
        cropped.width,
        cropped.height
      );
    return cropped;
  } catch {
    return canvas;
  }
}