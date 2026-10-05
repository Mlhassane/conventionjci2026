import QRCode from "qrcode";
import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { trimLogoEdges } from "./trimLogo";

export type BadgeData = {
  name: string;
  role: string;
  organization: string;
  city: string;
  uniqueCode: string;
  verifyUrl: string;
  eventDateLabel: string;
  location: string;
  /** Adresse du site affichée sous le QR (comme sur le badge de référence). */
  siteLabel?: string;
};

const WIDTH = 1080;
const HEIGHT = 1600;

// Palette inspirée du badge Niger Digital Day : blanc, bleu JCI, encre.
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
 * Dessine le badge. `scale` permet de produire une version réduite (miniatures
 * de la galerie admin) sans dupliquer le code de rendu.
 *
 * Composition, inspirée du badge « Digital Pioneers » : bandeau bleu en haut,
 * logo de la Convention, identité du participant, grand QR au centre, puis un
 * large bandeau bleu qui porte le rôle en gros caractères.
 * Aucune photo : le badge reste lisible de loin, une seule à l'unité.
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

  const centerX = WIDTH / 2;

  /* ---------------- Fond ---------------- */
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  /* ---------------- Bandeau bleu du haut ---------------- */
  const topBarHeight = 96;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, 0, WIDTH, topBarHeight);

  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.paper;
  ctx.font = sansFont(26, 700);
  ctx.letterSpacing = "4px";
  ctx.textAlign = "left";
  ctx.fillText("JCI NIGER · MARADI", 52, topBarHeight / 2);
  ctx.textAlign = "right";
  ctx.fillText("CONVENTION NATIONALE", WIDTH - 52, topBarHeight / 2);
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "alphabetic";

  /* ---------------- Les trois logos de la Convention ---------------- */
  const logosRowY = 168 + 155 / 2;

  // Les logos JCI Niger et JCI Maradi sont des PNG au fond transparent
  // (l'arrière-plan a été retiré une seule fois, pas à chaque rendu).
  const logosLateraux = await Promise.all([
    loadImageFromUrl("/jci_niger.png").catch(() => null),
    loadImageFromUrl("/jci_maradi.png").catch(() => null),
  ]);

  for (const [index, image] of logosLateraux.entries()) {
    if (!image || image.width <= 0) continue;
    const target = trimLogoEdges(image);
    const ratio = Math.min(230 / target.width, 118 / target.height);
    const dw = target.width * ratio;
    const dh = target.height * ratio;
    const targetX = index === 0 ? 200 : WIDTH - 200;
    ctx.drawImage(target, targetX - dw / 2, logosRowY - dh / 2, dw, dh);
  }

  const logo = await loadImageFromUrl("/logo.png").catch(() => null);
  if (logo && logo.width > 0) {
    const maxW = 430;
    const maxH = 155;
    const ratio = Math.min(maxW / logo.width, maxH / logo.height);
    const dw = logo.width * ratio;
    const dh = logo.height * ratio;
    ctx.drawImage(logo, centerX - dw / 2, logosRowY - dh / 2, dw, dh);
  }

  /* ---------------- Nom ---------------- */
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.ink;
  const name = data.name || "Votre nom";
  fitFont(ctx, name, WIDTH - 200, 72, 700, 32);
  ctx.fillText(name, centerX, 448);

  /* ---------------- Organisation et ville ---------------- */
  ctx.fillStyle = COLORS.slate;
  ctx.font = sansFont(28, 500);
  const meta = [data.organization, data.city].filter(Boolean).join("  ·  ");
  ctx.fillText(meta || "Local JCI · Ville", centerX, 506);

  /* ---------------- Code unique ---------------- */
  ctx.font = sansFont(26, 700);
  const codeText = data.uniqueCode || "";
  const codeWidth = Math.min(ctx.measureText(codeText).width + 72, WIDTH - 200);
  ctx.fillStyle = COLORS.blueSoft;
  ctx.beginPath();
  ctx.roundRect(centerX - codeWidth / 2, 542, codeWidth, 54, 27);
  ctx.fill();
  ctx.fillStyle = COLORS.blueDark;
  ctx.fillText(codeText, centerX, 578);

  /* ---------------- Grand QR au centre ---------------- */
  const qrSize = 352;
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
    margin: 0,
    width: qrSize,
    color: { dark: "#000000", light: COLORS.paper },
  });
  const qrImg = await loadImageFromUrl(qrDataUrl);
  ctx.drawImage(qrImg, centerX - qrSize / 2, 640, qrSize, qrSize);

  ctx.fillStyle = COLORS.muted;
  ctx.font = sansFont(21, 400);
  ctx.fillText("Scannez pour vérifier ce badge", centerX, 1032);

  /* ---------------- Pastille du site ---------------- */
  if (data.siteLabel) {
    ctx.font = sansFont(23, 600);
    const siteWidth = Math.min(
      ctx.measureText(data.siteLabel).width + 64,
      WIDTH - 160
    );
    ctx.fillStyle = COLORS.blue;
    ctx.beginPath();
    ctx.roundRect(centerX - siteWidth / 2, 1064, siteWidth, 52, 26);
    ctx.fill();
    ctx.fillStyle = COLORS.paper;
    ctx.fillText(data.siteLabel, centerX, 1098);
  }

  /* ---------------- Bandeau bleu du bas ---------------- */
  const bottomTop = 1180;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, bottomTop, WIDTH, HEIGHT - bottomTop);
  ctx.fillStyle = COLORS.blueDark;
  ctx.fillRect(0, bottomTop, WIDTH, 8);

  // Le rôle en très gros caractères, comme le titre du badge de référence.
  const roleText = (data.role || "PARTENAIRE").toUpperCase();
  ctx.fillStyle = COLORS.paper;
  fitFont(ctx, roleText, WIDTH - 120, 92, 800, 40);
  ctx.fillText(roleText, centerX, bottomTop + 190);

  // Filet discret
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 150, bottomTop + 230);
  ctx.lineTo(centerX + 150, bottomTop + 230);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = sansFont(32, 700);
  ctx.letterSpacing = "6px";
  ctx.fillText("CONVENTION 2026", centerX, bottomTop + 288);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = sansFont(23, 500);
  ctx.fillText(
    [data.eventDateLabel, data.location].filter(Boolean).join("  ·  "),
    centerX,
    bottomTop + 340
  );
}