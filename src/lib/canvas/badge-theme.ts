import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { trimLogoEdges } from "./trimLogo";

export const CONA = {
  wine: "#4A0E10",
  wineDeep: "#250607",
  black: "#0B0909",
  gold: "#D9A441",
  goldLight: "#F0D188",
  goldDeep: "#A67C2A",
  white: "#FFFFFF",
  cream: "rgba(255,255,255,0.82)",
  muted: "rgba(255,255,255,0.62)",
};

/** Rôles bénéficiant du badge « organisation » (fond bleu nuit). */
export function isOrgaRole(role: string): boolean {
  return /organisat|admin|bénévole/i.test(role || "");
}

/** Fond : image portrait propre /badge-fond.png si fournie, sinon dégradé bordeaux → noir + filets or.
 * NOTE : /badge.png est une maquette 1920×1080 avec marges blanches, on l'ignore volontairement. */
export async function paintConaBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  variant: "default" | "orga" = "default"
) {
  for (const url of ["/badge-fond.png", "/badge-fond-portrait.png"]) {
    const bg = await loadImageFromUrl(url).catch(() => null);
    if (bg && bg.width > 0) {
      const r = Math.max(W / bg.width, H / bg.height);
      const dw = bg.width * r;
      const dh = bg.height * r;
      ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      return true;
    }
  }

  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (variant === "orga") {
    g.addColorStop(0, "#1B2F57");
    g.addColorStop(0.38, "#101F3C");
    g.addColorStop(0.68, "#080F22");
    g.addColorStop(1, "#04070F");
  } else {
    g.addColorStop(0, "#5E1414");
    g.addColorStop(0.38, CONA.wine);
    g.addColorStop(0.68, "#1A0A0A");
    g.addColorStop(1, CONA.black);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Reflet sombre central.
  const radial = ctx.createRadialGradient(
    W / 2, H * 0.62, H * 0.05,
    W / 2, H * 0.62, H * 0.55
  );
  radial.addColorStop(0, "rgba(0,0,0,0.35)");
  radial.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  // Filets or latéraux (évoquent les vagues du visuel).
  ctx.save();
  ctx.strokeStyle = CONA.gold;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(3, W * 0.006);
  ctx.lineCap = "round";
  const curves: Array<[number, number, number, number, number, number, number, number]> = [
    [-W * 0.08, H * 0.28, W * 0.22, H * 0.32, W * 0.05, H * 0.48, W * 0.32, H * 0.52],
    [-W * 0.08, H * 0.34, W * 0.2, H * 0.38, W * 0.02, H * 0.52, W * 0.28, H * 0.56],
    [W * 1.08, H * 0.5, W * 0.82, H * 0.54, W * 0.98, H * 0.64, W * 0.74, H * 0.68],
    [-W * 0.08, H * 0.58, W * 0.22, H * 0.62, W * 0.02, H * 0.78, W * 0.28, H * 0.82],
  ];
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of curves) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
    ctx.stroke();
  }
  ctx.restore();
  return false;
}

/** Coins blancs + logos JCI + encoche clip + CONA + titre. */
export async function drawConaHeader(
  ctx: CanvasRenderingContext2D,
  W: number,
  opts: { topH: number; logoH: number }
) {
  const { topH } = opts;
  // Coins compacts cantonnés au haut : le titre est dessiné SOUS les coins.
  const cornerW = W * 0.26;
  const cornerH = topH * 0.62;

  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  // Coins blancs arrondis vers l'intérieur.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(cornerW, 0);
  ctx.bezierCurveTo(cornerW, cornerH * 0.55, cornerW * 0.55, cornerH, 0, cornerH);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - cornerW, 0);
  ctx.bezierCurveTo(W - cornerW, cornerH * 0.55, W - cornerW * 0.55, cornerH, W, cornerH);
  ctx.closePath();
  ctx.fill();
  // Liseré or sous les coins.
  ctx.strokeStyle = CONA.gold;
  ctx.lineWidth = Math.max(4, W * 0.007);
  ctx.beginPath();
  ctx.moveTo(0, cornerH);
  ctx.bezierCurveTo(cornerW * 0.55, cornerH, cornerW, cornerH * 0.55, cornerW, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W, cornerH);
  ctx.bezierCurveTo(W - cornerW * 0.55, cornerH, W - cornerW, cornerH * 0.55, W - cornerW, 0);
  ctx.stroke();
  ctx.restore();

  const [niger, maradi] = await Promise.all([
    loadImageFromUrl("/jci_niger.png").catch(() => null),
    loadImageFromUrl("/jci_maradi.png").catch(() => null),
  ]);
  const place = (img: HTMLImageElement | null, cx: number, cy: number, maxW: number, maxH: number) => {
    if (!img || img.width <= 0) return;
    const t = trimLogoEdges(img);
    const r = Math.min(maxW / t.width, maxH / t.height);
    ctx.drawImage(t, cx - (t.width * r) / 2, cy - (t.height * r) / 2, t.width * r, t.height * r);
  };
  place(niger, cornerW * 0.42, cornerH * 0.38, cornerW * 0.62, cornerH * 0.52);
  place(maradi, W - cornerW * 0.42, cornerH * 0.38, cornerW * 0.62, cornerH * 0.52);

  // Encoche du clip.
  const slotW = W * 0.17;
  const slotH = topH * 0.26;
  const slotX = W / 2 - slotW / 2;
  const slotY = topH * 0.18;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(slotX, slotY, slotW, slotH, slotH / 2);
  ctx.fill();
  // Petit ergot central vers le haut.
  ctx.beginPath();
  ctx.arc(W / 2, slotY + 2, slotW * 0.14, Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // Logo CONA central.
  const cona = await loadImageFromUrl("/logo.png").catch(() => null);
  if (cona && cona.width > 0) {
    const maxW = W * 0.36;
    const maxH = opts.logoH;
    const r = Math.min(maxW / cona.width, maxH / cona.height);
    ctx.drawImage(cona, W / 2 - (cona.width * r) / 2, topH * 0.62 - (cona.height * r) / 2, cona.width * r, cona.height * r);
  }
}

export function fitFont(
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
