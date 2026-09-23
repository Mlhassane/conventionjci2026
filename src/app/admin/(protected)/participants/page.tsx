"use client";

import { useMemo, useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import { getSupabaseClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/form/ImageUpload";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import { Badge, Participant } from "@/lib/types";
import { generateMemberCode, normalizePhone } from "@/lib/espace";

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

const EMPTY: Partial<Participant> = {
  name: "",
  phone: "",
  city: "",
  organization: "",
  role: "Participant",
  photo_url: "",
  is_public: true,
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export default function AdminParticipantsPage() {
  const { rows, loading, error, create, update, remove } =
    useTable<Participant>("participants", "created_at");
  const { rows: badges } = useTable<Badge>("badges", "created_at");
  const [form, setForm] = useState<Partial<Participant> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const badgeByParticipant = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const b of badges) {
      if (b.participant_id && !map.has(b.participant_id)) map.set(b.participant_id, b);
    }
    return map;
  }, [badges]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  async function handlePhotoFile(file: File) {
    setFormError(null);
    setUploading(true);
    const prefix =
      (form?.name ?? "").trim().toLowerCase().replace(/\s+/g, "-") ||
      form?.id ||
      "participant";
    const url = await uploadAdminImage("photos", `admin/${prefix}`, file);
    setUploading(false);
    if (!url) {
      setFormError("Échec de l’envoi de la photo. Réessayez.");
      return;
    }
    setForm((f) => (f ? { ...f, photo_url: url } : f));
  }

  async function handleSave() {
    if (!form) return;
    if (!form.name?.trim()) {
      setFormError("Le nom complet est requis.");
      return;
    }
    const phone = normalizePhone(form.phone ?? "");
    if (!phone || phone.replace(/\D/g, "").length < 8) {
      setFormError("Numéro de téléphone invalide (ex : 90 00 00 00).");
      return;
    }
    setSaving(true);
    setFormError(null);
    const supabase = getSupabaseClient();

    if (form.id) {
      // Update — check phone isn't taken by someone else
      const { data: clash } = await supabase
        ?.from("participants")
        .select("id")
        .eq("phone", phone)
        .neq("id", form.id)
        .limit(1);
      if (clash && clash.length > 0) {
        setFormError("Ce numéro est déjà utilisé par un autre participant.");
        setSaving(false);
        return;
      }
      const ok = await update(form.id, {
        name: form.name.trim(),
        phone,
        city: form.city?.trim() || null,
        organization: form.organization?.trim() || null,
        role: form.role || "Participant",
        photo_url: form.photo_url?.trim() || null,
        is_public: form.is_public ?? true,
      });
      setSaving(false);
      if (ok) setForm(null);
      else setFormError("Une erreur est survenue. Réessayez.");
      return;
    }

    // Create — unique phone + fresh member code (retry on collision)
    const { data: existing } = await supabase
      ?.from("participants")
      .select("id")
      .eq("phone", phone)
      .limit(1);
    if (existing && existing.length > 0) {
      setFormError("Ce numéro est déjà enregistré.");
      setSaving(false);
      return;
    }
    let created = false;
    for (let attempt = 0; attempt < 4 && !created; attempt++) {
      created = await create({
        name: form.name.trim(),
        phone,
        member_code: generateMemberCode(),
        city: form.city?.trim() || null,
        organization: form.organization?.trim() || null,
        role: form.role || "Participant",
        photo_url: form.photo_url?.trim() || null,
        is_public: form.is_public ?? true,
      });
    }
    setSaving(false);
    if (created) setForm(null);
    else setFormError("Une erreur est survenue. Réessayez.");
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-4 font-serif text-3xl">Participants</h1>
          <p className="mt-2 text-sm text-ink/55">
            Inscription après paiement : téléphone + photo, code unique généré
            automatiquement.
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY); setFormError(null); }} className="btn btn-dark btn-sm">
          Inscrire un participant
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {form && (
        <div className="mt-6 rounded-xl2 border border-blue/40 bg-blue/5 p-6 space-y-4 shadow-card">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput label="Nom complet *" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} />
            <TextInput label="Téléphone * (ex : 90 00 00 00)" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} inputMode="tel" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <TextInput label="Ville" value={form.city ?? ""} onChange={(v) => setForm({ ...form, city: v })} />
            <TextInput label="Organisation / Local JCI" value={form.organization ?? ""} onChange={(v) => setForm({ ...form, organization: v })} />
            <div>
              <label className="block text-xs text-ink/50 mb-1.5">Rôle</label>
              <select
                value={(form.role as string) ?? "Participant"}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-ink/50 mb-1.5">
                  Photo — badge & annuaire
                </label>
                <ImageUpload
                  onFile={handlePhotoFile}
                  currentUrl={form.photo_url}
                  error={uploading ? "Envoi en cours…" : null}
                  shape="circle"
                  label="Téléverser la photo"
                  hint="JPG ou PNG, 8 Mo max"
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_public ?? true}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                  className="h-4 w-4 accent-[#0097D7]"
                />
                Visible sur la page Participants publique
              </label>
            </div>

            <div className="rounded-xl2 border border-line/12 bg-white p-4 shadow-card">
              <p className="text-[10px] tracking-wide2 uppercase text-ink/40 mb-3">
                Aperçu participant
              </p>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-blue/40 bg-blue/10 flex items-center justify-center">
                  {form.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-lg text-blue-dark">
                      {(form.name ?? "?").trim()
                        ? getInitials(form.name!.trim())
                        : "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-lg leading-tight truncate">
                    {(form.name ?? "").trim() || "Nom du participant"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/50 truncate">
                    {[form.role, form.organization, form.city]
                      .filter(Boolean)
                      .join(" · ") || "Rôle · Organisation · Ville"}
                  </p>
                  {form.member_code && (
                    <p className="mt-2 inline-block rounded-md bg-ink px-2 py-0.5 font-mono text-[11px] text-blue">
                      {form.member_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || uploading} className="btn btn-primary btn-sm disabled:opacity-60">
              {saving || uploading ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={() => setForm(null)} className="btn btn-secondary btn-sm">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-sm text-ink/50">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">Aucun participant inscrit pour le moment.</p>
        ) : (
          rows.map((p) => {
            const badge = badgeByParticipant.get(p.id);
            return (
              <div key={p.id} className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-line/10 bg-blue/10 flex items-center justify-center">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-sm text-blue-dark">
                        {getInitials(p.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{p.name}</p>
                      {p.member_code && (
                        <button
                          onClick={() => copyCode(p.member_code as string)}
                          title="Copier le code"
                          className="rounded-md bg-ink px-2 py-0.5 font-mono text-[11px] text-blue hover:bg-navy transition-colors"
                        >
                          {copied === p.member_code ? "Copié ✓" : p.member_code}
                        </button>
                      )}
                      {badge ? (
                        <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                          Badge généré
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue/20 px-2.5 py-0.5 text-[11px] font-medium text-ink">
                          Badge en attente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/45 mt-1">
                      {p.phone ?? "—"} · {[p.role, p.organization, p.city].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update(p.id, { is_public: !p.is_public })}
                    className={`text-xs rounded-full px-3 py-1.5 border ${
                      p.is_public ? "border-success text-success" : "border-ink/20 text-ink/40"
                    }`}
                  >
                    {p.is_public ? "Public" : "Masqué"}
                  </button>
                  <button onClick={() => { setForm(p); setFormError(null); }} className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink">
                    Modifier
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-xs rounded-full border border-danger/30 text-danger px-3 py-1.5 hover:bg-danger/5"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "tel" | "text";
}) {
  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">{label}</label>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  );
}
