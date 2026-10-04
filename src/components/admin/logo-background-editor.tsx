"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  EraserIcon,
  LoaderIcon,
  RefreshCwIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";
import {
  dataUrlToFile,
  removeLogoBackground,
  type BackgroundResult,
} from "@/lib/logoBackground";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

/**
 * Bouton « Supprimer l'arrière-plan » : prévisualise le logo traité puis
 * renvoie un PNG transparent prêt à être enregistré.
 */
export function LogoBackgroundEditor({
  logoUrl,
  onApply,
  busy,
}: {
  logoUrl?: string | null;
  onApply: (file: File) => Promise<void> | void;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tolerance, setTolerance] = useState(18);
  const [smoothness, setSmoothness] = useState(60);
  const [result, setResult] = useState<BackgroundResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setWorking(true);
    setError(null);
    removeLogoBackground(logoUrl as string, { tolerance, smoothness })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setResult(null);
          setError(
            err.message.includes("CORS") || err.message.includes("tainted")
              ? "Image inaccessible depuis le navigateur."
              : err.message
          );
        }
      })
      .finally(() => {
        if (!cancelled) setWorking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, logoUrl, tolerance, smoothness]);

  async function handleApply() {
    if (!result) return;
    const file = dataUrlToFile(result.dataUrl, `logo-sans-fond-${Date.now()}.png`);
    await onApply(file);
    toast.success("Arrière-plan supprimé", {
      description: "Le logo transparent a été enregistré.",
    });
    setOpen(false);
    setResult(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!logoUrl || busy}
        onClick={() => setOpen(true)}
      >
        <EraserIcon className="h-4 w-4" />
        Supprimer l’arrière-plan
      </Button>

      <Dialog open={open} onOpenChange={(value) => !value && setOpen(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Supprimer l’arrière-plan du logo</DialogTitle>
            <DialogDescription>
              Le fond est détecté depuis les coins de l’image, ce qui fonctionne
              surtout sur un fond uni (blanc, noir, gris). Rien n’est enregistré
              tant que tu n’as pas validé.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Avant</p>
              <div className="flex h-52 items-center justify-center overflow-hidden rounded-lg border bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl ?? ""} alt="Logo d'origine" className="max-h-full w-auto object-contain" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                Après
                {result && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                    {result.removedRatio.toFixed(1)} % retiré
                  </span>
                )}
              </p>
              <div
                className="flex h-52 items-center justify-center overflow-hidden rounded-lg border p-2"
                style={{
                  backgroundColor: "#f1f5f9",
                  backgroundImage:
                    "linear-gradient(45deg,#cbd5e1 25%,transparent 25%),linear-gradient(-45deg,#cbd5e1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cbd5e1 75%),linear-gradient(-45deg,transparent 75%,#cbd5e1 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0px",
                }}
              >
                {working ? (
                  <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.dataUrl} alt="Logo sans arrière-plan" className="max-h-full w-auto object-contain" />
                ) : (
                  <p className="px-4 text-center text-xs text-muted-foreground">
                    {error ?? "Aperçu indisponible"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="logo-tolerance">Tolérance</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{tolerance}</span>
              </div>
              <input
                id="logo-tolerance"
                type="range"
                min={4}
                max={80}
                value={tolerance}
                onChange={(event) => setTolerance(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[#0097D7]"
              />
              <p className="text-[11px] text-muted-foreground">
                Plus la valeur est haute, plus le fond est retiré (au risque de
                rogner le logo).
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="logo-smoothness">Lissage</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{smoothness}</span>
              </div>
              <input
                id="logo-smoothness"
                type="range"
                min={0}
                max={100}
                value={smoothness}
                onChange={(event) => setSmoothness(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[#0097D7]"
              />
              <p className="text-[11px] text-muted-foreground">
                Adoucit le contour du logo après la suppression du fond.
              </p>
            </div>
          </div>

          {result && result.removedRatio > 88 && (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <TriangleAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {result.removedRatio.toFixed(0)} % de l’image a été effacée : baisse la
              tolérance, sinon des parties du logo vont disparaître.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleApply} disabled={!result || working}>
              {working ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
              {working ? "Traitement…" : "Appliquer"}
            </Button>
          </DialogFooter>

          <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <RefreshCwIcon className="h-3 w-3" />
            L’image d’origine reste dans le bucket ; seule l’adresse utilisée par la fiche est remplacée.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
