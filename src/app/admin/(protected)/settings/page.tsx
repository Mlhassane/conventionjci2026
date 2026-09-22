"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { EventSettings } from "@/lib/types";
import { mockEventSettings } from "@/lib/mockData";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSettings(mockEventSettings);
      return;
    }
    supabase
      .from("event_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSettings((data as EventSettings) ?? mockEventSettings));
  }, []);

  async function handleSave() {
    if (!settings) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { error: saveError } =
      settings.id && settings.id !== "mock"
        ? await supabase.from("event_settings").update(settings).eq("id", settings.id)
        : await supabase.from("event_settings").insert(settings);
    setSaving(false);
    if (saveError) {
      setError("Une erreur est survenue. Réessayez.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!settings) {
    return <p className="text-sm text-ink/50">Chargement…</p>;
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Administration</p>
      <h1 className="mt-4 font-serif text-3xl">Paramètres de l&apos;événement</h1>
      <p className="mt-2 text-sm text-ink/55">
        Ces informations alimentent l&apos;ensemble de la plateforme — aucune donnée
        n&apos;est codée en dur dans les pages.
      </p>

      <div className="mt-8 space-y-4">
        <Field label="Nom de l'événement">
          <input
            value={settings.event_name}
            onChange={(e) => setSettings({ ...settings, event_name: e.target.value })}
            className={inputClass}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Date de début">
            <input
              type="date"
              value={settings.start_date}
              onChange={(e) => setSettings({ ...settings, start_date: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Date de fin">
            <input
              type="date"
              value={settings.end_date}
              onChange={(e) => setSettings({ ...settings, end_date: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Lieu">
          <input
            value={settings.location}
            onChange={(e) => setSettings({ ...settings, location: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Slogan (tagline)">
          <input
            value={settings.tagline}
            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Hashtag">
          <input
            value={settings.hashtag}
            onChange={(e) => setSettings({ ...settings, hashtag: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Texte d'accroche (hero)">
          <textarea
            value={settings.hero_text}
            onChange={(e) => setSettings({ ...settings, hero_text: e.target.value })}
            rows={3}
            className={inputClass}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Logo principal (URL)">
            <input
              value={settings.logo_url ?? ""}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Logo secondaire (URL)">
            <input
              value={settings.secondary_logo_url ?? ""}
              onChange={(e) => setSettings({ ...settings, secondary_logo_url: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Couleur primaire">
            <input
              type="color"
              value={settings.color_primary}
              onChange={(e) => setSettings({ ...settings, color_primary: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-xl2 border border-line/15 bg-white p-1"
            />
          </Field>
          <Field label="Couleur accent">
            <input
              type="color"
              value={settings.color_accent}
              onChange={(e) => setSettings({ ...settings, color_accent: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-xl2 border border-line/15 bg-white p-1"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Facebook">
            <input
              value={settings.social_facebook ?? ""}
              onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Instagram">
            <input
              value={settings.social_instagram ?? ""}
              onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="LinkedIn">
            <input
              value={settings.social_linkedin ?? ""}
              onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp">
            <input
              value={settings.social_whatsapp ?? ""}
              onChange={(e) => setSettings({ ...settings, social_whatsapp: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
          {saved && <span className="text-sm text-success">Modifications enregistrées ✓</span>}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "input";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
