import { sansFont, quoteFont } from "./fonts";

export type PosterData = {
  name: string;
  city: string;
  organization: string;
  message: string;
  photo: HTMLImageElement | null;
  eventDateLabel: string; // e.g. "9 — 10 OCTOBRE"
  location: string; // e.g. "MARADI"
  hashtag: string; // e.g. "#MaConventionJCI2026"
};

const WIDTH = 1080;
const HEIGHT = 1350;

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: "left" | "center" = "center"
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  lines.forEach((l, i) => {
    const lx = align === "center" ? x : x;
    ctx.textAlign = align;
    ctx.fillText(l, lx, y + i * lineHeight);
  });
  return lines.length;
}

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "/logo.png";
  });
}

export async function drawPoster(
  canvas: HTMLCanvasElement,
  data: PosterData
) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle JCI blue hairlines framing the card
  const margin = 56;
  ctx.strokeStyle = "rgba(0,151,215,0.5)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, margin, margin, WIDTH - margin * 2, HEIGHT - margin * 2, 28);
  ctx.stroke();

  // JCI accent bars top-left corner
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(margin + 24, margin + 24, 46, 6);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(margin + 76, margin + 24, 46, 6);

  // Prominent logo (stands out at the top)
  const logo = await loadLogo();
  const logoW = 320;
  const logoMaxH = 140;
  const logoX = WIDTH / 2;
  const logoY = margin + 48;
  if (logo && logo.width && logo.height) {
    const scale = Math.min(logoW / logo.width, logoMaxH / logo.height);
    const dw = logo.width * scale;
    const dh = logo.height * scale;
    const dx = logoX - dw / 2;
    const dy = logoY;

    ctx.save();
    ctx.shadowColor = "rgba(0,151,215,0.65)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 8;
    // white plate behind logo so it always pops on dark bg
    const padX = 36;
    const padY = 24;
    ctx.fillStyle = COLORS.paper;
    roundedRectPath(
      ctx,
      dx - padX,
      dy - padY,
      dw + padX * 2,
      dh + padY * 2,
      28
    );
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    // blue accent under plate
    ctx.fillStyle = COLORS.blue;
    roundedRectPath(
      ctx,
      dx - padX,
      dy + dh + padY - 8,
      dw + padX * 2,
      8,
      4
    );
    ctx.fill();
    ctx.drawImage(logo, dx, dy, dw, dh);
    ctx.restore();
  }

  // Eyebrow: JCI NIGER
  ctx.fillStyle = COLORS.blue;
  ctx.font = sansFont(26, 600);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "4px";
  ctx.fillText("JCI NIGER", WIDTH / 2, margin + 250);
  ctx.letterSpacing = "0px";

  // Title
  ctx.fillStyle = COLORS.paper;
  ctx.font = sansFont(64, 600);
  ctx.fillText("CONVENTION 2026", WIDTH / 2, margin + 320);

  // Date / location
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = sansFont(28, 500);
  ctx.fillText(
    `${data.eventDateLabel} · ${data.location.toUpperCase()}`,
    WIDTH / 2,
    margin + 366
  );

  // Photo circle
  const photoCenterY = 660;
  const photoRadius = 140;
  ctx.save();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, photoCenterY, photoRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#1E1942";
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
    ctx.drawImage(
      img,
      WIDTH / 2 - dw / 2,
      photoCenterY - dh / 2,
      dw,
      dh
    );
  } else {
    ctx.fillStyle = "#2C2654";
    ctx.fill();
    ctx.fillStyle = COLORS.blue;
    ctx.font = sansFont(90, 600);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      data.name ? data.name.charAt(0).toUpperCase() : "J",
      WIDTH / 2,
      photoCenterY + 8
    );
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, photoCenterY, photoRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Name
  ctx.fillStyle = COLORS.paper;
  ctx.font = sansFont(56, 600);
  ctx.textAlign = "center";
  ctx.fillText(data.name || "Votre nom", WIDTH / 2, photoCenterY + 210);

  // City / organization
  ctx.fillStyle = COLORS.blueLight;
  ctx.font = sansFont(26, 500);
  const meta = [data.organization, data.city].filter(Boolean).join(" · ");
  ctx.fillText(meta || "Local JCI · Ville", WIDTH / 2, photoCenterY + 250);

  // Personal message
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = quoteFont(32, 400, true);
  const messageY = photoCenterY + 320;
  wrapText(
    ctx,
    `« ${data.message || "Je viens rencontrer et connecter."} »`,
    WIDTH / 2,
    messageY,
    WIDTH - margin * 2 - 100,
    42,
    "center"
  );

  // Hashtag footer
  ctx.fillStyle = COLORS.blue;
  ctx.font = sansFont(30, 600);
  ctx.fillText(data.hashtag, WIDTH / 2, HEIGHT - margin - 50);
}
