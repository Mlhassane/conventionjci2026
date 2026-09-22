"use client";

import { useMemo, useState } from "react";
import { Participant } from "@/lib/types";
import EmptyState from "@/components/EmptyState";

export default function ParticipantsView({
  participants,
}: {
  participants: Participant[];
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");

  const cities = useMemo(
    () => uniqueSorted(participants.map((p) => p.city).filter(Boolean) as string[]),
    [participants]
  );
  const organizations = useMemo(
    () => uniqueSorted(participants.map((p) => p.organization).filter(Boolean) as string[]),
    [participants]
  );
  const roles = useMemo(
    () => uniqueSorted(participants.map((p) => p.role).filter(Boolean) as string[]),
    [participants]
  );

  const filtered = participants.filter((p) => {
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (city && p.city !== city) return false;
    if (organization && p.organization !== organization) return false;
    if (role && p.role !== role) return false;
    return true;
  });

  return (
    <div className="container-edge pb-24">
      <div className="card p-4 md:p-5 shadow-card space-y-3 mb-8">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un participant..."
            className="input pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Select label="Ville" value={city} onChange={setCity} options={cities} />
          <Select
            label="Organisation"
            value={organization}
            onChange={setOrganization}
            options={organizations}
          />
          <Select label="Rôle" value={role} onChange={setRole} options={roles} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun participant trouvé."
          description="Essayez une autre recherche ou modifiez vos filtres."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card card-hover p-4 text-center">
              <div className="h-14 w-14 mx-auto rounded-full bg-blue/10 border border-blue/20 flex items-center justify-center overflow-hidden">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-serif text-lg text-blue-dark">{p.name.charAt(0)}</span>
                )}
              </div>
              <p className="mt-3 text-sm font-medium">{p.name}</p>
              <p className="text-xs text-ink/45 mt-0.5">{p.city}</p>
              {p.role && (
                <span className="mt-2 inline-block rounded-full bg-blue/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-dark">
                  {p.role}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-full border px-4 py-2 text-sm bg-white outline-none transition-colors whitespace-nowrap ${
        value ? "border-blue/50 bg-blue/10 text-blue-dark font-medium" : "border-line/15 hover:border-ink/30 focus:border-blue"
      }`}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
