import { loadImageFromUrl } from "./loadImage";
import { sansFont } from "./fonts";

export type JyseraiPosterData = {
  name: string;
  city: string;
  organization: string;
  message: string;
  photo: HTMLImageElement | null;
  /** Live-preview adjustments: scale is relative to the default photo size. */
  photoScale?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  hashtag: string;
};

const WIDTH = 1080;
const HEIGHT = 1080;

const COLORS = {
  ink: "#130F2D",
  paper: "#FFFFFF",
  blue: "#0097D7",
  blueLight: "#33B5E8",
  gold: "#EFC40F",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

/**
 * J'y serai template: the supplied artwork stays visible without a panel.
 * The participant photo is placed in the upper-right corner and the
 * participation statement is centered over the artwork.
 */
export async function drawJyseraiPoster(
  canvas: HTMLCanvasElement,
  data: JyseraiPosterData
) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const background = await loadImageFromUrl("/jyserai.jpeg");
  const scale = Math.max(WIDTH / background.width, HEIGHT / background.height);
  const drawWidth = background.width * scale;
  const drawHeight = background.height * scale;
  ctx.drawImage(background, (WIDTH - drawWidth) / 2, (HEIGHT - drawHeight) / 2, drawWidth, drawHeight);

  // Profile photo in the right side, vertically centered. The live editor
  // can adjust the size and offsets without changing the final generator.
  const photoRadius = Math.round(200 * clamp(data.photoScale ?? 1, 0.5, 1.4));
  const photoCenterX = clamp(
    915 + (data.photoOffsetX ?? 0),
    photoRadius + 24,
    WIDTH - photoRadius - 24
  );
  const photoCenterY = clamp(
    HEIGHT / 2 + (data.photoOffsetY ?? 0),
    photoRadius + 24,
    HEIGHT - photoRadius - 24
  );
  ctx.save();
  ctx.beginPath();
  ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.clip();

  if (data.photo) {
    const photoScale = Math.max(
      (photoRadius * 2) / data.photo.width,
      (photoRadius * 2) / data.photo.height
    );
    const photoWidth = data.photo.width * photoScale;
    const photoHeight = data.photo.height * photoScale;
    ctx.drawImage(
      data.photo,
      photoCenterX - photoWidth / 2,
      photoCenterY - photoHeight / 2,
      photoWidth,
      photoHeight
    );
  } else {
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(photoCenterX - photoRadius, photoCenterY - photoRadius, photoRadius * 2, photoRadius * 2);
    ctx.fillStyle = COLORS.paper;
    ctx.font = sansFont(70, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      data.name ? data.name.charAt(0).toUpperCase() : "J",
      photoCenterX,
      photoCenterY + 4
    );
  }
  ctx.restore();

  ctx.strokeStyle = COLORS.blueLight;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
  ctx.stroke();
}
