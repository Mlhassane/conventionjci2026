import QRCode from "qrcode";
import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { CONA, drawConaHeader, fitFont, isOrgaRole, paintConaBackground } from "./badge-theme";

export type BadgeData = {
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

const WIDTH = 1080;
const HEIGHT = 1600;

function goldGradient(ctx: CanvasRenderingContext2D, y0: number, y1: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#F4DC9A");
  g.addColorStop(0.5, CONA.gold);
  g.addColorStop(1, CONA.goldDeep);
  return g;
}

/**
 * Badge vertical premium — 23ème Convention Nationale :
 * fond bordeaux/noir profond, halo central, pastille rôle or,
 * QR bordé or, pied équilibré date/lieu + slogan or.
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

  const cx = WIDTH / 2;
  await paintConaBackground(ctx, WIDTH, HEIGHT, isOrgaRole(data.role) ? "orga" : "default");

  /* Halo lumineux derrière la zone participant */
  const halo = ctx.createRadialGradient(cx, 1000, 40, cx, 1000, 520);
  halo.addColorStop(0, "rgba(217,164,65,0.16)");
  halo.addColorStop(1, "rgba(217,164,65,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 480, WIDTH, 900);

  /* Vignettage doux */
  const vig = ctx.createRadialGradient(cx, HEIGHT / 2, HEIGHT * 0.32, cx, HEIGHT / 2, HEIGHT * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const topH = 380;
  await drawConaHeader(ctx, WIDTH, { topH, logoH: 130 });

  /* Titre 23ème CONVENTION NATIONALE */
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFF";
  const titleY = topH + 60;
  ctx.textAlign = "left";
  ctx.font = sansFont(132, 800);
  ctx.fillText("23", 90, titleY);
  ctx.font = sansFont(40, 600);
  ctx.fillText("ème", 258, titleY - 62);
  ctx.textAlign = "right";
  fitFont(ctx, "CONVENTION", 560, 64, 800, 30);
  ctx.fillText("CONVENTION", WIDTH - 90, titleY - 8);
  fitFont(ctx, "NATIONALE", 560, 64, 800, 30);
  ctx.fillText("NATIONALE", WIDTH - 90, titleY + 60);
  ctx.textAlign = "center";

  // Filet or sous le titre.
  const ruleY = titleY + 96;
  const rule = ctx.createLinearGradient(cx - 260, 0, cx + 260, 0);
  rule.addColorStop(0, "rgba(217,164,65,0)");
  rule.addColorStop(0.5, CONA.gold);
  rule.addColorStop(1, "rgba(217,164,65,0)");
  ctx.strokeStyle = rule;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 260, ruleY);
  ctx.lineTo(cx + 260, ruleY);
  ctx.stroke();
  // Losange central.
  ctx.save();
  ctx.translate(cx, ruleY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = CONA.gold;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();

  /* Identité */
  const name = (data.name || "Votre nom").trim().toUpperCase();
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#FFFFFF";
  fitFont(ctx, name, WIDTH - 140, 78, 800, 30);
  ctx.fillText(name, cx, 720);
  ctx.restore();

  ctx.fillStyle = CONA.cream;
  ctx.font = sansFont(29, 500);
  const meta = [data.organization, data.city].filter(Boolean).join("  ·  ");
  fitFont(ctx, meta || "Local JCI · Ville", WIDTH - 200, 29, 500, 18);
  ctx.fillText(meta || "Local JCI · Ville", cx, 772);

  /* Rôle : pastille or dégradé, texte bordeaux */
  const role = (data.role || "PARTICIPANT").toUpperCase();
  ctx.font = sansFont(34, 800);
  fitFont(ctx, role, WIDTH - 320, 34, 800, 18);
  const pillW = Math.min(ctx.measureText(role).width + 110, WIDTH - 200);
  const pillH = 68;
  const pillY = 806;
  ctx.save();
  ctx.shadowColor = "rgba(217,164,65,0.45)";
  ctx.shadowBlur = 24;
  const pg = ctx.createLinearGradient(0, pillY, 0, pillY + pillH);
  pg.addColorStop(0, "#F4DC9A");
  pg.addColorStop(1, "#C99635");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.roundRect(cx - pillW / 2, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#3A1500";
  ctx.textBaseline = "middle";
  ctx.fillText(role, cx, pillY + pillH / 2 + 2);
  ctx.textBaseline = "alphabetic";

  /* QR : carte blanche bordée or */
  const qrSize = 296;
  const boxPad = 24;
  const boxSize = qrSize + boxPad * 2;
  const boxY = 905;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(cx - boxSize / 2, boxY, boxSize, boxSize, 30);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = CONA.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cx - boxSize / 2, boxY, boxSize, boxSize, 30);
  ctx.stroke();
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
    margin: 0,
    width: qrSize,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const qrImg = await loadImageFromUrl(qrDataUrl);
  ctx.drawImage(qrImg, cx - qrSize / 2, boxY + boxPad, qrSize, qrSize);

  ctx.fillStyle = CONA.muted;
  ctx.font = sansFont(22, 400);
  ctx.fillText("Scannez pour vérifier ce badge", cx, boxY + boxSize + 40);

  ctx.fillStyle = goldGradient(ctx, boxY + boxSize + 50, boxY + boxSize + 96);
  ctx.font = sansFont(32, 700);
  try {
    ctx.letterSpacing = "5px";
  } catch { /* noop */ }
  ctx.fillText(data.uniqueCode || "", cx, boxY + boxSize + 86);
  try {
    ctx.letterSpacing = "0px";
  } catch { /* noop */ }

  /* Pied : deux blocs équilibrés + slogan */
  const footTop = HEIGHT - 235;
  // Ligne de séparation or.
  const sep = ctx.createLinearGradient(80, 0, WIDTH - 80, 0);
  sep.addColorStop(0, "rgba(217,164,65,0)");
  sep.addColorStop(0.5, "rgba(217,164,65,0.75)");
  sep.addColorStop(1, "rgba(217,164,65,0)");
  ctx.strokeStyle = sep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, footTop);
  ctx.lineTo(WIDTH - 80, footTop);
  ctx.stroke();

  const leftX = WIDTH * 0.28;
  const rightX = WIDTH * 0.74;
  const iconY = footTop + 48;

  // Calendrier or avec pastilles.
  ctx.strokeStyle = CONA.gold;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(leftX - 21, iconY - 20, 42, 38, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(leftX - 21, iconY - 8);
  ctx.lineTo(leftX + 21, iconY - 8);
  ctx.stroke();
  ctx.fillStyle = CONA.gold;
  for (const [dx, dy] of [[-9, 2], [0, 2], [9, 2], [-9, 11], [0, 11], [9, 11]] as const) {
    ctx.beginPath();
    ctx.arc(leftX + dx, iconY + dy, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pin or (goutte).
  ctx.fillStyle = CONA.gold;
  ctx.beginPath();
  ctx.arc(rightX, iconY - 4, 15, Math.PI * 0.85, Math.PI * 2.15);
  ctx.lineTo(rightX, iconY + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2A0B0B";
  ctx.beginPath();
  ctx.arc(rightX, iconY - 4, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = sansFont(40, 800);
  ctx.fillText("09 – 10", leftX, iconY + 58);
  ctx.fillStyle = CONA.cream;
  ctx.font = sansFont(21, 600);
  const dateLabel = (data.eventDateLabel || "OCTOBRE 2026").toUpperCase().replace(/^09\s*[–-]\s*10\s*/, "");
  fitFont(ctx, dateLabel || "OCTOBRE 2026", 300, 21, 600, 15);
  ctx.fillText(dateLabel || "OCTOBRE 2026", leftX, iconY + 86);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = sansFont(36, 800);
  const cityMain = ((data.location || "MARADI,").toUpperCase().split(",")[0] + ",").trim();
  fitFont(ctx, cityMain, 300, 36, 800, 20);
  ctx.fillText(cityMain, rightX, iconY + 56);
  ctx.fillStyle = CONA.cream;
  ctx.font = sansFont(21, 500);
  ctx.fillText("NIGER", rightX, iconY + 86);

  // Séparateur vertical.
  ctx.strokeStyle = "rgba(217,164,65,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, footTop + 22);
  ctx.lineTo(cx, footTop + 104);
  ctx.stroke();

  ctx.fillStyle = goldGradient(ctx, HEIGHT - 66, HEIGHT - 26);
  ctx.font = sansFont(27, 700);
  try {
    ctx.letterSpacing = "2px";
  } catch { /* noop */ }
  ctx.fillText("INNOVER • ENTREPRENDRE • IMPACTER", cx, HEIGHT - 40);
  try {
    ctx.letterSpacing = "0px";
  } catch { /* noop */ }
}
