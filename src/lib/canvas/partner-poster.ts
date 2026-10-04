
import { sansFont } from "./fonts";

export type PartnerPosterData = {
  /** Nom de l'entreprise / du partenaire. */
  name: string;

  /** Type de partenariat : Partenaire officiel, Partenaire média, etc. */
  category: string;

  /** Description courte du partenaire. */
  message: string;

  /** Logo du partenaire. */
  logo: HTMLImageElement | null;

  /**
   * Affiche officielle de l'événement utilisée comme arrière-plan.
   *
   * IMPORTANT :
   * Cette image est considérée comme une affiche finale.
   *
   * Elle contient notamment :
   * - logo JCI Niger à gauche
   * - logo Convention au centre
   * - logo JCI Maradi à droite
   *
   * Elle doit rester parfaitement nette et intacte.
   */
  artwork?: HTMLImageElement | null;
};

const WIDTH = 1080;
const HEIGHT = 1350;

const COLORS = {
  night: "#1B0605",
  deep: "#2E0A06",
  gold: "#DFAE4E",
  goldLight: "#F3D08A",
  goldDark: "#A97A22",
  maroon: "#4A0E12",
  paper: "#FFFFFF",
  panel: "#140303",
};

/* ------------------------------------------------------------------ */
/* Utilitaires                                                        */
/* ------------------------------------------------------------------ */

/**
 * Limite une valeur entre deux bornes.
 */
function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

/**
 * Dessine une forme de ruban avec encoches latérales.
 */
function ribbonPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  notch: number
) {
  ctx.beginPath();

  ctx.moveTo(
    x + notch,
    y
  );

  ctx.lineTo(
    x + w - notch,
    y
  );

  ctx.lineTo(
    x + w,
    y + h / 2
  );

  ctx.lineTo(
    x + w - notch,
    y + h
  );

  ctx.lineTo(
    x + notch,
    y + h
  );

  ctx.lineTo(
    x,
    y + h / 2
  );

  ctx.closePath();
}

/**
 * Dessine un ruban doré premium.
 */
function drawRibbon(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  height: number,
  text: string,
  options: {
    maxWidth: number;
    startSize?: number;
    minSize?: number;
    horizontalPadding?: number;
  } = {
    maxWidth: 760,
  }
) {
  const startSize =
    options.startSize ?? 32;

  const minSize =
    options.minSize ?? 15;

  const horizontalPadding =
    options.horizontalPadding ?? 90;

  const cleanText =
    text.trim() || "PARTENAIRE";

  let size =
    startSize;

  ctx.font =
    sansFont(
      size,
      700
    );

  while (
    size > minSize &&
    ctx.measureText(
      cleanText
    ).width >
      options.maxWidth
  ) {
    size -= 1;

    ctx.font =
      sansFont(
        size,
        700
      );
  }

  const textWidth =
    ctx.measureText(
      cleanText
    ).width;

  const width =
    Math.min(
      textWidth +
        horizontalPadding,
      WIDTH - 120
    );

  const x =
    centerX -
    width / 2;

  /* -------------------------------------------------------------- */
  /* Ombre                                                         */
  /* -------------------------------------------------------------- */

  ctx.save();

  ctx.shadowColor =
    "rgba(0,0,0,0.42)";

  ctx.shadowBlur = 16;

  ctx.shadowOffsetY = 5;

  ribbonPath(
    ctx,
    x,
    y,
    width,
    height,
    16
  );

  const gradient =
    ctx.createLinearGradient(
      0,
      y,
      0,
      y + height
    );

  gradient.addColorStop(
    0,
    COLORS.goldLight
  );

  gradient.addColorStop(
    0.48,
    COLORS.gold
  );

  gradient.addColorStop(
    1,
    COLORS.goldDark
  );

  ctx.fillStyle =
    gradient;

  ctx.fill();

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Bordure                                                        */
  /* -------------------------------------------------------------- */

  ctx.save();

  ribbonPath(
    ctx,
    x,
    y,
    width,
    height,
    16
  );

  ctx.strokeStyle =
    "rgba(74,14,18,0.45)";

  ctx.lineWidth = 2;

  ctx.stroke();

  /* Highlight supérieur */

  ctx.beginPath();

  ctx.moveTo(
    x + 20,
    y + 3
  );

  ctx.lineTo(
    x + width - 20,
    y + 3
  );

  ctx.strokeStyle =
    "rgba(255,255,255,0.28)";

  ctx.lineWidth = 1;

  ctx.stroke();

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Texte                                                          */
  /* -------------------------------------------------------------- */

  ctx.save();

  ctx.fillStyle =
    COLORS.maroon;

  ctx.font =
    sansFont(
      size,
      700
    );

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    cleanText,
    centerX,
    y + height / 2 + 1
  );

  ctx.restore();
}

/**
 * Retourne les lignes d'un texte avec une largeur maximale.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words =
    text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return [];
  }

  const lines: string[] = [];

  let current = "";

  for (
    const word of words
  ) {
    const candidate =
      current
        ? `${current} ${word}`
        : word;

    if (
      ctx.measureText(
        candidate
      ).width <= maxWidth ||
      !current
    ) {
      current =
        candidate;

      continue;
    }

    if (
      lines.length ===
      maxLines - 1
    ) {
      current =
        `${current} ${word}`;

      break;
    }

    lines.push(
      current
    );

    current =
      word;
  }

  if (current) {
    lines.push(
      current
    );
  }

  const kept =
    lines.slice(
      0,
      maxLines
    );

  if (
    lines.length >
    maxLines
  ) {
    const lastIndex =
      maxLines - 1;

    let last =
      kept[lastIndex];

    while (
      last.length > 0 &&
      ctx.measureText(
        `${last}…`
      ).width >
        maxWidth
    ) {
      last =
        last.replace(
          /\s+\S*$/,
          ""
        );
    }

    kept[lastIndex] =
      `${last}…`;
  }

  return kept;
}

/**
 * Dessine un cadre arrondi.
 */
function drawRoundedPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();

  ctx.roundRect(
    x,
    y,
    width,
    height,
    radius
  );
}

/* ------------------------------------------------------------------ */
/* Décor fallback                                                     */
/* ------------------------------------------------------------------ */

/**
 * Lueur chaude utilisée uniquement lorsque
 * l'affiche officielle n'est pas disponible.
 */
function drawEmberGlow(
  ctx: CanvasRenderingContext2D
) {
  const glow =
    ctx.createRadialGradient(
      880,
      340,
      40,
      880,
      340,
      780
    );

  glow.addColorStop(
    0,
    "rgba(255,178,89,0.95)"
  );

  glow.addColorStop(
    0.28,
    "rgba(255,122,24,0.65)"
  );

  glow.addColorStop(
    0.62,
    "rgba(180,50,10,0.28)"
  );

  glow.addColorStop(
    1,
    "rgba(27,6,5,0)"
  );

  ctx.fillStyle =
    glow;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  const shade =
    ctx.createLinearGradient(
      0,
      0,
      WIDTH * 0.75,
      HEIGHT
    );

  shade.addColorStop(
    0,
    "rgba(15,4,4,0.85)"
  );

  shade.addColorStop(
    0.55,
    "rgba(15,4,4,0.12)"
  );

  shade.addColorStop(
    1,
    "rgba(15,4,4,0)"
  );

  ctx.fillStyle =
    shade;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );
}

/**
 * Architecture utilisée uniquement si aucune affiche officielle
 * n'est fournie.
 */
function drawArchitecture(
  ctx: CanvasRenderingContext2D
) {
  ctx.save();

  ctx.fillStyle =
    "rgba(24,6,4,0.72)";

  /* Minaret principal */

  ctx.fillRect(
    872,
    300,
    96,
    700
  );

  ctx.fillRect(
    852,
    286,
    136,
    26
  );

  ctx.fillRect(
    886,
    200,
    68,
    90
  );

  ctx.fillRect(
    872,
    186,
    96,
    18
  );

  ctx.beginPath();

  ctx.arc(
    920,
    186,
    48,
    Math.PI,
    0
  );

  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(
    920,
    84
  );

  ctx.lineTo(
    908,
    140
  );

  ctx.lineTo(
    932,
    140
  );

  ctx.closePath();

  ctx.fill();

  /* Minaret secondaire */

  ctx.fillRect(
    1012,
    470,
    58,
    530
  );

  ctx.fillRect(
    1000,
    458,
    82,
    20
  );

  ctx.beginPath();

  ctx.arc(
    1041,
    458,
    29,
    Math.PI,
    0
  );

  ctx.fill();

  ctx.restore();
}

/**
 * Motifs décoratifs très discrets.
 */
function drawOrnament(
  ctx: CanvasRenderingContext2D
) {
  ctx.save();

  ctx.strokeStyle =
    "rgba(255,235,210,0.07)";

  ctx.lineWidth = 2;

  for (
    const centerX of [
      26,
      WIDTH - 26,
    ]
  ) {
    for (
      let y = 60;
      y < HEIGHT - 40;
      y += 96
    ) {
      ctx.save();

      ctx.translate(
        centerX,
        y
      );

      ctx.rotate(
        Math.PI / 4
      );

      ctx.strokeRect(
        -20,
        -20,
        40,
        40
      );

      ctx.restore();

      ctx.beginPath();

      ctx.arc(
        centerX,
        y + 48,
        16,
        Math.PI * 0.15,
        Math.PI * 0.85
      );

      ctx.stroke();
    }
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Affiche officielle                                                 */
/* ------------------------------------------------------------------ */

/**
 * Dessine l'affiche officielle comme un véritable background.
 *
 * Règles :
 *
 * 1. Aucun blur.
 * 2. Aucun filtre.
 * 3. Aucun overlay.
 * 4. Aucun recadrage.
 * 5. Aucune déformation.
 *
 * Si le ratio est identique au canvas :
 * → rendu exactement sur toute la surface.
 *
 * Si le ratio est différent :
 * → contain, donc l'intégralité de l'image reste visible.
 */
function drawOfficialArtwork(
  ctx: CanvasRenderingContext2D,
  artwork: HTMLImageElement
) {
  if (
    !artwork ||
    artwork.width <= 0 ||
    artwork.height <= 0
  ) {
    return;
  }

  /*
   * Ratio de l'image originale.
   */
  const imageRatio =
    artwork.width /
    artwork.height;

  /*
   * Ratio du canvas.
   */
  const canvasRatio =
    WIDTH / HEIGHT;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  /*
   * Cas idéal :
   *
   * L'affiche a exactement le même ratio
   * que notre format 1080 × 1350.
   */
  if (
    Math.abs(
      imageRatio -
        canvasRatio
    ) < 0.001
  ) {
    drawWidth =
      WIDTH;

    drawHeight =
      HEIGHT;

    drawX = 0;
    drawY = 0;
  } else {
    /*
     * Cas où l'affiche possède un ratio différent.
     *
     * On utilise contain.
     *
     * IMPORTANT :
     * on ne coupe absolument rien.
     */
    const scaleX =
      WIDTH /
      artwork.width;

    const scaleY =
      HEIGHT /
      artwork.height;

    const imageScale =
      Math.min(
        scaleX,
        scaleY
      );

    drawWidth =
      artwork.width *
      imageScale;

    drawHeight =
      artwork.height *
      imageScale;

    drawX =
      (WIDTH -
        drawWidth) /
      2;

    /*
     * Collee en haut :
     * aucune bande sombre n'apparait
     * au-dessus de l'affiche.
     */
    drawY = 0;
  }

  /*
   * Fond derrière l'affiche
   * uniquement dans le cas où contain
   * laisse apparaître des bandes.
   *
   * Ce fond ne touche jamais à l'affiche elle-même.
   */
  ctx.save();

  ctx.fillStyle =
    COLORS.night;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  /*
   * Aucun filtre.
   */
  ctx.filter =
    "none";

  /*
   * Opacité complète.
   */
  ctx.globalAlpha =
    1;

  /*
   * Mode de composition normal.
   */
  ctx.globalCompositeOperation =
    "source-over";

  /*
   * Dessin de l'affiche officielle.
   */
  ctx.drawImage(
    artwork,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );

  /*
   * Si l'image est moins haute que le canvas,
   * le reliquat est rempli avec la teinte de son
   * propre bandeau creme : aucun trait noir
   * n'apparait en bas non plus.
   */
  const reste =
    HEIGHT -
    drawY -
    drawHeight;

  if (reste > 1) {
    try {
      const pixel = ctx.getImageData(
        Math.round(drawX + drawWidth / 2),
        Math.round(drawY + drawHeight) - 30,
        1,
        1
      ).data;

      ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    } catch {
      ctx.fillStyle = COLORS.night;
    }

    ctx.fillRect(
      0,
      drawY + drawHeight,
      WIDTH,
      reste
    );
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Logo partenaire                                                   */
/* ------------------------------------------------------------------ */

/**
 * Dessine le cercle contenant le logo du partenaire.
 */
function drawPartnerLogo(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  logo: HTMLImageElement | null,
  fallbackLetter: string
) {
  /* -------------------------------------------------------------- */
  /* Halo extérieur                                                 */
  /* -------------------------------------------------------------- */

  ctx.save();

  const halo =
    ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.65,
      centerX,
      centerY,
      radius * 1.35
    );

  halo.addColorStop(
    0,
    "rgba(255,190,80,0.38)"
  );

  halo.addColorStop(
    0.65,
    "rgba(255,145,40,0.14)"
  );

  halo.addColorStop(
    1,
    "rgba(255,145,40,0)"
  );

  ctx.fillStyle =
    halo;

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    radius * 1.35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Ombre du cercle                                                */
  /* -------------------------------------------------------------- */

  ctx.save();

  ctx.shadowColor =
    "rgba(0,0,0,0.40)";

  ctx.shadowBlur = 28;

  ctx.shadowOffsetY = 8;

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#FFFDF7";

  ctx.fill();

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Logo                                                           */
  /* -------------------------------------------------------------- */

  ctx.save();

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    radius - 3,
    0,
    Math.PI * 2
  );

  ctx.clip();

  if (
    logo &&
    logo.width > 0 &&
    logo.height > 0
  ) {
    /*
     * Marge intérieure.
     *
     * Elle permet de garder les logos
     * élégants qu'ils soient horizontaux,
     * carrés ou verticaux.
     */
    const maxW =
      radius * 2 - 80;

    const maxH =
      radius * 2 - 80;

    const ratio =
      Math.min(
        maxW / logo.width,
        maxH / logo.height
      );

    const dw =
      logo.width *
      ratio;

    const dh =
      logo.height *
      ratio;

    ctx.drawImage(
      logo,
      centerX - dw / 2,
      centerY - dh / 2,
      dw,
      dh
    );
  } else {
    ctx.fillStyle =
      COLORS.maroon;

    ctx.font =
      sansFont(
        120,
        800
      );

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.fillText(
      fallbackLetter,
      centerX,
      centerY
    );
  }

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Bordures dorées                                               */
  /* -------------------------------------------------------------- */

  ctx.save();

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    radius,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(223,174,78,0.95)";

  ctx.lineWidth = 5;

  ctx.stroke();

  /* Deuxième bordure */

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    radius - 8,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(223,174,78,0.22)";

  ctx.lineWidth = 1;

  ctx.stroke();

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Nom du partenaire                                                 */
/* ------------------------------------------------------------------ */

/**
 * Ruban du nom.
 *
 * Le ruban chevauche volontairement
 * le bas du cercle.
 */
function drawPartnerName(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  name: string
) {
  drawRibbon(
    ctx,
    centerX,
    y,
    66,
    name.toUpperCase(),
    {
      maxWidth: 760,
      startSize: 30,
      minSize: 15,
      horizontalPadding: 100,
    }
  );
}

/* ------------------------------------------------------------------ */
/* Description                                                        */
/* ------------------------------------------------------------------ */

function drawDescriptionPanel(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  message: string
) {
  const panelX = 70;

  const panelWidth =
    WIDTH - 140;

  const panelHeight =
    155;

  const radius = 12;

  /* -------------------------------------------------------------- */
  /* Ombre                                                          */
  /* -------------------------------------------------------------- */

  ctx.save();

  ctx.shadowColor =
    "rgba(0,0,0,0.36)";

  ctx.shadowBlur = 18;

  ctx.shadowOffsetY = 6;

  drawRoundedPanel(
    ctx,
    panelX,
    y,
    panelWidth,
    panelHeight,
    radius
  );

  ctx.fillStyle =
    "rgba(20,3,3,0.78)";

  ctx.fill();

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Bordure principale                                             */
  /* -------------------------------------------------------------- */

  ctx.save();

  drawRoundedPanel(
    ctx,
    panelX,
    y,
    panelWidth,
    panelHeight,
    radius
  );

  ctx.strokeStyle =
    "rgba(223,174,78,0.82)";

  ctx.lineWidth = 2;

  ctx.stroke();

  /* Bordure intérieure */

  drawRoundedPanel(
    ctx,
    panelX + 7,
    y + 7,
    panelWidth - 14,
    panelHeight - 14,
    radius - 3
  );

  ctx.strokeStyle =
    "rgba(243,208,138,0.24)";

  ctx.lineWidth = 1;

  ctx.stroke();

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Élément décoratif supérieur                                    */
  /* -------------------------------------------------------------- */

  ctx.save();

  ctx.strokeStyle =
    "rgba(223,174,78,0.70)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    centerX - 95,
    y + 15
  );

  ctx.lineTo(
    centerX - 25,
    y + 15
  );

  ctx.moveTo(
    centerX + 25,
    y + 15
  );

  ctx.lineTo(
    centerX + 95,
    y + 15
  );

  ctx.stroke();

  ctx.fillStyle =
    COLORS.gold;

  ctx.beginPath();

  ctx.moveTo(
    centerX,
    y + 9
  );

  ctx.lineTo(
    centerX + 6,
    y + 15
  );

  ctx.lineTo(
    centerX,
    y + 21
  );

  ctx.lineTo(
    centerX - 6,
    y + 15
  );

  ctx.closePath();

  ctx.fill();

  ctx.restore();

  /* -------------------------------------------------------------- */
  /* Texte                                                          */
  /* -------------------------------------------------------------- */

  const cleanMessage =
    message.trim();

  ctx.save();

  let fontSize = 25;

  ctx.font =
    sansFont(
      fontSize,
      400
    );

  const maxTextWidth =
    panelWidth - 90;

  /*
   * Réduction légère de la taille
   * si le texte est très long.
   */
  while (
    fontSize > 18 &&
    cleanMessage &&
    ctx.measureText(
      cleanMessage
    ).width >
      maxTextWidth * 1.35
  ) {
    fontSize -= 1;

    ctx.font =
      sansFont(
        fontSize,
        400
      );
  }

  const lines =
    cleanMessage
      ? wrapText(
          ctx,
          cleanMessage,
          maxTextWidth,
          3
        )
      : [
          "Merci de votre soutien à la Convention.",
        ];

  ctx.fillStyle =
    "#FFFFFF";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.shadowColor =
    "rgba(0,0,0,0.60)";

  ctx.shadowBlur = 7;

  ctx.shadowOffsetY = 2;

  const lineHeight =
    fontSize + 12;

  const totalHeight =
    lines.length *
    lineHeight;

  const firstY =
    y +
    panelHeight / 2 -
    totalHeight / 2 +
    lineHeight / 2 +
    5;

  lines.forEach(
    (
      line,
      index
    ) => {
      ctx.fillText(
        line,
        centerX,
        firstY +
          index *
            lineHeight
      );
    }
  );

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Génération de l'affiche                                           */
/* ------------------------------------------------------------------ */

/**
 * Génère l'affiche partenaire.
 *
 * Philosophie :
 *
 * ┌─────────────────────────────────────┐
 * │                                     │
 * │     AFFICHE OFFICIELLE              │
 * │     100 % INTACTE                   │
 * │                                     │
 * │  JCI Niger | Convention | JCI Maradi│
 * │                                     │
 * │             LOGO PARTENAIRE         │
 * │                  ◯                  │
 * │               ━━━━━━━               │
 * │               NOM                   │
 * │                                     │
 * │          PARTENAIRE OFFICIEL        │
 * │                                     │
 * │        ┌─────────────────┐          │
 * │        │    MESSAGE      │          │
 * │        └─────────────────┘          │
 * │                                     │
 * └─────────────────────────────────────┘
 *
 * L'affiche officielle n'est jamais floutée,
 * assombrie ou recadrée.
 */
export async function drawPartnerPoster(
  canvas: HTMLCanvasElement,
  data: PartnerPosterData,
  options: {
    scale?: number;
  } = {}
) {
  /*
   * Scale 1 :
   * 1080 × 1350
   *
   * Scale 2 :
   * 2160 × 2700
   *
   * etc.
   */
  const scale =
    Math.max(
      0.5,
      options.scale ?? 1
    );

  canvas.width =
    Math.round(
      WIDTH * scale
    );

  canvas.height =
    Math.round(
      HEIGHT * scale
    );

  const ctx =
    canvas.getContext(
      "2d"
    );

  if (!ctx) {
    return;
  }

  /*
   * Toute la composition est dessinée
   * dans un espace logique de 1080 × 1350.
   */
  ctx.setTransform(
    scale,
    0,
    0,
    scale,
    0,
    0
  );

  ctx.clearRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  const centerX =
    WIDTH / 2;

  const name =
    data.name.trim() ||
    "Partenaire";

  /* ================================================================ */
  /* FOND                                                            */
  /* ================================================================ */

  const artwork =
    data.artwork;

  if (
    artwork &&
    artwork.width > 0 &&
    artwork.height > 0
  ) {
    /*
     * IMPORTANT :
     *
     * Ici nous ne faisons absolument
     * rien à l'affiche officielle.
     *
     * Pas de :
     * - blur
     * - overlay
     * - opacity
     * - filtre
     * - assombrissement
     * - recadrage
     */
    drawOfficialArtwork(
      ctx,
      artwork
    );
  } else {
    /*
     * Fallback uniquement si aucune affiche
     * officielle n'est fournie.
     */
    const background =
      ctx.createLinearGradient(
        0,
        0,
        WIDTH,
        HEIGHT
      );

    background.addColorStop(
      0,
      COLORS.night
    );

    background.addColorStop(
      0.5,
      COLORS.deep
    );

    background.addColorStop(
      1,
      COLORS.night
    );

    ctx.fillStyle =
      background;

    ctx.fillRect(
      0,
      0,
      WIDTH,
      HEIGHT
    );

    drawEmberGlow(
      ctx
    );

    drawArchitecture(
      ctx
    );

    drawOrnament(
      ctx
    );
  }

  /* ================================================================ */
  /* LOGO PARTENAIRE                                                 */
  /* ================================================================ */

  /*
   * Le partenaire est volontairement
   * placé sous la zone des logos officiels.
   *
   * L'affiche officielle reste visible
   * derrière lui.
   */
  const circleY = 405;

  const circleR = 174;

  drawPartnerLogo(
    ctx,
    centerX,
    circleY,
    circleR,
    data.logo,
    name
      .charAt(0)
      .toUpperCase()
  );

  /* ================================================================ */
  /* NOM DU PARTENAIRE                                               */
  /* ================================================================ */

  const nameRibbonY =
    circleY +
    circleR -
    30;

  drawPartnerName(
    ctx,
    centerX,
    nameRibbonY,
    name
  );

  /* ================================================================ */
  /* TYPE DE PARTENARIAT                                             */
  /* ================================================================ */

  const category =
    data.category.trim() ||
    "PARTENAIRE";

  const categoryY =
    nameRibbonY + 88;

  drawRibbon(
    ctx,
    centerX,
    categoryY,
    54,
    category.toUpperCase(),
    {
      maxWidth: 720,
      startSize: 25,
      minSize: 14,
      horizontalPadding: 90,
    }
  );

  /* ================================================================ */
  /* DESCRIPTION                                                     */
  /* ================================================================ */

  const descriptionY =
    categoryY + 76;

  drawDescriptionPanel(
    ctx,
    centerX,
    descriptionY,
    data.message
  );

  /* ================================================================ */
  /* BORDURE EXTÉRIEURE                                             */
  /* ================================================================ */

  /*
   * Cette bordure est uniquement un élément
   * ajouté par le générateur.
   *
   * Elle ne modifie pas l'affiche originale.
   */
  ctx.save();

  ctx.strokeStyle =
    "rgba(223,174,78,0.18)";

  ctx.lineWidth = 2;

  ctx.strokeRect(
    14,
    14,
    WIDTH - 28,
    HEIGHT - 28
  );

  ctx.restore();

  /* ================================================================ */
  /* RESET DU CANVAS                                                 */
  /* ================================================================ */

  ctx.setTransform(
    1,
    0,
    0,
    1,
    0,
    0
  );
}
