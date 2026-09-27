"use client";

import { useRef, useState } from "react";
import { MAX_PHOTO_SIZE_BYTES } from "@/lib/canvas/loadImage";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function PhotoUpload({
  onFile,
  error,
}: {
  onFile: (file: File | null) => void;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLocalError(null);
    if (!file) {
      onFile(null);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      onFile(null);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setLocalError("Format d’image non supporté. Utilisez JPG, PNG ou WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      onFile(null);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setLocalError("Fichier trop volumineux (8 Mo max).");
      e.target.value = "";
      return;
    }
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    onFile(file);
    e.target.value = "";
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center gap-4 rounded-xl2 border border-dashed border-line/25 bg-blue/[0.02] p-4 hover:border-blue hover:bg-blue/5 transition-colors text-left"
      >
        <div className="h-16 w-16 rounded-full bg-blue/10 border border-blue/20 overflow-hidden flex items-center justify-center shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-blue-dark"
              aria-hidden
            >
              <path
                d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2c.5 0 1-.25 1.3-.66l.8-1.07A1.5 1.5 0 0 1 11 3.5h2c.5 0 .97.24 1.26.65l.8 1.08c.3.41.78.66 1.29.66h1.15A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {preview ? "Changer la photo" : "Ajouter votre photo"}
          </p>
          <p className="text-xs text-ink/45 mt-0.5">JPG ou PNG, 8 Mo maximum</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {(error || localError) && (
        <p className="mt-2 text-xs text-danger">{error ?? localError}</p>
      )}
    </div>
  );
}
