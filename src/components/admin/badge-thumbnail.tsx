"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { drawBadge } from "@/lib/canvas/badge";
import { ensureCanvasFonts } from "@/lib/canvas/fonts";
import { loadImageFromUrl } from "@/lib/canvas/loadImage";
import type { BadgePreviewData } from "@/components/BadgePreview";
import { cn } from "@/lib/utils";

export type BadgeEvent = { dateLabel: string; location: string };

/**
 * Miniature de badge rendue par le même moteur que le PNG officiel :
 * c'est exactement ce qui sera imprimé, réduit pour la galerie.
 */
export function BadgeThumbnail({
  badge,
  event,
  scale = 0.3,
  className,
  onReady,
}: {
  badge: BadgePreviewData;
  event: BadgeEvent;
  scale?: number;
  className?: string;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const photo = badge.photo_url
          ? await loadImageFromUrl(badge.photo_url).catch(() => null)
          : null;
        await ensureCanvasFonts();
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const origin =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (typeof window !== "undefined" ? window.location.origin : "");
        await drawBadge(
          canvas,
          {
            name: badge.full_name,
            role: badge.role,
            organization: badge.organization ?? "",
            city: badge.city ?? "",
            photo,
            uniqueCode: badge.unique_code,
            verifyUrl: `${origin}/badge/verify/${badge.unique_code}`,
            eventDateLabel: event.dateLabel,
            location: event.location,
          },
          { scale }
        );
        if (!cancelled) {
          setReady(true);
          onReady?.();
        }
      } catch {
        // la miniature reste vide, la page n'est pas bloquée
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [badge, event.dateLabel, event.location, scale, onReady]);

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-paper", className)}>
      {!ready && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
        </span>
      )}
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ aspectRatio: "1080 / 1600" }}
      />
    </div>
  );
}
