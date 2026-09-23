"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Badge, Participant } from "@/lib/types";
import { generateBadgeCode } from "@/lib/badgeCode";

export default function AdminBadgesPage() {
  const badgesTable = useTable<Badge>("badges", "created_at");
  const participantsTable = useTable<Participant>("participants", "created_at");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badgeByParticipant = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const b of badgesTable.rows) {
      if (b.participant_id && !map.has(b.participant_id)) map.set(b.participant_id, b);
    }
    return map;
  }, [badgesTable.rows]);

  const pending = useMemo(
    () => participantsTable.rows.filter((p) => !badgeByParticipant.has(p.id)),
    [participantsTable.rows, badgeByParticipant]
  );

  async function insertBadge(p: Participant): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    for (let attempt = 0; attempt < 4; attempt++) {
      const { error: insertError } = await supabase.from("badges").insert({
        participant_id: p.id,
        full_name: p.name,
        role: p.role ?? "Participant",
        organization: p.organization,
        city: p.city,
        photo_url: p.photo_url,
        unique_code: generateBadgeCode(),
        status: "active",
      });
      if (!insertError) return true;
      if (!String(insertError.message).toLowerCase().includes("duplicate")) break;
    }
    return false;
  }

  async function handleGenerateOne(p: Participant) {
    setGenerating(true);
    setError(null);
    const ok = await insertBadge(p);
    if (!ok) setError(`Échec de génération pour ${p.name}. Réessayez.`);
    await badgesTable.refresh();
    setGenerating(false);
  }

  async function handleGenerateAll() {
    setGenerating(true);
    setError(null);
    let failed = 0;
    for (const p of pending) {
      const ok = await insertBadge(p);
      if (!ok) failed++;
    }
    if (failed > 0) setError(`${failed} badge(s) n'ont pas pu être générés. Réessayez.`);
    await badgesTable.refresh();
    setGenerating(false);
  }

  const loading = badgesTable.loading || participantsTable.loading;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-4 font-serif text-3xl">Badges</h1>
          <p className="mt-2 text-sm text-ink/55">
            L&apos;organisation génère les badges officiels, puis les remet aux
            participants. Ils les retrouvent dans leur espace.
          </p>
        </div>
        {pending.length > 0 && (
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="btn btn-primary btn-sm"
          >
            {generating ? "Génération…" : `Tout générer (${pending.length})`}
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <StatCard label="Badges générés" value={badgesTable.rows.length} />
        <StatCard label="En attente" value={pending.length} />
        <StatCard label="Participants" value={participantsTable.rows.length} />
      </div>

      {(error || badgesTable.error) && (
        <p className="mt-4 text-sm text-danger">{error ?? badgesTable.error}</p>
      )}

      {pending.length > 0 && (
        <div className="mt-8">
          <p className="font-serif text-xl mb-4">En attente de badge</p>
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ink/45 mt-0.5">
                    {p.phone ?? "—"} · {p.member_code ?? ""}
                  </p>
                </div>
                <button
                  onClick={() => handleGenerateOne(p)}
                  disabled={generating}
                  className="btn btn-dark btn-sm"
                >
                  Générer le badge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <p className="font-serif text-xl mb-4">Badges générés</p>
        {loading ? (
          <p className="text-sm text-ink/50">Chargement…</p>
        ) : badgesTable.rows.length === 0 ? (
          <p className="text-sm text-ink/50">Aucun badge généré pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {badgesTable.rows.map((b) => (
              <div key={b.id} className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{b.full_name}</p>
                    <span className="rounded-md bg-ink/5 px-2 py-0.5 font-mono text-[11px] text-ink/60">
                      {b.unique_code}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        b.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {b.status === "active" ? "Actif" : "Révoqué"}
                    </span>
                  </div>
                  <p className="text-xs text-ink/45 mt-1">
                    {[b.role, b.organization, b.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/badge/verify/${b.unique_code}`}
                    className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink"
                  >
                    Vérifier
                  </Link>
                  <button
                    onClick={() =>
                      badgesTable.update(b.id, {
                        status: b.status === "active" ? "revoked" : "active",
                      })
                    }
                    className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink"
                  >
                    {b.status === "active" ? "Révoquer" : "Réactiver"}
                  </button>
                  <button
                    onClick={() => badgesTable.remove(b.id)}
                    className="text-xs rounded-full border border-danger/30 text-danger px-3 py-1.5 hover:bg-danger/5"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card shadow-card p-5">
      <span aria-hidden className="mb-4 block h-1 w-8 rounded-full bg-blue" />
      <p className="font-serif text-3xl">{value}</p>
      <p className="mt-1 text-xs text-ink/50">{label}</p>
    </div>
  );
}
