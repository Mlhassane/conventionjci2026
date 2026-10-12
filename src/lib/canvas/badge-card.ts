import QRCode from "qrcode";
import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { CONA, drawConaHeader, fitFont, isOrgaRole, paintConaBackground } from "./badge-theme";

export type BadgeCardData = {
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

const MM = 11.811;

export const CARD_SIZES = {
  compact: { widthMm: 67, heightMm: 100, label: "67 × 100 mm" },
  a6: { widthMm: 115, heightMm: 175, label: "A6 115 × 175 mm" },
} as const;

export type CardSizeKey = keyof typeof CARD_SIZES;

/** Cartes premium 67×100 / A6 : même langage bordeaux/or que le vertical. */
export async function drawBadgeCard(
  canvas: HTMLCanvasElement,
  data: BadgeCardData,
  options: { size?: CardSizeKey; slot?: boolean; scale?: number } = {}
) {
  const size = CARD_SIZES[options.size ?? "compact"];
  const withSlot = options.slot ?? true;
  const scale = options.scale ?? 1;

  const W = size.widthMm * MM;
  const H = size.heightMm * MM;
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  const cx = W / 2;
  await paintConaBackground(ctx, W, H, isOrgaRole(data.role) ? "orga" : "default");

  // Halo + vignette.
  const halo = ctx.createRadialGradient(cx, H * 0.6, 10, cx, H * 0.6, W * 0.7);
  halo.addColorStop(0, "rgba(217,164,65,0.15)");
  halo.addColorStop(1, "rgba(217,164,65,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, H * 0.28, W, H * 0.6);
  const vig = ctx.createRadialGradient(cx, H / 2, H * 0.3, cx, H / 2, H * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  const topH = H * 0.24;
  await drawConaHeader(ctx, W, { topH, logoH: H * 0.075 });

  // Vrai trou du clip (on évide le centre blanc du header).
  if (withSlot) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    const sw = W * 0.17;
    const sh = H * 0.018;
    ctx.beginPath();
    ctx.roundRect(cx - sw / 2, topH * 0.18, sw, sh, sh / 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFF";
  fitFont(ctx, "23ème  CONVENTION NATIONALE", W * 0.9, H * 0.038, 800, H * 0.02);
  ctx.fillText("23ème  CONVENTION NATIONALE", cx, topH + H * 0.035);

  // Filet or + losange.
  const ruleY = topH + H * 0.062;
  ctx.strokeStyle = "rgba(217,164,65,0.8)";
  ctx.lineWidth = Math.max(1.5, W * 0.004);
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.3, ruleY);
  ctx.lineTo(cx + W * 0.3, ruleY);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, ruleY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = CONA.gold;
  const d = Math.max(4, W * 0.012);
  ctx.fillRect(-d / 2, -d / 2, d, d);
  ctx.restore();

  // Nom avec ombre portée.
  const name = (data.name || "Votre nom").toUpperCase();
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = H * 0.012;
  ctx.fillStyle = "#FFF";
  fitFont(ctx, name, W * 0.88, H * 0.048, 800, H * 0.022);
  ctx.fillText(name, cx, H * 0.42);
  ctx.restore();

  ctx.fillStyle = CONA.cream;
  ctx.font = sansFont(H * 0.022, 500);
  const meta = [data.organization, data.city].filter(Boolean).join("  ·  ");
  fitFont(ctx, meta || "Local JCI · Ville", W * 0.86, H * 0.022, 500, H * 0.014);
  ctx.fillText(meta || "Local JCI · Ville", cx, H * 0.462);

  // Rôle : pastille or dégradé.
  const role = (data.role || "Participant").toUpperCase();
  fitFont(ctx, role, W * 0.7, H * 0.028, 800, H * 0.015);
  const pillH = H * 0.052;
  const pillW = Math.min(ctx.measureText(role).width + W * 0.09, W * 0.84);
  const pillY = H * 0.485;
  const pg = ctx.createLinearGradient(0, pillY, 0, pillY + pillH);
  pg.addColorStop(0, "#F4DC9A");
  pg.addColorStop(1, "#C99635");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.roundRect(cx - pillW / 2, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = "#3A1500";
  ctx.textBaseline = "middle";
  ctx.fillText(role, cx, pillY + pillH / 2 + H * 0.002);
  ctx.textBaseline = "alphabetic";

  // QR : carte blanche bordée or.
  const qrSize = Math.min(W * 0.42, H * 0.185);
  const pad = qrSize * 0.09;
  const box = qrSize + pad * 2;
  const boxTop = H * 0.565;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = H * 0.02;
  ctx.shadowOffsetY = H * 0.006;
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.roundRect(cx - box / 2, boxTop, box, box, box * 0.08);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = CONA.gold;
  ctx.lineWidth = Math.max(2, W * 0.006);
  ctx.beginPath();
  ctx.roundRect(cx - box / 2, boxTop, box, box, box * 0.08);
  ctx.stroke();
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
    margin: 0,
    width: Math.round(qrSize),
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const qrImg = await loadImageFromUrl(qrDataUrl);
  ctx.drawImage(qrImg, cx - qrSize / 2, boxTop + pad, qrSize, qrSize);

  ctx.fillStyle = CONA.muted;
  ctx.font = sansFont(H * 0.016, 400);
  ctx.fillText("Scannez pour vérifier", cx, boxTop + box + H * 0.026);

  const codeGrad = ctx.createLinearGradient(0, 0, 0, H);
  codeGrad.addColorStop(0, "#F4DC9A");
  codeGrad.addColorStop(1, "#C99635");
  ctx.fillStyle = codeGrad;
  ctx.font = sansFont(H * 0.02, 700);
  try {
    ctx.letterSpacing = "2px";
  } catch { /* noop */ }
  ctx.fillText(data.uniqueCode || "", cx, boxTop + box + H * 0.052);
  try {
    ctx.letterSpacing = "0px";
  } catch { /* noop */ }

  // Pied : bandeau sombre, liseré or, slogan dégradé.
  const footTop = H * 0.925;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, footTop, W, H - footTop);
  const top = ctx.createLinearGradient(0, 0, W, 0);
  top.addColorStop(0, "rgba(217,164,65,0)");
  top.addColorStop(0.5, CONA.gold);
  top.addColorStop(1, "rgba(217,164,65,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, footTop, W, Math.max(2, H * 0.004));
  ctx.fillStyle = "#E9C876";
  ctx.font = sansFont(H * 0.0165, 700);
  try {
    ctx.letterSpacing = "1px";
  } catch { /* noop */ }
  ctx.fillText("INNOVER • ENTREPRENDRE • IMPACTER", cx, H * 0.968);
  try {
    ctx.letterSpacing = "0px";
  } catch { /* noop */ }
}
