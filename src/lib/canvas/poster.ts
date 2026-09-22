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
  yellow: "#EFC40F", // JCI Yellow
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

  // JCI accent bars (blue + yellow) top-left corner, small and restrained
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(margin + 24, margin + 24, 46, 6);
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(margin + 76, margin + 24, 46, 6);

  // Eyebrow: JCI NIGER
  ctx.fillStyle = COLORS.blue;
  ctx.font = "600 26px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "4px";
  ctx.fillText("JCI NIGER", WIDTH / 2, margin + 130);
  ctx.letterSpacing = "0px";

  // Title
  ctx.fillStyle = COLORS.paper;
  ctx.font = "600 64px Fraunces, Georgia, serif";
  ctx.fillText("CONVENTION 2026", WIDTH / 2, margin + 200);

  // Date / location
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 28px Manrope, sans-serif";
  ctx.fillText(
    `${data.eventDateLabel} · ${data.location.toUpperCase()}`,
    WIDTH / 2,
    margin + 246
  );

  // Photo circle
  const photoCenterY = 560;
  const photoRadius = 150;
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
    ctx.font = "600 90px Manrope, sans-serif";
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
  ctx.font = "600 56px Fraunces, Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(data.name || "Votre nom", WIDTH / 2, photoCenterY + 230);

  // City / organization
  ctx.fillStyle = COLORS.blueLight;
  ctx.font = "500 26px Manrope, sans-serif";
  const meta = [data.organization, data.city].filter(Boolean).join(" · ");
  ctx.fillText(meta || "Local JCI · Ville", WIDTH / 2, photoCenterY + 270);

  // Personal message
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "italic 400 32px Fraunces, Georgia, serif";
  const messageY = photoCenterY + 350;
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
  ctx.font = "600 30px Manrope, sans-serif";
  ctx.fillText(data.hashtag, WIDTH / 2, HEIGHT - margin - 50);
}
