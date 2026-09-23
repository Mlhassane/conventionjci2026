"use client";

import { useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import ImageUpload from "@/components/form/ImageUpload";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import { Speaker } from "@/lib/types";

const EMPTY: Partial<Speaker> = {
  name: "",
  position: "",
  organization: "",
  bio: "",
  photo_url: "",
  display_order: 0,
  is_visible: true,
};

export default function AdminSpeakersPage() {
  const { rows, loading, error, create, update, remove } = useTable<Speaker>(
    "speakers",
    "display_order"
  );
  const [form, setForm] = useState<Partial<Speaker> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function openCreate() {
    setFormError(null);
    setForm(EMPTY);
  }

  function openEdit(s: Speaker) {
    setFormError(null);
    setForm(s);
  }

  async function handlePhotoFile(file: File) {
    setFormError(null);
    setUploading(true);
    const name = (form?.name ?? "speaker").trim().toLowerCase().replace(/\s+/g, "-");
    const url = await uploadAdminImage("speakers", name || "speaker", file);
    setUploading(false);
    if (!url) {
      setFormError("Échec de l’envoi de la photo. Réessayez.");
      return;
    }
    setForm((f) => (f ? { ...f, photo_url: url } : f));
  }

  async function handleSave() {
    if (!form || saving) return;
    const name = (form.name ?? "").trim();
    if (!name) {
      setFormError("Le nom est obligatoire.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload = { ...form, name };

    let ok: boolean;
    if (form.id) {
      ok = await update(form.id, payload);
    } else {
      ok = await create({ ...payload, display_order: rows.length });
    }
    setSaving(false);

    if (!ok) {
      setFormError("Une erreur est survenue. Réessayez.");
      return;
    }
    setForm(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-4 font-serif text-3xl">Intervenants</h1>
        </div>
        <button onClick={openCreate} className="btn btn-dark btn-sm">
          Ajouter un intervenant
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {form && (
        <div className="mt-6 rounded-xl2 border border-blue/40 bg-blue/5 p-6 space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput
              label="Nom complet *"
              value={form.name ?? ""}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <TextInput
              label="Poste / fonction"
              value={form.position ?? ""}
              onChange={(v) => setForm({ ...form, position: v })}
            />
            <TextInput
              label="Organisation"
              value={form.organization ?? ""}
              onChange={(v) => setForm({ ...form, organization: v })}
            />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1.5">Photo</label>
            <ImageUpload
              onFile={handlePhotoFile}
              currentUrl={form.photo_url}
              error={uploading ? "Envoi en cours…" : null}
              shape="circle"
              label="Téléverser la photo"
              hint="JPG ou PNG carré recommandé, 8 Mo max"
            />
          </div>
          <TextInput
            label="Biographie"
            value={form.bio ?? ""}
            onChange={(v) => setForm({ ...form, bio: v })}
            textarea
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="btn btn-primary btn-sm disabled:opacity-60"
            >
              {saving || uploading ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={() => setForm(null)}
              disabled={saving}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-sm text-ink/50">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">Aucun intervenant pour le moment.</p>
        ) : (
          rows.map((s) => (
            <div
              key={s.id}
              className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3 min-w-0">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photo_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover border border-line/10 shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue/10 border border-blue/20 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-xs text-ink/45">
                    {s.position}
                    {s.organization ? ` · ${s.organization}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update(s.id, { is_visible: !s.is_visible })}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    s.is_visible
                      ? "border-success text-success"
                      : "border-ink/20 text-ink/40"
                  }`}
                >
                  {s.is_visible ? "Publié" : "Masqué"}
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink"
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer « ${s.name} » ?`)) remove(s.id);
                  }}
                  className="text-xs rounded-full border border-danger/30 text-danger px-3 py-1.5 hover:bg-danger/5"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="input"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
        />
      )}
    </div>
  );
}
