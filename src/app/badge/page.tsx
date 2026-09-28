"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PhotoUpload from "@/components/form/PhotoUpload";
import Confetti from "@/components/Confetti";
import { drawBadge } from "@/lib/canvas/badge";
import {
  loadImageFromFile,
  canvasToBlob,
} from "@/lib/canvas/loadImage";
import { track } from "@/lib/analytics";
import { createBadgeRecord } from "@/lib/badgeService";

const ROLES = [
  "Participant",
  "Délégué",
  "Membre JCI",
  "Invité",
  "Speaker",
  "Organisateur",
  "Partenaire",
  "Média",
  "Bénévole",
];

type Step = "form" | "loading" | "result";

export default function BadgePage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [organization, setOrganization] = useState("");
  const [city, setCity] = useState("");
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [uniqueCode, setUniqueCode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Veuillez ajouter votre nom.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleGenerate() {
    if (!validate()) return;
    setStep("loading");
    try {
      const { uniqueCode: code } = await createBadgeRecord({
        name: name.trim(),
        role,
        organization: organization.trim(),
        city: city.trim(),
      });

      const photo = photoImg;
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("no_canvas");

      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      await drawBadge(canvas, {
        name: name.trim(),
        role,
        organization: organization.trim(),
        city: city.trim(),
        photo,
        uniqueCode: code,
        verifyUrl: `${origin}/badge/verify/${code}`,
        eventDateLabel: "9 — 10 OCTOBRE",
        location: "MARADI",
      });

      setUniqueCode(code);
      setPngUrl(canvas.toDataURL("image/png"));
      track("badge_generated", { role, has_photo: Boolean(photoImg) });
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
    a.download = `badge-jci-convention-2026-${slugify(name)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    track("badge_downloaded");
  }

  async function handleShare() {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    if (!blob) return;
    const file = new File([blob], "badge-jci-2026.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Mon badge — Convention JCI Niger 2026",
        });
        return;
      } catch {
        // cancelled
      }
    }
    handleDownload();
  }

  return (
    <main className="bg-canvas">
      <Confetti active={step === "result"} />
      <div className="container-edge py-10 md:py-16 max-w-2xl mx-auto pb-28 lg:pb-16">
        <p className="eyebrow">Mon badge</p>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl text-balance">
          Créez votre badge officiel
        </h1>
        <p className="mt-2 text-ink/60 font-sans text-sm">
          Votre identité pour la Convention, directement sur votre téléphone.
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
                  placeholder="Ex : Ibrahim Saley"
                  className={inputClass(!!errors.name)}
                />
              </Field>

              <Field label="Fonction / rôle">
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-full px-4 py-2 text-sm border transition-all duration-150 active:scale-[0.97] ${
                        role === r
                          ? "bg-blue text-ink border-blue shadow-cta font-medium"
                          : "border-line/20 bg-white hover:border-blue/50 hover:bg-blue/5"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Organisation / Local JCI">
                  <input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Ex : JCI Maradi"
                    className={inputClass(false)}
                  />
                </Field>
                <Field label="Ville">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex : Maradi"
                    className={inputClass(false)}
                  />
                </Field>
              </div>

              <Field label="Photo du badge">
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

              <button
                onClick={handleGenerate}
                className="btn btn-primary btn-lg btn-block"
              >
                Générer mon badge
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
              <p className="font-serif text-xl">Création de ton badge…</p>
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
                Ton badge est prêt 🎫
              </p>
              <div className="rounded-xl2 overflow-hidden shadow-lift border border-line/10 max-w-sm mx-auto bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pngUrl} alt="Badge Convention JCI Niger 2026" className="w-full" />
              </div>

              {uniqueCode && (
                <p className="mt-4 text-center text-xs text-ink/40 font-mono">
                  {uniqueCode}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <button onClick={handleDownload} className="btn btn-primary">
                  Télécharger
                </button>
                <button onClick={handleShare} className="btn btn-secondary">
                  Partager
                </button>
                <button
                  onClick={handleDownload}
                  className="btn btn-secondary col-span-2"
                >
                  Ajouter à mon téléphone
                </button>
              </div>

              <Link
                href="/visuel"
                className="btn btn-ghost mt-6 mx-auto flex"
              >
                Créer aussi mon visuel de participation →
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
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "participant"
  );
}
