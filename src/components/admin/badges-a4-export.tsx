"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PrinterIcon } from "lucide-react";
import { drawBadge } from "@/lib/canvas/badge";
import { drawBadgeLandscape } from "@/lib/canvas/badge-landscape";
import { drawBadgeCard } from "@/lib/canvas/badge-card";
import { ensureCanvasFonts } from "@/lib/canvas/fonts";
import { Button } from "@/components/ui/button";
import type { Badge } from "@/lib/types";

/**
 * Export « prêt pour l'imprimeur » : tous les badges sont posés sur des
 * feuilles A4 paysage, avec un repère de coupe autour de chacun.
 *
 * Deux formats :
 *  - `vertical` : 54 × 80 mm, 10 badges par page (8 feuilles pour 78) ;
 *  - `paysage`  : 100 × 65 mm, 4 badges par page (20 feuilles pour 78).
 *
 * Le PDF est produit par la fenêtre d'impression du navigateur
 * (Fichier > Enregistrer au format PDF) : aucune dépendance à installer.
 */

type Format = "vertical" | "paysage" | "a6" | "compact";

const FORMATS: Record<
  Format,
  {
    colonnes: number;
    rangees: number;
    badgeW: number;
    badgeH: number;
    parPage: number;
    libelle: string;
    renderScale: number;
    cropMarks: boolean;
    gap: number;
  }
> = {
  vertical: {
    colonnes: 5,
    rangees: 2,
    badgeW: 54,
    badgeH: 80,
    parPage: 10,
    libelle: "vertical 54 × 80 mm",
    renderScale: 0.62,
    cropMarks: false,
    gap: 4,
  },
  paysage: {
    colonnes: 2,
    rangees: 2,
    badgeW: 100,
    badgeH: 65,
    parPage: 4,
    libelle: "paysage 100 × 65 mm",
    renderScale: 1,
    cropMarks: false,
    gap: 4,
  },
  a6: {
    colonnes: 2,
    rangees: 1,
    badgeW: 115,
    badgeH: 175,
    parPage: 2,
    libelle: "A6 115 × 175 mm (encoche pour le clip)",
    renderScale: 1,
    cropMarks: true,
    // 10 mm : les traits de coupe des deux cartes ne se touchent pas.
    gap: 10,
  },
  compact: {
    colonnes: 4,
    rangees: 2,
    badgeW: 67,
    badgeH: 100,
    parPage: 8,
    libelle: "67 × 100 mm (encoche pour le clip)",
    renderScale: 1,
    cropMarks: true,
    gap: 6,
  },
};

const PAGE = { width: 297, height: 210 }; // A4 paysage, en millimètres
const MARGIN = 5;
const GAP = 4;

export function BadgesA4Export({
  badges,
  eventDateLabel,
  location,
}: {
  badges: Badge[];
  eventDateLabel: string;
  location: string;
}) {
  const [busy, setBusy] = useState<Format | null>(null);

  async function exportFormat(format: Format) {
    if (badges.length === 0) return;
    const config = FORMATS[format];
    setBusy(format);

    try {
      await ensureCanvasFonts();
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const siteLabel = origin.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const images: string[] = [];
      for (const badge of badges) {
        const canvas = document.createElement("canvas");
        const common = {
          name: badge.full_name,
          role: badge.role,
          organization: badge.organization ?? "",
          city: badge.city ?? "",
          uniqueCode: badge.unique_code,
          verifyUrl: `${origin}/badge/verify/${badge.unique_code}`,
          eventDateLabel: (eventDateLabel ?? "").toUpperCase(),
          location: (location ?? "").toUpperCase(),
          siteLabel,
        };

        if (format === "paysage") {
          await drawBadgeLandscape(canvas, common, { scale: config.renderScale });
        } else if (format === "a6" || format === "compact") {
          await drawBadgeCard(canvas, common, {
            size: format === "compact" ? "compact" : "a6",
            slot: true,
            scale: config.renderScale,
          });
        } else {
          await drawBadge(canvas, common, { scale: config.renderScale });
        }

        // JPEG : bien plus léger que le PNG pour 78 badges.
        images.push(canvas.toDataURL("image/jpeg", 0.92));
      }

      const pages: string[][] = [];
      for (let i = 0; i < images.length; i += config.parPage) {
        pages.push(images.slice(i, i + config.parPage));
      }

      const fenetre = window.open("", "_blank", "width=1100,height=800");
      if (!fenetre) {
        toast.error("La fenêtre d'impression a été bloquée. Autorisez les pop-ups.");
        return;
      }

      const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Badges — Convention 2026</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f4f4f5; }
  .page {
    width: ${PAGE.width}mm;
    height: ${PAGE.height}mm;
    padding: ${MARGIN}mm;
    display: grid;
    grid-template-columns: repeat(${config.colonnes}, ${config.badgeW}mm);
    grid-auto-rows: ${config.badgeH}mm;
    gap: ${config.gap}mm;
    justify-content: center;
    align-content: center;
    background: #fff;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .slot { position: relative; width: ${config.badgeW}mm; height: ${config.badgeH}mm; }
  .badge {
    width: 100%;
    height: 100%;
    overflow: hidden;
    ${
      config.cropMarks
        ? "outline: 0.1mm solid #9a9a9e;"
        : "outline: 0.2mm dashed #b4b4b8; outline-offset: -0.2mm;"
    }
  }
  .badge img { width: 100%; height: 100%; display: block; }
  /* Traits de coupe : 8 par carte, a l'exterieur du format. */
  .cm { position: absolute; background: #000; display: block; }
  .cm.h { width: 4mm; height: 0.15mm; }
  .cm.v { width: 0.15mm; height: 4mm; }
  .tl-h { left: 0; top: -2.5mm; }
  .tl-v { left: -2.5mm; top: 0; }
  .tr-h { right: 0; top: -2.5mm; }
  .tr-v { right: -2.5mm; top: 0; }
  .bl-h { left: 0; bottom: -2.5mm; }
  .bl-v { left: -2.5mm; bottom: 0; }
  .br-h { right: 0; bottom: -2.5mm; }
  .br-v { right: -2.5mm; bottom: 0; }
  @media screen {
    .page { margin: 0 auto 8mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
    .note {
      max-width: ${PAGE.width}mm;
      margin: 0 auto 6mm;
      font: 13px/1.5 system-ui, sans-serif;
      color: #444;
    }
  }
</style>
</head>
<body>
<p class="note">
  ${badges.length} badge(s) — ${pages.length} page(s) A4 paysage,
  ${config.parPage} par page, format ${config.libelle}.
  Dans la fenêtre d'impression : destination « Enregistrer au format PDF »,
  format A4, marges « Aucune », échelle 100 %. Les pointillés sont les repères de coupe.
</p>
${pages
  .map(
    (page) =>
      `<section class="page">${page
        .map(
          (src) =>
            `<div class="slot"><div class="badge"><img src="${src}" alt="" /></div>${
              config.cropMarks
                ? '<i class="cm h tl-h"></i><i class="cm v tl-v"></i>' +
                  '<i class="cm h tr-h"></i><i class="cm v tr-v"></i>' +
                  '<i class="cm h bl-h"></i><i class="cm v bl-v"></i>' +
                  '<i class="cm h br-h"></i><i class="cm v br-v"></i>'
                : ""
            }</div>`
        )
        .join("")}</section>`
  )
  .join("\n")}
<script>
  window.addEventListener("load", () => {
    setTimeout(() => window.print(), 350);
  });
</script>
</body>
</html>`;

      fenetre.document.write(html);
      fenetre.document.close();
      fenetre.focus();

      toast.success(
        `${badges.length} badge(s) — ${pages.length} page(s), format ${config.libelle}`
      );
    } catch {
      toast.error("L'export A4 a échoué. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  if (badges.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportFormat("paysage")}
        disabled={busy !== null}
      >
        <PrinterIcon className="h-4 w-4" />
        {busy === "paysage"
          ? "Mise en page…"
          : `A4 100 × 65 (${Math.ceil(badges.length / 4)} p.)`}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportFormat("compact")}
        disabled={busy !== null}
      >
        <PrinterIcon className="h-4 w-4" />
        {busy === "compact"
          ? "Mise en page…"
          : `67 × 100 (${Math.ceil(badges.length / 8)} p.)`}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportFormat("a6")}
        disabled={busy !== null}
      >
        <PrinterIcon className="h-4 w-4" />
        {busy === "a6"
          ? "Mise en page…"
          : `A6 115 × 175 (${Math.ceil(badges.length / 2)} p.)`}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportFormat("vertical")}
        disabled={busy !== null}
      >
        <PrinterIcon className="h-4 w-4" />
        {busy === "vertical"
          ? "Mise en page…"
          : `A4 vertical (${Math.ceil(badges.length / 10)} p.)`}
      </Button>
    </>
  );
}