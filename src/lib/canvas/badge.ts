import QRCode from "qrcode";
import { sansFont } from "./fonts";

export type BadgeData = {
  name: string;
  role: string;
  organization: string;
  city: string;
  photo: HTMLImageElement | null;
  uniqueCode: string;
  verifyUrl: string;
  eventDateLabel: string;
  location: string;
};

const WIDTH = 1080;
const HEIGHT = 1600;

const COLORS = {
  ink: "#130F2D",    // JCI Black
  paper: "#FFFFFF",  // JCI White
  blue: "#0097D7",   // JCI Blue
  blueLight: "#33B5E8",
};

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function drawBadge(canvas: HTMLCanvasElement, data: BadgeData) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background card
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Top ink band
  const bandHeight = 300;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, WIDTH, bandHeight);

  // blue divider
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, bandHeight - 6, WIDTH, 6);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.blue;
  ctx.font = sansFont(30, 600);
  ctx.letterSpacing = "5px";
  ctx.fillText("JCI NIGER", WIDTH / 2, 100);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = COLORS.paper;
  ctx.font = sansFont(66, 600);
  ctx.fillText("CONVENTION 2026", WIDTH / 2, 175);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = sansFont(26, 500);
  ctx.fillText(
    `${data.eventDateLabel} · ${data.location.toUpperCase()}`,
    WIDTH / 2,
    220
  );

  // Photo
  const photoCenterY = bandHeight + 190;
  const photoRadius = 150;
  ctx.save();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, photoCenterY, photoRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#EAF4FB";
  ctx.fill();
  ctx.clip();
  if (data.photo) {
    const img = data.photo;
    const scale = Math.max(
      (photoRadius * 2) / img.width,
      (photoRadius * 2) / img.height
    );
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, WIDTH / 2 - dw / 2, photoCenterY - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(WIDTH / 2 - photoRadius, photoCenterY - photoRadius, photoRadius * 2, photoRadius * 2);
    ctx.fillStyle = COLORS.blue;
    ctx.font = sansFont(90, 600);
    ctx.textBaseline = "middle";
    ctx.fillText(data.name ? data.name.charAt(0).toUpperCase() : "J", WIDTH / 2, photoCenterY + 8);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, photoCenterY, photoRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Name
  ctx.fillStyle = COLORS.ink;
  ctx.font = sansFont(54, 600);
  ctx.fillText(data.name || "Votre nom", WIDTH / 2, photoCenterY + 220);

  // Role badge pill
  const pillY = photoCenterY + 265;
  ctx.font = sansFont(26, 600);
  const roleText = data.role.toUpperCase();
  const pillWidth = ctx.measureText(roleText).width + 64;
  roundedRectPath(ctx, WIDTH / 2 - pillWidth / 2, pillY - 34, pillWidth, 52, 26);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.fillStyle = COLORS.blue;
  ctx.fillText(roleText, WIDTH / 2, pillY);

  // Organization / city
  ctx.fillStyle = "#3D3859";
  ctx.font = sansFont(28, 500);
  const meta = [data.organization, data.city].filter(Boolean).join(" · ");
  ctx.fillText(meta || "Local JCI · Ville", WIDTH / 2, pillY + 60);

  // Divider
  ctx.strokeStyle = "rgba(19,15,45,0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, pillY + 110);
  ctx.lineTo(WIDTH - 120, pillY + 110);
  ctx.stroke();

  // QR Code
  const qrSize = 300;
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
    margin: 0,
    width: qrSize,
    color: { dark: "#130F2D", light: "#FFFFFF" },
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrY = pillY + 150;
  ctx.drawImage(qrImg, WIDTH / 2 - qrSize / 2, qrY, qrSize, qrSize);

  // Unique code
  ctx.fillStyle = COLORS.ink;
  ctx.font = sansFont(30, 600);
  ctx.fillText(data.uniqueCode, WIDTH / 2, qrY + qrSize + 50);

  ctx.fillStyle = "#8B87A0";
  ctx.font = sansFont(20, 400);
  ctx.fillText("Scannez pour vérifier ce badge", WIDTH / 2, qrY + qrSize + 84);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
