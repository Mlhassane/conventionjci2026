"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

const EVENTS = [
  "poster_generated",
  "poster_downloaded",
  "poster_shared",
  "whatsapp_share_clicked",
  "badge_generated",
  "badge_downloaded",
  "partner_viewed",
  "speaker_viewed",
  "program_viewed",
] as const;

export default function AdminAnalyticsPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const results: Record<string, number> = {};
      for (const evt of EVENTS) {
        const { count } = await supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", evt);
        results[evt] = count ?? 0;
      }
      setCounts(results);
      setLoading(false);
    })();
  }, []);

  const max = Math.max(1, ...Object.values(counts));

  return (
    <div>
      <p className="eyebrow">Administration</p>
      <h1 className="mt-4 font-serif text-3xl">Statistiques</h1>
      <p className="mt-2 text-sm text-ink/55">
        Suivi des actions clés déclenchées sur la plateforme publique.
      </p>

      <div className="mt-8 card shadow-card p-6">
        {loading ? (
          <p className="text-sm text-ink/50">Chargement…</p>
        ) : (
          <div className="space-y-5">
            {EVENTS.map((evt) => {
              const value = counts[evt] ?? 0;
              return (
                <div key={evt}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{evt}</span>
                    <span className="text-ink/50">{value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-ink/5 overflow-hidden">
                    <div
                      className="h-full bg-blue transition-all"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
