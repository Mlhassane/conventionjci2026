"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PhotoUpload from "@/components/form/PhotoUpload";
import Confetti from "@/components/Confetti";
import { drawPoster } from "@/lib/canvas/poster";
import { drawJyseraiPoster } from "@/lib/canvas/jyserai";
import {
  loadImageFromFile,
  loadImageFromUrl,
  canvasToBlob,
} from "@/lib/canvas/loadImage";
import { track } from "@/lib/analytics";
import { saveJyseraiParticipation } from "@/lib/jyseraiService";

const PRESET_MESSAGES = [
  "Je viens rencontrer et connecter.",
  "Je viens apprendre et construire.",
  "Je viens développer mon leadership.",
  "Je viens servir ma communauté.",
  "Je viens écrire la suite avec les jeunes leaders du Niger.",
];

const HASHTAG = "#MaConventionJCI2026";

type Step = "form" | "loading" | "result";

export default function VisuelPage() {
  const pathname = usePathname();
  const isJyserai = pathname === "/j-y-seri";
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [organization, setOrganization] = useState("");
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [selectedMessage, setSelectedMessage] = useState(PRESET_MESSAGES[0]);
  const [customMessage, setCustomMessage] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [photoScale, setPhotoScale] = useState(1);
  const [photoOffsetX, setPhotoOffsetX] = useState(0);
  const [photoOffsetY, setPhotoOffsetY] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "offline">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const finalMessage = useCustom ? customMessage.trim() : selectedMessage;

  // Live preview for the J'y serai editor. The regular /visuel page keeps
  // its explicit generate flow; the participation page updates immediately.
  useEffect(() => {
    if (!isJyserai) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        if (cancelled) return;
        await drawJyseraiPoster(canvas, {
          name: name.trim(),
          city: city.trim(),
          organization: organization.trim(),
          message: finalMessage || PRESET_MESSAGES[0],
          photo: photoImg,
          photoScale,
          photoOffsetX,
          photoOffsetY,
          hashtag: HASHTAG,
        });
      } catch {
        // The form remains usable if the preview cannot be drawn yet.
      }
    }, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isJyserai,
    name,
    city,
    organization,
    finalMessage,
    photoImg,
    photoScale,
    photoOffsetX,
    photoOffsetY,
  ]);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Veuillez ajouter votre nom.";
    if (useCustom && !customMessage.trim())
      next.customMessage = "Veuillez écrire votre message ou choisir un message prédéfini.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleGenerate() {
    if (!validate()) return;
    setSaveState("idle");
    setStep("loading");
    try {
      const photo = photoImg;
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("no_canvas");
      const posterData = {
        name: name.trim(),
        city: city.trim(),
        organization: organization.trim(),
        message: finalMessage || PRESET_MESSAGES[0],
        photo,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        hashtag: HASHTAG,
      };

      if (isJyserai) {
        await drawJyseraiPoster(canvas, posterData);
      } else {
        await drawPoster(canvas, {
          ...posterData,
          eventDateLabel: "9 — 10 OCTOBRE",
          location: "MARADI",
        });
      }

      if (isJyserai) {
        const blob = await canvasToBlob(canvas);
        if (blob) {
          const result = await saveJyseraiParticipation({
            name: name.trim(),
            city: city.trim(),
            organization: organization.trim(),
            message: finalMessage || PRESET_MESSAGES[0],
            imageBlob: blob,
          });
          setSaveState(result.saved ? "saved" : "offline");
        } else {
          setSaveState("offline");
        }
      }

      const url = canvas.toDataURL("image/png");
      setPngUrl(url);
      track("poster_generated", { has_photo: Boolean(photoImg) });
      setStep("result");
    } catch {
      setErrors({ global: "Une erreur est survenue. Réessayez." });
      setStep("form");
    }
  }

  async function handleDownload() {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isJyserai ? "j-y-seri" : "visuel"}-jci-convention-2026-${slugify(name)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    track("poster_downloaded");
  }

  async function handleWhatsapp() {
    const message = `🗣️ Je participe à la Convention JCI Niger 2026 !\n\n📍 Maradi\n📅 9–10 octobre\n\nEt toi, tu viens ?\n\n${HASHTAG}`;
    track("whatsapp_share_clicked");
    if (!canvasRef.current) return;

    const blob = await canvasToBlob(canvasRef.current);
    if (!blob) return;
    const file = new File(
      [blob],
      `${isJyserai ? "j-y-seri" : "visuel"}-jci-convention-2026-${slugify(name)}.png`,
      { type: "image/png" }
    );

    // Mobile browsers can attach the generated PNG through the native share
    // sheet. WhatsApp is selected by the user from that sheet.
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "J’y serai — Convention JCI Niger 2026",
          text: message,
        });
        track("poster_shared");
        return;
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
      }
    }

    // Desktop browsers cannot attach a local file through wa.me. Download it
    // first, then open WhatsApp so the user can attach the image manually.
    handleDownload();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  async function handleShare() {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    if (!blob) return;
    const file = new File([blob], "visuel-jci-2026.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Convention JCI Niger 2026",
          text: `Je participe à la Convention JCI Niger 2026 ! ${HASHTAG}`,
        });
        track("poster_shared");
        return;
      } catch {
        // user cancelled — no-op
      }
    }
    handleDownload();
  }

  return (
    <main className="bg-canvas">
      <Confetti active={step === "result"} />
      <div className="container-edge py-10 md:py-16 max-w-2xl mx-auto pb-28 lg:pb-16">
        <div className="flex justify-center mb-6">
          <div className="rounded-3xl bg-white px-6 py-4 shadow-soft ring-2 ring-blue/30">
            <Image
              src="/logo.png"
              alt="JCI Experience"
              width={240}
              height={84}
              priority
              className="h-12 md:h-14 w-auto object-contain"
            />
          </div>
        </div>
        <p className="eyebrow">{isJyserai ? "J’y serai" : "Mon visuel"}</p>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl text-balance">
          {isJyserai ? "J’y serai à la Convention" : "Créez votre visuel officiel"}
        </h1>
        <p className="mt-2 text-ink/60 font-sans text-sm">
          {isJyserai
            ? "Ajoutez vos informations pour créer votre visuel de participation."
            : "Affichez votre participation à la Convention JCI Niger 2026."}
        </p>

        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 card p-6 md:p-8 shadow-card space-y-6"
            >
              {isJyserai && (
                <div className="rounded-xl2 border border-blue/20 bg-blue/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Aperçu en direct</p>
                    <span className="rounded-full bg-blue/10 px-2.5 py-1 text-[11px] font-medium text-blue-dark">
                      Modification
                    </span>
                  </div>
                  <canvas
                    ref={previewCanvasRef}
                    className="mx-auto block w-full max-w-sm rounded-xl2 border border-line/10 shadow-card"
                    aria-label="Aperçu du visuel J'y serai"
                  />
                  <p className="mt-3 text-center text-xs text-ink/45">
                    L’aperçu se met à jour dès que vous changez la photo ou les
                    réglages.
                  </p>
                </div>
              )}

              {errors.global && (
                <div className="rounded-xl2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {errors.global}
                </div>
              )}

              <Field label="Nom complet" error={errors.name}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Aïcha Moussa"
                  className={inputClass(!!errors.name)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ville">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex : Maradi"
                    className={inputClass(false)}
                  />
                </Field>
                <Field label="Organisation / Local JCI">
                  <input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Ex : JCI Niamey"
                    className={inputClass(false)}
                  />
                </Field>
              </div>

              <Field label="Photo (optionnelle)">
                <PhotoUpload
                  onFile={(f) => {
                    if (!f) {
                      setPhotoImg(null);
                      return;
                    }
                    loadImageFromFile(f)
                      .then((img) => setPhotoImg(img))
                      .catch(() => setPhotoImg(null));
                  }}
                />
              </Field>

              {isJyserai && (
                <div className="space-y-4 rounded-xl2 border border-line/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide2 text-ink/50">
                      Ajuster la photo
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoScale(1);
                        setPhotoOffsetX(0);
                        setPhotoOffsetY(0);
                      }}
                      className="text-xs font-medium text-blue-dark hover:underline"
                    >
                      Réinitialiser
                    </button>
                  </div>
                  <label className="block text-xs text-ink/60">
                    <span className="mb-1.5 flex justify-between">
                      <span>Taille</span>
                      <span>{Math.round(photoScale * 100)}%</span>
                    </span>
                    <input
                      aria-label="Taille de la photo"
                      type="range"
                      min="0.5"
                      max="1.4"
                      step="0.05"
                      value={photoScale}
                      onChange={(e) => setPhotoScale(Number(e.target.value))}
                      className="w-full accent-[#0097D7]"
                    />
                  </label>
                  <label className="block text-xs text-ink/60">
                    <span className="mb-1.5 flex justify-between">
                      <span aria-hidden="true">↔</span>
                      <span>{photoOffsetX > 0 ? `+${photoOffsetX}` : photoOffsetX} px</span>
                    </span>
                    <input
                      aria-label="Déplacement horizontal de la photo"
                      type="range"
                      min="-120"
                      max="120"
                      step="5"
                      value={photoOffsetX}
                      onChange={(e) => setPhotoOffsetX(Number(e.target.value))}
                      className="w-full accent-[#0097D7]"
                    />
                  </label>
                  <label className="block text-xs text-ink/60">
                    <span className="mb-1.5 flex justify-between">
                      <span aria-hidden="true">↕</span>
                      <span>{photoOffsetY > 0 ? `+${photoOffsetY}` : photoOffsetY} px</span>
                    </span>
                    <input
                      aria-label="Déplacement vertical de la photo"
                      type="range"
                      min="-200"
                      max="200"
                      step="5"
                      value={photoOffsetY}
                      onChange={(e) => setPhotoOffsetY(Number(e.target.value))}
                      className="w-full accent-[#0097D7]"
                    />
                  </label>
                </div>
              )}

              <button
                onClick={handleGenerate}
                className="btn btn-primary btn-lg btn-block"
              >
                {isJyserai ? "J’y serai" : "Générer mon visuel"}
              </button>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-20 flex flex-col items-center gap-4 text-center"
            >
              <div className="h-12 w-12 rounded-full border-2 border-blue border-t-transparent animate-spin" />
              <p className="font-serif text-xl">
                {isJyserai ? "Création de votre participation…" : "Création de ton visuel…"}
              </p>
            </motion.div>
          )}

          {step === "result" && pngUrl && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <p className="font-serif text-2xl text-center mb-6">
                {isJyserai ? "Votre participation est prête 🎉" : "Ton visuel est prêt 🎉"}
              </p>
              <div className="rounded-xl2 overflow-hidden shadow-lift border border-line/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pngUrl}
                  alt={isJyserai ? "j'y — Convention JCI Niger 2026" : "Visuel Convention JCI Niger 2026"}
                  className="w-full"
                />
              </div>
              {isJyserai && (
                <p
                  className={`mt-4 text-center text-xs ${
                    saveState === "saved" ? "text-success" : "text-ink/45"
                  }`}
                >
                  {saveState === "saved"
                    ? "✓ Votre participation et votre image ont été enregistrées."
                    : saveState === "offline"
                      ? "Image générée, mais l’enregistrement en ligne est indisponible."
                      : ""}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={handleDownload} className="btn btn-primary">
                  Télécharger
                </button>
                <button onClick={handleWhatsapp} className="btn btn-success">
                  Partager sur WhatsApp
                </button>
                <button onClick={handleShare} className="btn btn-secondary">
                  Partager
                </button>
                <button
                  onClick={() => setStep("form")}
                  className="btn btn-secondary"
                >
                  Modifier
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-ink/45">
                Sur téléphone, choisis WhatsApp dans le menu de partage pour
                joindre l’image.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `input ${hasError ? "input-error" : ""}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "participant";
}
