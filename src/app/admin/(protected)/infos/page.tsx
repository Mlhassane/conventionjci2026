"use client";

import { useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import { PracticalInfo, PracticalInfoSection } from "@/lib/types";

const SECTIONS: PracticalInfoSection[] = [
  "Lieu",
  "Localisation",
  "Hébergement",
  "Transport",
  "Restauration",
  "Contacts utiles",
  "Informations importantes",
];

const EMPTY: Partial<PracticalInfo> = {
  section: "Lieu",
  title: "",
  content: "",
  map_url: "",
  display_order: 0,
  is_visible: true,
};

export default function AdminInfosPage() {
  const { rows, loading, error, create, update, remove } = useTable<PracticalInfo>(
    "practical_information",
    "display_order"
  );
  const [form, setForm] = useState<Partial<PracticalInfo> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    if (!form || saving) return;
    if (!form.title?.trim() || !form.content?.trim()) {
      setFormError("Le titre et le contenu sont obligatoires.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const ok = form.id
      ? await update(form.id, form)
      : await create({ ...form, display_order: rows.length });
    setSaving(false);
    if (ok) setForm(null);
    else setFormError("Une erreur est survenue. Réessayez.");
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-4 font-serif text-3xl">Infos pratiques</h1>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setForm(EMPTY);
          }}
          className="btn btn-dark btn-sm"
        >
          Ajouter une information
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {form && (
        <div className="mt-6 rounded-xl2 border border-blue/40 bg-blue/5 p-6 space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ink/50 mb-1.5">Section</label>
              <select
                value={form.section as string}
                onChange={(e) => setForm({ ...form, section: e.target.value as PracticalInfoSection })}
                className="input"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <TextInput label="Titre" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} />
          </div>
          <TextInput label="Contenu" value={form.content ?? ""} onChange={(v) => setForm({ ...form, content: v })} textarea />
          <TextInput label="Lien carte (optionnel)" value={form.map_url ?? ""} onChange={(v) => setForm({ ...form, map_url: v })} />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
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
          <p className="text-sm text-ink/50">Aucune information pour le moment.</p>
        ) : (
          rows.map((info) => (
            <div key={info.id} className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-ink/45">{info.section}</p>
                <p className="font-medium mt-0.5">{info.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update(info.id, { is_visible: !info.is_visible })}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    info.is_visible ? "border-success text-success" : "border-ink/20 text-ink/40"
                  }`}
                >
                  {info.is_visible ? "Publié" : "Masqué"}
                </button>
                <button onClick={() => setForm(info)} className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink">
                  Modifier
                </button>
                <button
                  onClick={() => remove(info.id)}
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
