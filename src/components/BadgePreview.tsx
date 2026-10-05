"use client";

import { useEffect, useRef, useState } from "react";
import { drawBadge } from "@/lib/canvas/badge";
import { ensureCanvasFonts } from "@/lib/canvas/fonts";
import { canvasToBlob } from "@/lib/canvas/loadImage";
import { track } from "@/lib/analytics";

export type BadgePreviewData = {
  full_name: string;
  role: string;
  organization: string | null;
  city: string | null;
  photo_url: string | null;
  unique_code: string;
};


/**
 * Rend le PNG officiel d'un badge et propose le téléchargement.
 * Les informations imprimées (date, lieu) proviennent des paramètres de
 * l'événement, modifiables depuis l'admin > Paramètres.
 */
export default function BadgePreview({
  badge,
  eventDateLabel,
  location,
}: {
  badge: BadgePreviewData;
  eventDateLabel?: string;
  location?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureCanvasFonts();
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const origin =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (typeof window !== "undefined" ? window.location.origin : "");
        await drawBadge(canvas, {
          name: badge.full_name,
          role: badge.role,
          organization: badge.organization ?? "",
          city: badge.city ?? "",
          uniqueCode: badge.unique_code,
          verifyUrl: `${origin}/badge/verify/${badge.unique_code}`,
          siteLabel: origin.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          eventDateLabel: (eventDateLabel ?? "").toUpperCase(),
          location: (location ?? "").toUpperCase(),
        });
        if (!cancelled) setPngUrl(canvas.toDataURL("image/png"));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [badge, eventDateLabel, location]);

  async function handleDownload() {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `badge-${badge.unique_code}.png`;
    a.click();
    URL.revokeObjectURL(url);
    track("badge_downloaded");
  }

  if (failed) {
    return (
      <p className="text-sm text-danger">
        Impossible d&apos;afficher le badge. Réessayez plus tard.
      </p>
    );
  }

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      {!pngUrl ? (
        <div className="rounded-xl2 border border-line/10 bg-white p-10 flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue border-t-transparent animate-spin" />
          <p className="text-sm text-ink/50">Préparation du badge…</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl2 overflow-hidden shadow-lift border border-line/10 max-w-sm mx-auto bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pngUrl}
              alt={`Badge ${badge.full_name} — Convention JCI Niger 2026`}
              className="w-full"
            />
          </div>
          <p className="mt-4 text-center text-xs text-ink/40 font-mono">
            {badge.unique_code}
          </p>
          <div className="mt-5 max-w-sm mx-auto">
            <button onClick={handleDownload} className="btn btn-primary btn-block">
              Télécharger mon badge
            </button>
          </div>
        </>
      )}
    </div>
  );
}
