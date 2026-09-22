"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PhotoUpload from "@/components/form/PhotoUpload";
import { drawPoster } from "@/lib/canvas/poster";
import { loadImageFromFile, canvasToBlob } from "@/lib/canvas/loadImage";
import { track } from "@/lib/analytics";

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
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [organization, setOrganization] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedMessage, setSelectedMessage] = useState(PRESET_MESSAGES[0]);
  const [customMessage, setCustomMessage] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const finalMessage = useCustom ? customMessage.trim() : selectedMessage;

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
    setStep("loading");
    try {
      const photo = photoFile ? await loadImageFromFile(photoFile) : null;
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("no_canvas");
      await drawPoster(canvas, {
        name: name.trim(),
        city: city.trim(),
        organization: organization.trim(),
        message: finalMessage || PRESET_MESSAGES[0],
        photo,
        eventDateLabel: "9 — 10 OCTOBRE",
        location: "MARADI",
        hashtag: HASHTAG,
      });
      const url = canvas.toDataURL("image/png");
      setPngUrl(url);
      track("poster_generated", { has_photo: Boolean(photoFile) });
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
    a.download = `visuel-jci-convention-2026-${slugify(name)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    track("poster_downloaded");
  }

  function handleWhatsapp() {
    const message = `🗣️ Je participe à la Convention JCI Niger 2026 !\n\n📍 Maradi\n📅 9–10 octobre\n\nEt toi, tu viens ?\n\n${HASHTAG}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    track("whatsapp_share_clicked");
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
      <div className="container-edge py-10 md:py-16 max-w-2xl mx-auto pb-28 lg:pb-16">
        <p className="eyebrow">Mon visuel</p>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl text-balance">
          Créez votre visuel officiel
        </h1>
        <p className="mt-2 text-ink/60 font-sans text-sm">
          Affichez votre participation à la Convention JCI Niger 2026.
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
                <PhotoUpload onFile={setPhotoFile} />
              </Field>

              <Field label="Votre message" error={errors.customMessage}>
                <div className="space-y-2">
                  {PRESET_MESSAGES.map((m) => (
                    <label
                      key={m}
                      className={`flex items-start gap-3 rounded-xl2 border p-3.5 cursor-pointer transition-all duration-150 ${
                        !useCustom && selectedMessage === m
                          ? "border-blue bg-blue/10 shadow-card"
                          : "border-line/15 bg-white hover:border-blue/40 hover:bg-blue/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="message"
                        className="mt-1 accent-blue"
                        checked={!useCustom && selectedMessage === m}
                        onChange={() => {
                          setUseCustom(false);
                          setSelectedMessage(m);
                        }}
                      />
                      <span className="text-sm">{m}</span>
                    </label>
                  ))}
                  <label
                    className={`flex items-start gap-3 rounded-xl2 border p-3.5 cursor-pointer transition-all duration-150 ${
                      useCustom
                        ? "border-blue bg-blue/10 shadow-card"
                        : "border-line/15 bg-white hover:border-blue/40 hover:bg-blue/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="message"
                      className="mt-1 accent-blue"
                      checked={useCustom}
                      onChange={() => setUseCustom(true)}
                    />
                    <span className="text-sm w-full">
                      Mon propre message
                      {useCustom && (
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Écrivez votre message…"
                          maxLength={90}
                          rows={2}
                          className="input mt-2 p-2.5"
                        />
                      )}
                    </span>
                  </label>
                </div>
              </Field>

              <button
                onClick={handleGenerate}
                className="btn btn-primary btn-lg btn-block"
              >
                Générer mon visuel
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
              <p className="font-serif text-xl">Création de ton visuel…</p>
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
                Ton visuel est prêt 🎉
              </p>
              <div className="rounded-xl2 overflow-hidden shadow-lift border border-line/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pngUrl} alt="Visuel Convention JCI Niger 2026" className="w-full" />
              </div>

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

              <Link
                href="/badge"
                className="btn btn-ghost mt-6 mx-auto flex"
              >
                Créer aussi mon badge officiel →
              </Link>
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
