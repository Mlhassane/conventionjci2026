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

// Palette du badge : fond noir JCI + accents orange.
const COLORS = {
  ink: "#130F2D",          // JCI Black
  paper: "#FFFFFF",        // JCI White
  accent: "#F97316",       // Orange principal
  accentSoft: "#FFF3E8",   // Fond très clair
  slate: "#3D3859",        // Texte secondaire
  muted: "#8B87A0",        // Texte discret
  divider: "rgba(19,15,45,0.1)",
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

/**
 * Dessine le badge. `scale` permet de produire une version réduite (miniatures
 * de la galerie admin) sans dupliquer le code de rendu.
 */
export async function drawBadge(
  canvas: HTMLCanvasElement,
  data: BadgeData,
  options: { scale?: number } = {}
) {
  const scale = options.scale ?? 1;
  canvas.width = Math.round(WIDTH * scale);
  canvas.height = Math.round(HEIGHT * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  // Background card
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Top ink band
  const bandHeight = 300;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, WIDTH, bandHeight);

  // filet orange sous le bandeau
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, bandHeight - 6, WIDTH, 6);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.accent;
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
  ctx.fillStyle = COLORS.accentSoft;
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
    ctx.fillStyle = COLORS.accent;
    ctx.font = sansFont(90, 600);
    ctx.textBaseline = "middle";
    ctx.fillText(data.name ? data.name.charAt(0).toUpperCase() : "J", WIDTH / 2, photoCenterY + 8);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.strokeStyle = COLORS.accent;
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
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(roleText, WIDTH / 2, pillY);

  // Organization / city
  ctx.fillStyle = COLORS.slate;
  ctx.font = sansFont(28, 500);
  const meta = [data.organization, data.city].filter(Boolean).join(" · ");
  ctx.fillText(meta || "Local JCI · Ville", WIDTH / 2, pillY + 60);

  // Divider
  ctx.strokeStyle = COLORS.divider;
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
    color: { dark: COLORS.ink, light: COLORS.paper },
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrY = pillY + 150;
  ctx.drawImage(qrImg, WIDTH / 2 - qrSize / 2, qrY, qrSize, qrSize);

  // Unique code
  ctx.fillStyle = COLORS.ink;
  ctx.font = sansFont(30, 600);
  ctx.fillText(data.uniqueCode, WIDTH / 2, qrY + qrSize + 50);

  ctx.fillStyle = COLORS.muted;
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
