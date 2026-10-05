"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderIcon, TriangleAlertIcon } from "lucide-react";
import { drawPartnerPoster } from "@/lib/canvas/partner-poster";
import { ensureCanvasFonts } from "@/lib/canvas/fonts";
import { loadImageFromUrl } from "@/lib/canvas/loadImage";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Partner } from "@/lib/types";

const MONTHS = [
  "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
  "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
];

/** « 09 - 10 — OCTOBRE 2026 » : les deux lignes de la date sur l'affiche. */
function formatPosterDate(
  startISO?: string | null,
  endISO?: string | null
): string | undefined {
  if (!startISO) return undefined;
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;

  const pad = (value: number) => String(value).padStart(2, "0");
  const days =
    start.getUTCDate() === end.getUTCDate()
      ? pad(start.getUTCDate())
      : `${pad(start.getUTCDate())} - ${pad(end.getUTCDate())}`;
  return `${days} — ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
}

/**
 * Aperçu + téléchargement de l'affiche partenaire.
 * Le gabarit est redessiné dans le canvas, sur la photo des partenaires
 * servant d'arrière-plan ; seules les données du partenaire (logo, nom,
 * type de partnership et description) y sont injectées.
 */
/** Photo des partenaires servant d'arrière-plan à l'affiche. */
const PHOTO_PARTENAIRES = "/parteners.png";

export function PartnerPosterPreview({
  partner,
  scale = 0.5,
}: {
  partner: Partner;
  scale?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Arrière-plan discret : la photo des partenaires (l'affiche officielle).
        const artwork = await loadImageFromUrl(PHOTO_PARTENAIRES).catch(() => null);

        let eventDateLabel: string | undefined;
        let location: string | undefined;
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: settings } = await supabase
            .from("event_settings")
            .select("start_date, end_date, location")
            .limit(1)
            .maybeSingle();
          if (settings) {
            eventDateLabel = formatPosterDate(settings.start_date, settings.end_date);
            location = settings.location ?? undefined;
          }
        }

        const logo = partner.logo_url
          ? await loadImageFromUrl(partner.logo_url).catch(() => null)
          : null;

        await ensureCanvasFonts();
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        await drawPartnerPoster(
          canvas,
          {
            name: partner.name,
            category: partner.category,
            message: partner.description?.trim() || partner.offer?.trim() || "",
            logo,
            artwork,
            eventDateLabel,
            location,
          },
          { scale }
        );
        if (cancelled) return;
        setPngUrl(canvas.toDataURL("image/png"));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partner, scale]);

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    canvas.toBlob((blob) => {
      setDownloading(false);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `affiche-partenaire-${slugify(partner.name)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");
  }

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      {failed ? (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlertIcon className="h-4 w-4" />
          Affiche impossible à générer pour le moment.
        </p>
      ) : !pngUrl ? (
        <div className="flex h-72 items-center justify-center rounded-lg border bg-muted/30">
          <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pngUrl}
          alt={`Affiche du partenaire ${partner.name}`}
          className="w-full rounded-lg border"
        />
      )}

      <button
        type="button"
        onClick={handleDownload}
        disabled={!pngUrl || downloading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-blue hover:text-ink disabled:opacity-60"
      >
        {downloading ? (
          <LoaderIcon className="h-4 w-4 animate-spin" />
        ) : (
          <DownloadIcon />
        )}
        {downloading ? "Préparation…" : "Télécharger l’affiche"}
      </button>

      {!partner.description?.trim() && !partner.offer?.trim() && !failed && (
        <p className="text-[11px] text-muted-foreground">
          Aucune description renseignée : l’affiche affiche une mention de
          remerciement. Tu peux la saisir dans « Description ».
        </p>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5" />
      <path d="M5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-1.5" />
    </svg>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}