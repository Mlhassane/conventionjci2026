"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Formulaire public « Laisser un avis » : soumission sans compte,
 * publiée après modération par l'organisation.
 */
export default function AvisForm() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError("Indiquez votre nom.");
      return;
    }
    if (message.trim().length < 4) {
      setError("Votre message est un peu court.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = getSupabaseClient();
    const { error: insertError } = await supabase
      ?.from("feedbacks")
      .insert({
        name: name.trim(),
        city: city.trim() || null,
        organization: organization.trim() || null,
        message: message.trim(),
        rating,
      });
    setSaving(false);
    if (insertError) {
      setError("Envoi impossible pour le moment. Réessayez.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card p-6 md:p-8 text-center">
        <p className="font-serif text-2xl">Merci pour votre retour !</p>
        <p className="mt-2 text-sm text-ink/60 leading-relaxed">
          Votre avis sera publié après validation par l&apos;organisation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8 shadow-card space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Nom complet</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Aïcha Moussa"
          className="input"
          maxLength={120}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Ville (optionnel)</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex : Maradi"
            className="input"
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Organisation (optionnel)</label>
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Ex : JCI Niamey"
            className="input"
            maxLength={160}
          />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">Note (optionnel)</span>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Note">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              onClick={() => setRating(rating === star ? null : star)}
              className={`text-2xl leading-none transition-transform hover:scale-110 ${
                rating !== null && star <= rating ? "text-blue" : "text-line"
              }`}
            >
              ★
            </button>
          ))}
          {rating !== null && (
            <span className="ml-2 text-xs text-ink/50">{rating}/5</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Votre retour sur la Convention</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Qu'avez-vous aimé ? Que peut-on améliorer ?"
          rows={4}
          maxLength={1000}
          className="input"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
        {saving ? "Envoi…" : "Publier mon avis"}
      </button>
      <p className="text-xs text-ink/45">
        Les avis sont relus par l&apos;organisation avant publication.
      </p>
    </form>
  );
}
