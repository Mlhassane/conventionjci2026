import { sansFont } from "./fonts";
import { loadImageFromUrl } from "./loadImage";
import { trimLogoEdges } from "./trimLogo";

export type PartnerPosterData = {
  /** Nom de l'entreprise / du partenaire : titre du cadre de description. */
  name: string;
  /** Type de partnership : pastille rouge sous le logo. */
  category: string;
  /** Description saisie dans l'admin (à défaut, la prestation/contribution). */
  message: string;
  /** Logo placé dans le cercle rouge. */
  logo: HTMLImageElement | null;
  /** Affiche officielle de la Convention, reprise en arrière-plan. */
  artwork?: HTMLImageElement | null;
  /** Dates de la Convention (paramètres de l'événement). */
  eventDateLabel?: string;
  /** Ville de la Convention (paramètres de l'événement). */
  location?: string;
  /** Lien public du partenaire, utilisé pour le QR discret du pied. */
  partnerUrl?: string;
};

const WIDTH = 1080;
const HEIGHT = 1350;

const COLORS = {
  paper: "#FFFFFF",
  cream: "#F7F2EA",
  red: "#C8102E",
  redDark: "#9B0C23",
  redSoft: "rgba(200,16,46,0.10)",
  gold: "#D9A62E",
  goldSoft: "rgba(217,166,46,0.28)",
  ink: "#2B2B2B",
  grey: "#6E6A66",
  stone: "rgba(120,118,124,0.10)",
};

/* ------------------------------------------------------------------ */
/* Outils                                                              */
/* ------------------------------------------------------------------ */

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      if (lines.length === maxLines - 1) {
        current = `${current} ${word}`;
        break;
      }
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const kept = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s+\S*$/, "")}…`;
  }
  return kept;
}

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

/** Étoile à cinq branches, dessinée dans une boîte. */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/* ------------------------------------------------------------------ */
/* Décor                                                               */
/* ------------------------------------------------------------------ */

/** Minaret et mosquée en gris très clair, comme sur le gabarit. */
function drawLightArchitecture(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = COLORS.stone;

  // Minaret à gauche
  ctx.fillRect(88, 356, 68, 620);
  ctx.fillRect(74, 342, 96, 20);
  ctx.fillRect(99, 268, 46, 76);
  ctx.fillRect(90, 256, 64, 14);
  ctx.beginPath();
  ctx.arc(122, 256, 32, Math.PI, 0);
  ctx.fill();

  // Mosquée à droite
  ctx.beginPath();
  ctx.arc(930, 640, 142, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(788, 640, 284, 190);
  ctx.beginPath();
  ctx.moveTo(930, 462);
  ctx.lineTo(920, 504);
  ctx.lineTo(940, 504);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(1002, 730, 42, 240);
  ctx.beginPath();
  ctx.arc(1023, 730, 21, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

/** Champ de points dorés, en diagonale, dans un coin haut. */
function drawCornerDots(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = COLORS.goldSoft;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9 - row; col += 1) {
      const step = 22;
      const y = 214 + row * step;
      const leftX = 26 + col * step;
      const rightX = WIDTH - 26 - col * step;
      ctx.beginPath();
      ctx.arc(leftX, y, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightX, y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Vague rouge bordée d'or qui ferme l'affiche. */
function drawBottomWave(ctx: CanvasRenderingContext2D) {
  const top = 1268;

  ctx.save();

  // Motif géométrique très discret dans la vague
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.bezierCurveTo(320, top - 22, 700, top + 20, WIDTH, top - 14);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fillStyle = COLORS.red;
  ctx.fill();
  ctx.clip();

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  for (let x = -40; x < WIDTH + 120; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, HEIGHT);
    ctx.lineTo(x + 120, top - 30);
    ctx.stroke();
  }

  ctx.restore();

  // Filet doré au sommet de la vague
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.bezierCurveTo(320, top - 34, 700, top + 26, WIDTH, top - 20);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 9;
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/* Icônes de la ligne d'informations (rouge)                           */
/* ------------------------------------------------------------------ */

function drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = COLORS.red;
  ctx.fillStyle = COLORS.red;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x - 26, y - 22, 52, 46, 8);
  ctx.stroke();
  ctx.fillRect(x - 26, y - 10, 52, 5);
  ctx.fillRect(x - 14, y - 30, 5, 14);
  ctx.fillRect(x + 9, y - 30, 5, 14);
  ctx.restore();
}

function drawPinIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = COLORS.red;
  ctx.beginPath();
  ctx.arc(x, y - 6, 21, Math.PI, 0);
  ctx.lineTo(x + 21, y + 8);
  ctx.quadraticCurveTo(x, y + 34, x - 21, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  ctx.beginPath();
  ctx.arc(x, y - 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPeopleIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = COLORS.red;
  ctx.beginPath();
  ctx.arc(x - 22, y - 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 22, y - 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 18, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 22, y + 18, 19, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 22, y + 18, 19, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + 10, 23, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Génération                                                          */
/* ------------------------------------------------------------------ */

/**
 * Affiche partenaire : fond clair, bandeau de logos de la Convention,
 * cercle rouge avec le logo, pastille du type de partnership, cadre de la
 * description, slogan et informations pratiques, vague rouge et or.
 */
export async function drawPartnerPoster(
  canvas: HTMLCanvasElement,
  data: PartnerPosterData,
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
  const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, COLORS.paper);
  background.addColorStop(0.55, COLORS.cream);
  background.addColorStop(1, COLORS.paper);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Image de l'événement, floutée, en arrière-plan
  const hero =
    data.artwork ??
    (await loadImageFromUrl("/hero_image.png").catch(() => null));
  if (hero && hero.width > 0) {
    ctx.save();
    // Agrandissement léger : le flou ne laisse pas de bord transparent.
    const ratio = Math.max((WIDTH * 1.08) / hero.width, (HEIGHT * 1.08) / hero.height);
    const dw = hero.width * ratio;
    const dh = hero.height * ratio;
    ctx.filter = "blur(26px)";
    ctx.drawImage(hero, (WIDTH - dw) / 2, (HEIGHT - dh) / 2, dw, dh);
    ctx.filter = "none";
    // Laque claire : le rouge du texte doit rester lisible.
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  drawLightArchitecture(ctx);
  drawCornerDots(ctx);

  /* ---------------- Les trois logos ---------------- */
  const logos = await Promise.all([
    loadImageFromUrl("/jci_niger.png").catch(() => null),
    loadImageFromUrl("/logo.png").catch(() => null),
    loadImageFromUrl("/jci_maradi.png").catch(() => null),
  ]);

  // Même hauteur pour les trois logos : ils paraissent de taille identique.
  const logoBox = { w: 272, h: 96 };
  const boxes = [
    { x: 168, w: logoBox.w, h: logoBox.h },
    { x: centerX, w: logoBox.w, h: logoBox.h },
    { x: WIDTH - 168, w: logoBox.w, h: logoBox.h },
  ];

  // Les marges des logos JCI sont rognées : sans cela ils paraîtraient
  // nettement plus petits que le logo de la Convention.
  logos.forEach((image, index) => {
    if (!image || image.width <= 0) return;
    const box = boxes[index];
    const logo = trimLogoEdges(image);
    // La hauteur est prioritaire : c'est elle qui donne la taille perçue.
    const ratio = Math.min(box.h / logo.height, box.w / logo.width);
    const dw = logo.width * ratio;
    const dh = logo.height * ratio;
    ctx.drawImage(logo, box.x - dw / 2, 92 - dh / 2, dw, dh);
  });

  // Filet rouge + pastille dorée
  ctx.beginPath();
  ctx.moveTo(60, 186);
  ctx.lineTo(centerX - 22, 186);
  ctx.moveTo(centerX + 22, 186);
  ctx.lineTo(WIDTH - 60, 186);
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = COLORS.red;
  ctx.beginPath();
  ctx.arc(centerX, 186, 9, 0, Math.PI * 2);
  ctx.fill();

  /* ---------------- Cercle rouge + logo ---------------- */
  const circleY = 424;
  const outerR = 224;

  ctx.save();
  ctx.shadowColor = "rgba(200,16,46,0.18)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(centerX, circleY, outerR, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.red;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, circleY, outerR - 14, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, circleY, outerR - 26, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.redSoft;
  ctx.lineWidth = 3;
  ctx.stroke();

  if (data.logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, circleY, outerR - 34, 0, Math.PI * 2);
    ctx.clip();
    const maxW = outerR * 1.35;
    const maxH = outerR * 1.35;
    const ratio = Math.min(maxW / data.logo.width, maxH / data.logo.height);
    const dw = data.logo.width * ratio;
    const dh = data.logo.height * ratio;
    ctx.drawImage(data.logo, centerX - dw / 2, circleY - dh / 2, dw, dh);
    ctx.restore();
  } else {
    ctx.fillStyle = COLORS.red;
    ctx.font = sansFont(150, 800);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      data.name ? data.name.charAt(0).toUpperCase() : "P",
      centerX,
      circleY + 6
    );
    ctx.textBaseline = "alphabetic";
  }

  /* ---------------- Pastille : type de partnership ---------------- */
  const category = data.category.trim().toUpperCase() || "PARTENAIRE";
  const pillY = 672;
  const pillH = 96;

  let pillSize = 40;
  ctx.font = sansFont(pillSize, 800);
  const starSize = 34;
  ctx.font = sansFont(starSize, 800);
  const starWidth = ctx.measureText("★").width;
  ctx.font = sansFont(pillSize, 800);
  const labelWidth = ctx.measureText(category).width;
  const pillWidth = Math.min(starWidth + 24 + labelWidth + 24 + starWidth, WIDTH - 80);

  roundedRectPath(ctx, centerX - pillWidth / 2, pillY, pillWidth, pillH, pillH / 2);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Étoiles dorées de part et d'autre du libellé
  const contentWidth = starWidth + 24 + labelWidth + 24 + starWidth;
  const startX = centerX - contentWidth / 2;
  ctx.fillStyle = COLORS.gold;
  drawStar(ctx, startX + starWidth / 2, pillY + pillH / 2, 17, 7);
  drawStar(ctx, startX + contentWidth - starWidth / 2, pillY + pillH / 2, 17, 7);

  ctx.fillStyle = COLORS.red;
  fitFont(ctx, category, pillWidth - starWidth * 2 - 90, pillSize, 800, 22);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(category, centerX, pillY + pillH / 2 + 2);
  ctx.textBaseline = "alphabetic";

  /* ---------------- Cadre : nom + description ---------------- */
  const box = { x: 92, y: 800, w: WIDTH - 184, h: 240 };
  roundedRectPath(ctx, box.x, box.y, box.w, box.h, 26);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.textAlign = "center";

  const name = data.name.trim() || "Partenaire";
  ctx.fillStyle = COLORS.red;
  fitFont(ctx, name, box.w - 90, 44, 800, 24);
  ctx.fillText(name, centerX, box.y + 62);

  const message = data.message.trim();
  ctx.font = sansFont(27, 400);
  const lines = message
    ? wrapText(ctx, message, box.w - 110, 3)
    : ["Merci de votre soutien à la Convention."];
  ctx.fillStyle = message ? COLORS.ink : COLORS.grey;
  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, box.y + 124 + index * 40);
  });

  /* ---------------- Ornement + slogan ---------------- */
  const ornamentY = 1082;
  ctx.beginPath();
  ctx.moveTo(centerX - 150, ornamentY);
  ctx.lineTo(centerX - 26, ornamentY);
  ctx.moveTo(centerX + 26, ornamentY);
  ctx.lineTo(centerX + 150, ornamentY);
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = COLORS.red;
  drawStar(ctx, centerX, ornamentY, 12, 5);

  ctx.fillStyle = COLORS.red;
  fitFont(ctx, "INNOVER · ENTREPRENDRE · IMPACTER", WIDTH - 140, 34, 800, 20);
  ctx.textAlign = "center";
  ctx.fillText("INNOVER", centerX - 356, 1132);
  ctx.fillText("ENTREPRENDRE", centerX, 1132);
  ctx.fillText("IMPACTER", centerX + 356, 1132);
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(centerX - 178, 1123, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + 178, 1123, 7, 0, Math.PI * 2);
  ctx.fill();

  /* ---------------- Informations pratiques ---------------- */
  const rowY = 1194;

  ctx.beginPath();
  ctx.moveTo(WIDTH / 3, rowY - 34);
  ctx.lineTo(WIDTH / 3, rowY + 30);
  ctx.moveTo((WIDTH / 3) * 2, rowY - 34);
  ctx.lineTo((WIDTH / 3) * 2, rowY + 30);
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 2;
  ctx.stroke();

  const dateLabel = data.eventDateLabel?.trim() || "09 - 10 — OCTOBRE 2026";
  const [dateLine1, dateLine2] = dateLabel.split(" — ");
  const locationLabel = data.location?.trim() || "Maradi, Niger";
  const [cityLine1, cityLine2] = locationLabel.split(",");

  ctx.textAlign = "left";

  drawCalendarIcon(ctx, 118, rowY);
  ctx.fillStyle = COLORS.red;
  fitFont(ctx, dateLine1, 250, 30, 800, 20);
  ctx.fillText(dateLine1, 168, rowY - 12);
  ctx.fillStyle = COLORS.ink;
  ctx.font = sansFont(23, 500);
  ctx.fillText(dateLine2 ?? dateLine1, 168, rowY + 22);

  drawPinIcon(ctx, 452, rowY);
  ctx.fillStyle = COLORS.red;
  fitFont(ctx, cityLine1, 240, 30, 800, 20);
  ctx.fillText(cityLine1, 502, rowY - 12);
  ctx.fillStyle = COLORS.ink;
  ctx.font = sansFont(23, 500);
  ctx.fillText((cityLine2 ?? "Niger").trim(), 502, rowY + 22);

  drawPeopleIcon(ctx, 786, rowY);
  ctx.fillStyle = COLORS.red;
  ctx.font = sansFont(24, 800);
  ctx.fillText("Conférences", 826, rowY - 12);
  ctx.fillStyle = COLORS.ink;
  ctx.font = sansFont(23, 500);
  ctx.fillText("Ateliers · Networking", 826, rowY + 22);

  /* ---------------- Vague rouge et or ---------------- */
  drawBottomWave(ctx);

}
