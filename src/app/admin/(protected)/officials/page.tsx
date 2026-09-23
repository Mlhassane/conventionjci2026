"use client";

import { useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import { Official } from "@/lib/types";

const EMPTY: Partial<Official> = {
  name: "",
  title: "",
  organization: "",
  photo_url: "",
  display_order: 0,
  is_visible: true,
};

export default function AdminOfficialsPage() {
  const { rows, loading, error, create, update, remove } = useTable<Official>(
    "officials",
    "display_order"
  );
  const [form, setForm] = useState<Partial<Official> | null>(null);

  async function handleSave() {
    if (!form) return;
    if (!form.name?.trim()) return;
    if (form.id) {
      await update(form.id, {
        ...form,
        display_order: form.display_order ?? rows.length,
      });
    } else {
      await create({ ...form, display_order: rows.length });
    }
    setForm(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-4 font-serif text-3xl">Officiels de l&apos;événement</h1>
          <p className="mt-2 text-sm text-ink/55">
            Comité d&apos;organisation, parrains et autorités — affichés sur la
            page Infos pratiques.
          </p>
        </div>
        <button
          onClick={() => setForm(EMPTY)}
          className="btn btn-dark btn-sm"
        >
          Ajouter un officiel
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {form && (
        <div className="mt-6 rounded-xl2 border border-blue/40 bg-blue/5 p-6 space-y-4 shadow-card">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput label="Nom complet *" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} />
            <TextInput label="Fonction / titre" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} />
            <TextInput label="Organisation" value={form.organization ?? ""} onChange={(v) => setForm({ ...form, organization: v })} />
            <TextInput label="Photo (URL)" value={form.photo_url ?? ""} onChange={(v) => setForm({ ...form, photo_url: v })} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn btn-primary btn-sm">
              Enregistrer
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
          <p className="text-sm text-ink/50">Aucun officiel pour le moment.</p>
        ) : (
          rows.map((o) => (
            <div key={o.id} className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">{o.name}</p>
                <p className="text-xs text-ink/45">
                  {[o.title, o.organization].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update(o.id, { is_visible: !o.is_visible })}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    o.is_visible ? "border-success text-success" : "border-ink/20 text-ink/40"
                  }`}
                >
                  {o.is_visible ? "Publié" : "Masqué"}
                </button>
                <button onClick={() => setForm(o)} className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink">
                  Modifier
                </button>
                <button
                  onClick={() => remove(o.id)}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  );
}
