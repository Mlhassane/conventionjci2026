"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/form/PhotoUpload";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  clearEspaceSession,
  getEspaceSession,
  updateMyProfile,
  useEspaceProfile,
} from "@/lib/espace";

export default function MonEspacePage() {
  const router = useRouter();
  const { status, profile, setProfile } = useEspaceProfile("/espace/mon-espace");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Strict separation: admins belong to the admin section, not here.
  useEffect(() => {
    if (profile?.is_admin) {
      router.replace("/admin/dashboard");
    }
  }, [profile, router]);

  async function toggleVisibility() {
    const session = getEspaceSession();
    if (!session || !profile) return;
    setSaving(true);
    const updated = await updateMyProfile(session, {
      is_public: !profile.is_public,
    });
    setSaving(false);
    if (updated) setProfile({ ...profile, ...updated });
  }

  async function handlePhoto(file: File | null) {
    setUploadError(null);
    if (!file || !profile) return;
    const session = getEspaceSession();
    const supabase = getSupabaseClient();
    if (!session || !supabase) {
      setUploadError("Connexion indisponible. Réessayez.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
      const path = `espace/${profile.member_code}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("photos")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      const updated = await updateMyProfile(session, {
        photo_url: data.publicUrl,
      });
      if (updated) {
        setProfile({ ...profile, ...updated });
      } else {
        throw new Error("profile_update_failed");
      }
    } catch {
      setUploadError("Échec de l'envoi. Réessayez avec une autre image.");
    }
    setUploading(false);
  }

  function handleLogout() {
    clearEspaceSession();
    router.push("/espace");
  }

  if (status !== "ready" || profile?.is_admin) {
    return (
      <main className="bg-canvas min-h-screen flex items-center justify-center">
        <p className="text-sm text-ink/50">Chargement de votre espace…</p>
      </main>
    );
  }

  if (!isSupabaseConfigured || !profile) {
    return (
      <main className="bg-canvas min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-ink/60">
          Impossible de charger votre espace pour le moment.
        </p>
      </main>
    );
  }

  const firstName = profile.name.split(" ")[0];
  const badge = profile.badge;

  return (
    <main className="bg-canvas min-h-screen">
      <div className="container-edge py-10 md:py-14 max-w-2xl mx-auto pb-28 lg:pb-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Espace participant</p>
            <h1 className="mt-4 font-serif text-3xl md:text-4xl text-balance">
              Bonjour, {firstName}
            </h1>
            <p className="mt-2 text-ink/60 font-sans text-sm leading-relaxed">
              Ajoutez votre photo, puis générez votre affiche et votre badge.
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost shrink-0">
            Déconnexion
          </button>
        </div>

        {/* ---------- Carte participant ---------- */}
        <div className="mt-8 card shadow-card p-6 md:p-8">
          <div className="flex items-center gap-4">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt={profile.name}
                className="h-16 w-16 shrink-0 rounded-full object-cover border-2 border-blue"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-xl text-blue">
                {getInitials(profile.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-serif text-xl leading-tight">{profile.name}</p>
              <p className="mt-0.5 text-sm text-ink/55">
                {[profile.role, profile.organization]
                  .filter(Boolean)
                  .join(" · ") || "Participant"}
              </p>
              {profile.city && (
                <p className="text-xs text-ink/45 mt-0.5">{profile.city}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue/10 px-3.5 py-1.5 font-mono text-xs font-medium text-blue-dark">
              {profile.member_code}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium ${
                profile.is_public
                  ? "bg-success/10 text-success"
                  : "bg-ink/5 text-ink/50"
              }`}
            >
              {profile.is_public ? "Visible dans l'annuaire" : "Masqué de l'annuaire"}
            </span>
          </div>

          <button
            onClick={toggleVisibility}
            disabled={saving}
            className="btn btn-secondary btn-sm mt-5"
          >
            {saving
              ? "Enregistrement…"
              : profile.is_public
                ? "Me masquer de l'annuaire"
                : "Apparaître dans l'annuaire"}
          </button>
        </div>

        {/* ---------- Ma photo ---------- */}
        <div className="mt-4 card shadow-card p-6 md:p-8">
          <p className="eyebrow">Ma photo</p>
          <p className="mt-3 text-sm text-ink/60 leading-relaxed">
            Cette photo sera utilisée sur votre affiche et pré-remplie sur
            votre badge.
          </p>
          <div className="mt-5">
            <PhotoUpload onFile={handlePhoto} error={uploadError} />
          </div>
          {uploading && (
            <p className="mt-3 text-sm text-blue-dark">Envoi en cours…</p>
          )}
          {profile.photo_url && !uploading && (
            <p className="mt-3 text-sm text-success">
              Photo enregistrée ✓
            </p>
          )}
        </div>

        {/* ---------- Mes créations ---------- */}
        <div className="mt-4 card shadow-card overflow-hidden">
          <div className="h-1.5 w-full bg-blue" />
          <div className="p-6 md:p-8">
            <p className="eyebrow">Mes créations</p>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <Link href="/visuel" className="btn btn-primary">
                Générer mon affiche
              </Link>
              <Link href="/badge" className="btn btn-secondary">
                Photo de mon badge
              </Link>
            </div>
            {badge && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line/10 bg-canvas px-4 py-3">
                <div>
                  <p className="font-mono text-xs font-medium tracking-wide2">
                    {badge.unique_code}
                  </p>
                  <p
                    className={`mt-1 text-xs font-medium ${
                      badge.status === "active"
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {badge.status === "active"
                      ? "Badge actif"
                      : "Badge révoqué"}
                  </p>
                </div>
                <Link
                  href={`/badge/verify/${badge.unique_code}`}
                  className="text-sm font-medium text-blue-dark hover:underline underline-offset-4"
                >
                  Vérifier →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Raccourcis ---------- */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/programme"
            className="card card-hover p-5 text-center transition-all"
          >
            <p className="font-serif text-lg">Programme</p>
            <p className="mt-1 text-xs text-ink/50">9 — 10 octobre</p>
          </Link>
          <Link
            href="/infos"
            className="card card-hover p-5 text-center transition-all"
          >
            <p className="font-serif text-lg">Infos pratiques</p>
            <p className="mt-1 text-xs text-ink/50">Lieu & transport</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}
