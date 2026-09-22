"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type Counts = {
  participants: number;
  badges: number;
  posters: number;
  partners: number;
  speakers: number;
};

const ANALYTICS_EVENTS = [
  "poster_generated",
  "poster_downloaded",
  "whatsapp_share_clicked",
  "badge_generated",
  "badge_downloaded",
] as const;

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, number>>({});

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    (async () => {
      const [participants, badges, posters, partners, speakers] = await Promise.all([
        supabase.from("participants").select("id", { count: "exact", head: true }),
        supabase.from("badges").select("id", { count: "exact", head: true }),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", "poster_generated"),
        supabase.from("partners").select("id", { count: "exact", head: true }),
        supabase.from("speakers").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        participants: participants.count ?? 0,
        badges: badges.count ?? 0,
        posters: posters.count ?? 0,
        partners: partners.count ?? 0,
        speakers: speakers.count ?? 0,
      });

      const results: Record<string, number> = {};
      for (const evt of ANALYTICS_EVENTS) {
        const { count } = await supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", evt);
        results[evt] = count ?? 0;
      }
      setAnalytics(results);
    })();
  }, []);

  const maxAnalytics = Math.max(1, ...Object.values(analytics));

  return (
    <div>
      <p className="eyebrow">Administration</p>
      <h1 className="mt-4 font-serif text-3xl">Vue d&apos;ensemble</h1>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Participants" value={counts?.participants} />
        <StatCard label="Badges" value={counts?.badges} />
        <StatCard label="Visuels" value={counts?.posters} />
        <StatCard label="Partenaires" value={counts?.partners} />
        <StatCard label="Intervenants" value={counts?.speakers} />
      </div>

      <div className="mt-10 card shadow-card p-6">
        <p className="font-serif text-xl mb-6">Actions suivies</p>
        <div className="space-y-4">
          {ANALYTICS_EVENTS.map((evt) => {
            const value = analytics[evt] ?? 0;
            return (
              <div key={evt}>
                <div className="flex justify-between text-xs text-ink/50 mb-1">
                  <span>{evt}</span>
                  <span className="font-medium text-ink/70">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
                  <div
                    className="h-full bg-blue rounded-full transition-all duration-700"
                    style={{ width: `${(value / maxAnalytics) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="card shadow-card p-5 transition-shadow hover:shadow-lift">
      <span aria-hidden className="mb-4 block h-1 w-8 rounded-full bg-blue" />
      <p className="font-serif text-3xl">{value ?? "—"}</p>
      <p className="mt-1 text-xs text-ink/50">{label}</p>
    </div>
  );
}
