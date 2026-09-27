"use client";

import { useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import { ProgramSession, SessionCategory, Speaker } from "@/lib/types";

const CATEGORIES: SessionCategory[] = [
  "Cérémonie",
  "Formation",
  "Panel",
  "Networking",
  "Pause",
  "Soirée",
  "Statutaire",
];

const EMPTY: Partial<ProgramSession> = {
  date: "2026-10-09",
  start_time: "09:00",
  end_time: "",
  title: "",
  description: "",
  location: "",
  category: "Formation",
  speaker_id: null,
  display_order: 0,
  is_visible: true,
};

export default function AdminProgrammePage() {
  const { rows, loading, error, create, update, remove } = useTable<ProgramSession>(
    "program_sessions",
    "date"
  );
  const { rows: speakers } = useTable<Speaker>("speakers", "display_order");
  const [form, setForm] = useState<Partial<ProgramSession> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    if (!form || saving) return;
    if (!form.date || !form.start_time || !form.title?.trim()) {
      setFormError("La date, l'heure de début et le titre sont obligatoires.");
      return;
    }
    if (form.end_time && form.end_time <= form.start_time) {
      setFormError("L'heure de fin doit être après l'heure de début.");
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
          <h1 className="mt-4 font-serif text-3xl">Programme</h1>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setForm(EMPTY);
          }}
          className="btn btn-dark btn-sm"
        >
          Ajouter une session
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {form && (
        <div className="mt-6 rounded-xl2 border border-blue/40 bg-blue/5 p-6 space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="grid sm:grid-cols-3 gap-4">
            <TextInput type="date" label="Date" value={form.date ?? ""} onChange={(v) => setForm({ ...form, date: v })} />
            <TextInput type="time" label="Heure de début" value={form.start_time ?? ""} onChange={(v) => setForm({ ...form, start_time: v })} />
            <TextInput type="time" label="Heure de fin" value={form.end_time ?? ""} onChange={(v) => setForm({ ...form, end_time: v })} />
          </div>
          <TextInput label="Titre" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} />
          <TextInput label="Description" value={form.description ?? ""} onChange={(v) => setForm({ ...form, description: v })} textarea />
          <div className="grid sm:grid-cols-3 gap-4">
            <TextInput label="Lieu" value={form.location ?? ""} onChange={(v) => setForm({ ...form, location: v })} />
            <SelectInput
              label="Catégorie"
              value={form.category as string}
              options={CATEGORIES}
              onChange={(v) => setForm({ ...form, category: v as SessionCategory })}
            />
            <div>
              <label className="block text-xs text-ink/50 mb-1.5">Intervenant</label>
              <select
                value={form.speaker_id ?? ""}
                onChange={(e) => setForm({ ...form, speaker_id: e.target.value || null })}
                className="input"
              >
                <option value="">Aucun</option>
                {speakers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
          <p className="text-sm text-ink/50">Aucune session pour le moment.</p>
        ) : (
          rows
            .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
            .map((s) => (
              <div key={s.id} className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-ink/45">
                    {s.date} · {s.start_time}
                    {s.end_time ? ` – ${s.end_time}` : ""} · {s.category}
                  </p>
                  <p className="font-medium mt-0.5">{s.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update(s.id, { is_visible: !s.is_visible })}
                    className={`text-xs rounded-full px-3 py-1.5 border ${
                      s.is_visible ? "border-success text-success" : "border-ink/20 text-ink/40"
                    }`}
                  >
                    {s.is_visible ? "Publié" : "Masqué"}
                  </button>
                  <button onClick={() => setForm(s)} className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink">
                    Modifier
                  </button>
                  <button
                    onClick={() => remove(s.id)}
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
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
          type={type}
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
