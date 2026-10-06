import QRCode from "qrcode";
import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { trimLogoEdges } from "./trimLogo";

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

/**
 * Badge « carte » : la mise en page est entièrement exprimée en
 * pourcentage de la hauteur, la même composition sert donc aussi bien en
 * 67 × 100 mm (8 par A4) qu'en A6 115 × 175 mm (2 par A4).
 *
 * Rendu à 300 ppp : 1 mm ≈ 11,81 px. Le fond atteint les bords (la coupe
 * se fait exactement dessus) et le contenu reste à 5 % des bords.
 */
const MM = 11.811;

export const CARD_SIZES = {
  compact: { widthMm: 67, heightMm: 100, label: "67 × 100 mm" },
  a6: { widthMm: 115, heightMm: 175, label: "A6 115 × 175 mm" },
} as const;

export type CardSizeKey = keyof typeof CARD_SIZES;

const COLORS = {
  paper: "#FFFFFF",
  blue: "#0097D7",
  ink: "#130F2D",
  slate: "#3D3859",
  muted: "#8B87A0",
  grey: "#C8C8CC",
};

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

export async function drawBadgeCard(
  canvas: HTMLCanvasElement,
  data: BadgeCardData,
  options: {
    size?: CardSizeKey;
    /** Bande du clip réservée en haut (encoche 14 × 3,5 mm). */
    slot?: boolean;
    scale?: number;
  } = {}
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
  const p = (percent: number) => (H * percent) / 100; // repère vertical
  const safe = W * 0.05;

  /* ---------------- Fond ---------------- */
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, W, H);

  /* ---------------- Bande du clip (0 → 14 %) ---------------- */
  if (withSlot) {
    const slotW = 14 * MM;
    const slotH = 3.5 * MM;
    const slotY = p(4.4);

    ctx.save();
    ctx.strokeStyle = COLORS.grey;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.roundRect(cx - slotW / 2, slotY, slotW, slotH, slotH / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.grey;
    ctx.font = sansFont(H * 0.012, 500);
    ctx.textAlign = "center";
    ctx.fillText("encoche du clip", cx, slotY + slotH + H * 0.016);
    ctx.restore();

    // Les deux logos encadrent l'encoche.
    const logos = await Promise.all([
      loadImageFromUrl("/jci_niger.png").catch(() => null),
      loadImageFromUrl("/jci_maradi.png").catch(() => null),
    ]);
    const logoH = p(6.4);
    const centers = [W * 0.19, W - W * 0.19];
    logos.forEach((image, index) => {
      if (!image || image.width <= 0) return;
      const logo = trimLogoEdges(image);
      const dh = logoH;
      const dw = (logo.width / logo.height) * dh;
      ctx.drawImage(
        logo,
        centers[index] - dw / 2,
        p(7) - dh / 2,
        dw,
        dh
      );
    });
  }

  /* ---------------- Bandeau bleu de titre ---------------- */
  const headerTop = withSlot ? p(14) : 0;
  const headerH = p(17);
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, headerTop, W, headerH);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.paper;
  fitFont(ctx, "CONVENTION 2026", W - safe * 2, H * 0.038, 800, H * 0.02);
  ctx.fillText("CONVENTION 2026", cx, headerTop + headerH * 0.46);

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = sansFont(H * 0.019, 500);
  ctx.fillText(
    [data.eventDateLabel, data.location].filter(Boolean).join("  ·  "),
    cx,
    headerTop + headerH * 0.82
  );

  /* ---------------- Identité ---------------- */
  ctx.fillStyle = COLORS.ink;
  fitFont(
    ctx,
    data.name.trim() || "Votre nom",
    W - safe * 2,
    H * 0.048,
    700,
    H * 0.024
  );
  ctx.fillText(data.name.trim() || "Votre nom", cx, p(41));

  ctx.fillStyle = COLORS.slate;
  ctx.font = sansFont(H * 0.023, 500);
  const meta = [data.organization, data.city].filter(Boolean).join("  ·  ");
  ctx.fillText(meta || "Local JCI · Ville", cx, p(48));

  /* ---------------- Rôle ---------------- */
  const roleText = (data.role.trim() || "Participant").toUpperCase();
  fitFont(ctx, roleText, W - safe * 2 - W * 0.08, H * 0.028, 800, H * 0.016);
  const pillH = p(9);
  const pillW = Math.min(ctx.measureText(roleText).width + W * 0.07, W - safe * 2);
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.roundRect(cx - pillW / 2, p(51), pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  ctx.fillText(roleText, cx, p(51) + pillH / 2 + H * 0.004);

  /* ---------------- QR ---------------- */
  // 25 % de la hauteur : 25 mm en 67 × 100, 44 mm en A6 — il reste
  // largement scannable tout en laissant respirer la mise en page.
  const qrSize = Math.min(W * 0.4, H * 0.25);
  const qrTop = p(63);
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
    margin: 0,
    width: qrSize,
    color: { dark: "#000000", light: COLORS.paper },
  });
  const qrImage = await loadImageFromUrl(qrDataUrl);
  ctx.drawImage(qrImage, cx - qrSize / 2, qrTop, qrSize, qrSize);

  /* ---------------- Code unique ---------------- */
  ctx.fillStyle = COLORS.blue;
  ctx.font = sansFont(H * 0.021, 700);
  ctx.letterSpacing = "2px";
  ctx.fillText(data.uniqueCode || "", cx, p(91));
  ctx.letterSpacing = "0px";

  /* ---------------- Pied bleu ---------------- */
  const footerTop = p(93);
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, footerTop, W, H - footerTop);
  ctx.fillStyle = COLORS.paper;
  ctx.font = sansFont(H * 0.018, 800);
  ctx.letterSpacing = "2px";
  ctx.fillText("INNOVER · ENTREPRENDRE · IMPACTER", cx, p(97.5));
  ctx.letterSpacing = "0px";
}