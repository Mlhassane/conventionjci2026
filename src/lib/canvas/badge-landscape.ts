import QRCode from "qrcode";
import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { trimLogoEdges } from "./trimLogo";

export type BadgeLandscapeData = {
  name: string;
  role: string;
  organization: string;
  city: string;
  uniqueCode: string;
  verifyUrl: string;
  eventDateLabel: string;
  location: string;
  siteLabel?: string;
};

/** 100 × 65 mm : 1180 × 767 px, soit 300 ppp au format final. */
const WIDTH = 1180;
const HEIGHT = 767;

const COLORS = {
  paper: "#FFFFFF",
  blue: "#0097D7",
  blueDark: "#0067A6",
  blueSoft: "#E4F4FC",
  ink: "#130F2D",
  slate: "#3D3859",
  muted: "#8B87A0",
};

/** Ajuste la taille du texte jusqu'à ce qu'il tienne sur une ligne. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight: number,
  minSize: number
) {
  let size = startSize;
  ctx.font = sansFont(size, weight);
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = sansFont(size, weight);
  }
  return size;
}

/**
 * Badge paysage 100 × 65 mm, pensé pour les cartes de format carte de
 * visite : identité à gauche, grand QR code à droite.
 */
export async function drawBadgeLandscape(
  canvas: HTMLCanvasElement,
  data: BadgeLandscapeData,
  options: { scale?: number } = {}
) {
  const scale = options.scale ?? 1;
  canvas.width = Math.round(WIDTH * scale);
  canvas.height = Math.round(HEIGHT * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  /* ---------------- Fond ---------------- */
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  /* ---------------- Bandeau bleu du haut ---------------- */
  const barHeight = 74;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, 0, WIDTH, barHeight);

  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.paper;
  ctx.font = sansFont(23, 700);
  ctx.letterSpacing = "3px";
  ctx.textAlign = "left";
  ctx.fillText("JCI NIGER · MARADI", 40, barHeight / 2);
  ctx.textAlign = "right";
  ctx.fillText("CONVENTION NATIONALE", WIDTH - 40, barHeight / 2);
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "alphabetic";

  /* ---------------- Colonne gauche : identité ---------------- */
  const leftX = 44;
  const leftWidth = 596;

  // Les trois logos, à la même hauteur
  const logos = await Promise.all([
    loadImageFromUrl("/jci_niger.png").catch(() => null),
    loadImageFromUrl("/logo.png").catch(() => null),
    loadImageFromUrl("/jci_maradi.png").catch(() => null),
  ]);
  const logoBox = { w: 168, h: 66 };
  const centers = [leftX + 78, leftX + leftWidth / 2, leftX + leftWidth - 78];
  const logosTop = 104;

  logos.forEach((image, index) => {
    if (!image || image.width <= 0) return;
    const logo = trimLogoEdges(image);
    const ratio = Math.min(logoBox.w / logo.height, logoBox.h / logo.height);
    const dh = logoBox.h;
    const dw = logo.width * ratio;
    ctx.drawImage(logo, centers[index] - dw / 2, logosTop + (logoBox.h - dh) / 2, dw, dh);
  });

  // Nom
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.ink;
  const name = data.name.trim() || "Votre nom";
  fitFont(ctx, name, leftWidth, 58, 700, 26);
  ctx.fillText(name, leftX, 258);

  // Organisation et ville
  ctx.fillStyle = COLORS.slate;
  ctx.font = sansFont(26, 500);
  const meta = [data.organization, data.city].filter(Boolean).join("  ·  ");
  ctx.fillText(meta || "Local JCI · Ville", leftX, 302);

  // Rôle : pastille bleue
  const roleText = (data.role.trim() || "Participant").toUpperCase();
  const pillY = 336;
  const pillHeight = 74;
  fitFont(ctx, roleText, leftWidth - 90, 32, 800, 18);
  const pillWidth = Math.min(
    ctx.measureText(roleText).width + 64,
    leftWidth
  );
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.roundRect(leftX, pillY, pillWidth, pillHeight, pillHeight / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(roleText, leftX + pillWidth / 2, pillY + pillHeight / 2 + 2);
  ctx.textBaseline = "alphabetic";

  // Code unique
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.muted;
  ctx.font = sansFont(23, 600);
  ctx.letterSpacing = "2px";
  ctx.fillText(data.uniqueCode || "", leftX, 462);
  ctx.letterSpacing = "0px";

  /* ---------------- Grand QR à droite ---------------- */
  const qrSize = 430;
  const qrX = WIDTH - 60 - qrSize;
  const qrY = 128;

  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
    margin: 0,
    width: qrSize,
    color: { dark: "#000000", light: COLORS.paper },
  });
  const qrImage = await loadImageFromUrl(qrDataUrl);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = COLORS.muted;
  ctx.font = sansFont(21, 400);
  ctx.textAlign = "center";
  ctx.fillText("Scannez pour vérifier ce badge", qrX + qrSize / 2, qrY + qrSize + 34);

  if (data.siteLabel) {
    ctx.fillStyle = COLORS.blue;
    ctx.font = sansFont(20, 600);
    ctx.fillText(data.siteLabel, qrX + qrSize / 2, qrY + qrSize + 66);
  }

  /* ---------------- Bandeau bleu du bas ---------------- */
  const footerY = HEIGHT - 84;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, footerY, WIDTH, 84);

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.paper;
  ctx.font = sansFont(34, 800);
  ctx.fillText("CONVENTION 2026", leftX, footerY + 53);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = sansFont(24, 500);
  ctx.fillText(
    [data.eventDateLabel, data.location].filter(Boolean).join("  ·  "),
    WIDTH - 44,
    footerY + 52
  );
}