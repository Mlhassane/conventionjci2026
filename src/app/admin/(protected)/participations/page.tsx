"use client";

import { useState } from "react";
import { useTable } from "@/lib/admin/useTable";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Participation } from "@/lib/types";

export default function AdminParticipationsPage() {
  const { rows, loading, error, remove } = useTable<Participation>(
    "participations",
    "created_at"
  );
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(participation: Participation) {
    if (!confirm("Supprimer cette participation et son image ?")) return;
    setDeleting(participation.id);

    const supabase = getSupabaseClient();
    if (supabase && participation.image_url) {
      const marker = "/storage/v1/object/public/posters/";
      const path = participation.image_url.includes(marker)
        ? decodeURIComponent(participation.image_url.split(marker)[1])
        : null;
      if (path) await supabase.storage.from("posters").remove([path]);
    }

    await remove(participation.id);
    setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-4 font-serif text-3xl">Participations J’y serai</h1>
          <p className="mt-2 text-sm text-ink/55">
            Les visuels générés publiquement sont enregistrés ici avec leurs
            informations et leur image.
          </p>
        </div>
        <div className="rounded-2xl bg-blue/10 px-4 py-3 text-sm font-medium text-blue-dark">
          {rows.length} participation{rows.length > 1 ? "s" : ""}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-sm text-ink/50">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">
            Aucune participation J’y serai enregistrée pour le moment.
          </p>
        ) : (
          rows.map((participation) => (
            <div
              key={participation.id}
              className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-4 min-w-0">
                {participation.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={participation.image_url}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover border border-line/10"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-blue/10 border border-line/10" />
                )}
                <div className="min-w-0">
                  <p className="font-medium">{participation.name}</p>
                  <p className="text-xs text-ink/45 mt-1">
                    {[participation.organization, participation.city]
                      .filter(Boolean)
                      .join(" · ") || "Informations non renseignées"}
                  </p>
                  {participation.message && (
                    <p className="text-xs text-ink/50 mt-1 line-clamp-2">
                      {participation.message}
                    </p>
                  )}
                  <p className="text-[11px] text-ink/35 mt-1">
                    {new Date(participation.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {participation.image_url && (
                  <a
                    href={participation.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs rounded-full border border-ink/20 px-3 py-1.5 hover:border-ink"
                  >
                    Voir l’image
                  </a>
                )}
                <button
                  onClick={() => handleDelete(participation)}
                  disabled={deleting === participation.id}
                  className="text-xs rounded-full border border-danger/30 text-danger px-3 py-1.5 hover:bg-danger/5 disabled:opacity-60"
                >
                  {deleting === participation.id ? "Suppression…" : "Supprimer"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
