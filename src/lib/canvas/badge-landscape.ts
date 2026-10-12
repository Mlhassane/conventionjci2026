import QRCode from "qrcode";
import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { CONA, drawConaHeader, fitFont, isOrgaRole, paintConaBackground } from "./badge-theme";

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

/** 100 × 65 mm : 1180 × 767 px, déclinaison premium bordeaux/or. */
const WIDTH = 1180;
const HEIGHT = 767;

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

  await paintConaBackground(ctx, WIDTH, HEIGHT, isOrgaRole(data.role) ? "orga" : "default");

  // Halo + vignette.
  const halo = ctx.createRadialGradient(340, 430, 30, 340, 430, 460);
  halo.addColorStop(0, "rgba(217,164,65,0.14)");
  halo.addColorStop(1, "rgba(217,164,65,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 150, 800, 550);
  const vig = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.3,
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.85
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  await drawConaHeader(ctx, WIDTH, { topH: 190, logoH: 64 });

  // Titre compact sous le header.
  ctx.fillStyle = "#FFF";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = sansFont(62, 800);
  ctx.fillText("23", 60, 295);
  ctx.font = sansFont(24, 600);
  ctx.fillText("ème", 136, 262);
  ctx.textAlign = "center";
  fitFont(ctx, "CONVENTION NATIONALE", 480, 34, 800, 20);
  ctx.fillText("CONVENTION NATIONALE", 440, 280);

  // Filet or sous le titre.
  ctx.strokeStyle = "rgba(217,164,65,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 312);
  ctx.lineTo(660, 312);
  ctx.stroke();

  // Colonne gauche : identité.
  const leftX = 60;
  ctx.textAlign = "left";
  const name = (data.name || "Votre nom").toUpperCase();
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#FFF";
  fitFont(ctx, name, 560, 54, 800, 24);
  ctx.fillText(name, leftX, 384);
  ctx.restore();

  ctx.fillStyle = CONA.cream;
  ctx.font = sansFont(24, 500);
  const meta = [data.organization, data.city].filter(Boolean).join("  ·  ");
  fitFont(ctx, meta || "Local JCI · Ville", 560, 24, 500, 16);
  ctx.fillText(meta || "Local JCI · Ville", leftX, 422);

  // Rôle : pastille or dégradé.
  const role = (data.role || "Participant").toUpperCase();
  fitFont(ctx, role, 440, 26, 800, 15);
  const pillW = Math.min(ctx.measureText(role).width + 56, 570);
  const pillH = 52;
  const pillY = 444;
  const pg = ctx.createLinearGradient(0, pillY, 0, pillY + pillH);
  pg.addColorStop(0, "#F4DC9A");
  pg.addColorStop(1, "#C99635");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.roundRect(leftX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = "#3A1500";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = sansFont(26, 800);
  fitFont(ctx, role, 440, 26, 800, 15);
  ctx.fillText(role, leftX + pillW / 2, pillY + pillH / 2 + 1);
  ctx.textBaseline = "alphabetic";

  // Code unique or.
  ctx.textAlign = "left";
  ctx.fillStyle = CONA.goldLight;
  ctx.font = sansFont(22, 700);
  try {
    ctx.letterSpacing = "3px";
  } catch { /* noop */ }
  ctx.fillText(data.uniqueCode || "", leftX, 536);
  try {
    ctx.letterSpacing = "0px";
  } catch { /* noop */ }

  // QR à droite : carte blanche bordée or.
  const qrSize = 300;
  const pad = 20;
  const box = qrSize + pad * 2;
  const qrX = WIDTH - 60 - box;
  const qrY = 246;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, box, box, 20);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = CONA.gold;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, box, box, 20);
  ctx.stroke();
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
    margin: 0,
    width: qrSize,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const qrImg = await loadImageFromUrl(qrDataUrl);
  ctx.drawImage(qrImg, qrX + pad, qrY + pad, qrSize, qrSize);

  ctx.fillStyle = CONA.muted;
  ctx.font = sansFont(19, 400);
  ctx.textAlign = "center";
  ctx.fillText("Scannez pour vérifier", qrX + box / 2, qrY + box + 30);

  // Pied : bandeau sombre, liseré or.
  const footY = HEIGHT - 84;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, footY, WIDTH, 84);
  const top = ctx.createLinearGradient(0, 0, WIDTH, 0);
  top.addColorStop(0, "rgba(217,164,65,0)");
  top.addColorStop(0.5, CONA.gold);
  top.addColorStop(1, "rgba(217,164,65,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, footY, WIDTH, 3);
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFF";
  ctx.font = sansFont(28, 800);
  const dateShort = (data.eventDateLabel || "OCTOBRE 2026").toUpperCase().replace(/^09\s*[–-]\s*10\s*/, "");
  const dateTxt = `09 – 10  ${dateShort || "OCTOBRE 2026"}`;
  fitFont(ctx, dateTxt, 640, 28, 800, 18);
  ctx.fillText(dateTxt, 60, footY + 53);
  ctx.textAlign = "right";
  ctx.fillStyle = CONA.gold;
  ctx.font = sansFont(20, 700);
  ctx.fillText("INNOVER • ENTREPRENDRE • IMPACTER", WIDTH - 60, footY + 51);
}
