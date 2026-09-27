import { loadImageFromUrl } from "./loadImage";
import { sansFont } from "./fonts";

export type JyseraiPosterData = {
  name: string;
  city: string;
  organization: string;
  message: string;
  photo: HTMLImageElement | null;
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

  // Profile photo in the upper-right corner, away from the central message.
  const photoCenterX = 878;
  const photoCenterY = 238;
  const photoRadius = 98;
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

  // The only central text: no panel, no extra background block.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = sansFont(92, 800);
  ctx.shadowColor = "rgba(0,0,0,0.48)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = COLORS.paper;
  ctx.fillText("J’y serai", WIDTH / 2, 520);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 115, 600);
  ctx.lineTo(WIDTH / 2 + 115, 600);
  ctx.stroke();
}
