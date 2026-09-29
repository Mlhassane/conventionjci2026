"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaletteIcon, SaveIcon, SettingsIcon } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/form/ImageUpload";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import { EventSettings } from "@/lib/types";
import { defaultEventSettings } from "@/lib/defaultSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TextAreaField, TextField } from "@/components/admin/ui/form-fields";
import { PageHeader } from "@/components/admin/ui/page-header";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSettings(defaultEventSettings);
      return;
    }
    supabase
      .from("event_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSettings((data as EventSettings) ?? defaultEventSettings));
  }, []);

  async function handleLogoFile(
    file: File,
    field: "logo_url" | "secondary_logo_url",
    fixedName: string
  ) {
    setError(null);
    setUploading(field);
    const url = await uploadAdminImage("branding", "logos", file, { fixedName });
    setUploading(null);
    if (!url) {
      setError("Échec de l’envoi du logo. Réessayez.");
      return;
    }
    setSettings((current) => (current ? { ...current, [field]: url } : current));
  }

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
      toast.error("Enregistrement impossible");
      return;
    }
    toast.success("Modifications enregistrées");
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paramètres de l’événement"
        description="Ces informations alimentent l’ensemble de la plateforme — aucune donnée n’est codée en dur dans les pages."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-line/10 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              Identité de l’événement
            </CardTitle>
            <CardDescription>Nom, dates, lieu et textes d&apos;accroche.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              label="Nom de l’événement"
              value={settings.event_name}
              onChange={(value) => setSettings({ ...settings, event_name: value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Date de début"
                type="date"
                value={settings.start_date}
                onChange={(value) => setSettings({ ...settings, start_date: value })}
              />
              <TextField
                label="Date de fin"
                type="date"
                value={settings.end_date}
                onChange={(value) => setSettings({ ...settings, end_date: value })}
              />
            </div>
            <TextField
              label="Lieu"
              value={settings.location}
              onChange={(value) => setSettings({ ...settings, location: value })}
            />
            <TextField
              label="Slogan (tagline)"
              value={settings.tagline}
              onChange={(value) => setSettings({ ...settings, tagline: value })}
            />
            <TextField
              label="Hashtag"
              value={settings.hashtag}
              onChange={(value) => setSettings({ ...settings, hashtag: value })}
            />
            <TextAreaField
              label="Texte d’accroche (hero)"
              rows={3}
              value={settings.hero_text}
              onChange={(value) => setSettings({ ...settings, hero_text: value })}
            />
            <TextAreaField
              label="Description SEO"
              rows={2}
              hint="Titre et description utilisés par Google et lors des partages"
              value={settings.seo_description ?? ""}
              onChange={(value) => setSettings({ ...settings, seo_description: value })}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-line/10 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PaletteIcon className="h-4 w-4 text-muted-foreground" />
                Logos & couleurs
              </CardTitle>
              <CardDescription>Identifiants visuels utilisés sur le site public.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs text-ink/60">Logo principal</p>
                  <div className="rounded-lg border border-line/10 bg-muted/40 p-3">
                    <ImageUpload
                      onFile={(file) => handleLogoFile(file, "logo_url", "primary")}
                      currentUrl={settings.logo_url}
                      error={uploading === "logo_url" ? "Envoi en cours…" : null}
                      shape="rect"
                      label="Téléverser le logo principal"
                      hint="PNG transparent recommandé, 8 Mo max"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-ink/60">Logo secondaire</p>
                  <div className="rounded-lg border border-line/10 bg-muted/40 p-3">
                    <ImageUpload
                      onFile={(file) => handleLogoFile(file, "secondary_logo_url", "secondary")}
                      currentUrl={settings.secondary_logo_url}
                      error={uploading === "secondary_logo_url" ? "Envoi en cours…" : null}
                      shape="rect"
                      label="Téléverser le logo secondaire"
                      hint="PNG transparent recommandé, 8 Mo max"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-ink/60" htmlFor="color-primary">
                    Couleur primaire
                  </label>
                  <input
                    id="color-primary"
                    type="color"
                    value={settings.color_primary}
                    onChange={(event) =>
                      setSettings({ ...settings, color_primary: event.target.value })
                    }
                    className="h-10 w-full cursor-pointer rounded-lg border border-line/15 bg-white p-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-ink/60" htmlFor="color-accent">
                    Couleur accent
                  </label>
                  <input
                    id="color-accent"
                    type="color"
                    value={settings.color_accent}
                    onChange={(event) =>
                      setSettings({ ...settings, color_accent: event.target.value })
                    }
                    className="h-10 w-full cursor-pointer rounded-lg border border-line/15 bg-white p-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-line/10 shadow-card">
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
              <CardDescription>Liens affichés dans le pied de page du site.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Email de contact"
                type="email"
                placeholder="contact@jci-niger.org"
                hint="Affiché dans le pied de page du site"
                value={settings.contact_email ?? ""}
                onChange={(value) => setSettings({ ...settings, contact_email: value })}
              />
              <TextField
                label="Téléphone de contact"
                inputMode="tel"
                hint="Affiché dans le pied de page du site"
                value={settings.contact_phone ?? ""}
                onChange={(value) => setSettings({ ...settings, contact_phone: value })}
              />
              <TextField
                label="Facebook"
                placeholder="https://facebook.com/…"
                value={settings.social_facebook ?? ""}
                onChange={(value) => setSettings({ ...settings, social_facebook: value })}
              />
              <TextField
                label="Instagram"
                placeholder="https://instagram.com/…"
                value={settings.social_instagram ?? ""}
                onChange={(value) => setSettings({ ...settings, social_instagram: value })}
              />
              <TextField
                label="LinkedIn"
                placeholder="https://linkedin.com/…"
                value={settings.social_linkedin ?? ""}
                onChange={(value) => setSettings({ ...settings, social_linkedin: value })}
              />
              <TextField
                label="WhatsApp"
                placeholder="https://wa.me/…"
                value={settings.social_whatsapp ?? ""}
                onChange={(value) => setSettings({ ...settings, social_whatsapp: value })}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || Boolean(uploading)}>
          <SaveIcon className="h-4 w-4" />
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
