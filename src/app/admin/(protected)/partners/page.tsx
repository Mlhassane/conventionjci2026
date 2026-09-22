"use client";

import { useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import { Partner, PartnerCategory } from "@/lib/types";

const CATEGORIES: PartnerCategory[] = [
  "Partenaire officiel",
  "Partenaire principal",
  "Sponsor",
  "Partenaire média",
  "Partenaire institutionnel",
  "Partenaire technique",
];

const EMPTY: Partial<Partner> = {
  name: "",
  category: "Sponsor",
  description: "",
  website: "",
  whatsapp: "",
  offer: "",
  logo_url: "",
  display_order: 0,
  is_visible: true,
};

export default function AdminPartnersPage() {
  const { rows, loading, error, create, update, remove } = useTable<Partner>(
    "partners",
    "display_order"
  );
  const [form, setForm] = useState<Partial<Partner> | null>(null);

  async function handleSave() {
    if (!form) return;
    if (form.id) {
      await update(form.id, form);
    } else {
      await create({ ...form, display_order: rows.length });
    }
    setForm(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-4 font-serif text-3xl">Partenaires</h1>
        </div>
        <button
          onClick={() => setForm(EMPTY)}
          className="btn btn-dark btn-sm"
        >
          Ajouter un partenaire
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {form && (
        <div className="mt-6 rounded-xl2 border border-blue/40 bg-blue/5 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput label="Nom" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} />
            <SelectInput
              label="Catégorie"
              value={form.category as string}
              options={CATEGORIES}
              onChange={(v) => setForm({ ...form, category: v as PartnerCategory })}
            />
          </div>
          <TextInput
            label="Description"
            value={form.description ?? ""}
            onChange={(v) => setForm({ ...form, description: v })}
            textarea
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput label="Logo (URL)" value={form.logo_url ?? ""} onChange={(v) => setForm({ ...form, logo_url: v })} />
            <TextInput label="Site web" value={form.website ?? ""} onChange={(v) => setForm({ ...form, website: v })} />
            <TextInput label="WhatsApp" value={form.whatsapp ?? ""} onChange={(v) => setForm({ ...form, whatsapp: v })} />
            <TextInput label="Offre Convention" value={form.offer ?? ""} onChange={(v) => setForm({ ...form, offer: v })} />
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
          <p className="text-sm text-ink/50">Aucun partenaire pour le moment.</p>
        ) : (
          rows.map((p) => (
            <div key={p.id} className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-ink/45">{p.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update(p.id, { is_visible: !p.is_visible })}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    p.is_visible ? "border-success text-success" : "border-ink/20 text-ink/40"
                  }`}
                >
                  {p.is_visible ? "Publié" : "Masqué"}
                </button>
                <button
                  onClick={() => setForm(p)}
                  className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink"
                >
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
          rows={3}
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

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
