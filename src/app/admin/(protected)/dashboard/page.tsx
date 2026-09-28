"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  IdCardIcon,
  MicIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Participation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ActivityChart,
  type ActivityPoint,
} from "@/components/admin/dashboard/activity-chart";
import { RecentParticipations } from "@/components/admin/dashboard/recent-participations";
import {
  DashboardStatsCards,
  type DashboardStat,
} from "@/components/admin/dashboard/stats-cards";

const ACTIVITY_DAYS = 90;

type Counts = {
  participants: number | null;
  badges: number | null;
  participations: number | null;
  partners: number | null;
  speakers: number | null;
};

const SHORTCUTS: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  {
    href: "/admin/participants",
    label: "Inscrire un participant",
    description: "Ajouter un membre, son OLM et son code convention",
    icon: UserPlusIcon,
  },
  {
    href: "/admin/badges",
    label: "Générer un badge",
    description: "Créer et télécharger les badges de l’équipe",
    icon: IdCardIcon,
  },
  {
    href: "/admin/participations",
    label: "Consulter les J’y serai",
    description: "Nom, ville, OLM, message et image générée",
    icon: SparklesIcon,
  },
  {
    href: "/admin/programme",
    label: "Mettre à jour le programme",
    description: "Sessions, horaires et lieux des deux jours",
    icon: CalendarDaysIcon,
  },
];

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Counts>({
    participants: null,
    badges: null,
    participations: null,
    partners: null,
    speakers: null,
  });
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loadingParticipations, setLoadingParticipations] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    (async () => {
      const [participants, badges, jySerai, partners, speakers] = await Promise.all([
        supabase.from("participants").select("id", { count: "exact", head: true }),
        supabase.from("badges").select("id", { count: "exact", head: true }),
        supabase.from("participations").select("id", { count: "exact", head: true }),
        supabase.from("partners").select("id", { count: "exact", head: true }),
        supabase.from("speakers").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        participants: participants.count ?? 0,
        badges: badges.count ?? 0,
        participations: jySerai.count ?? 0,
        partners: partners.count ?? 0,
        speakers: speakers.count ?? 0,
      });

      const since = new Date();
      since.setDate(since.getDate() - ACTIVITY_DAYS);
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_name, created_at")
        .gte("created_at", since.toISOString())
        .limit(2000);
      setActivity(buildActivity(events ?? []));

      const { data: recent } = await supabase
        .from("participations")
        .select("id, name, city, organization, message, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      setParticipations((recent ?? []) as Participation[]);
      setLoadingParticipations(false);
    })();
  }, []);

  const stats: DashboardStat[] = [
    {
      label: "Participants",
      value: counts.participants,
      href: "/admin/participants",
      icon: UsersIcon,
    },
    {
      label: "J’y serai",
      value: counts.participations,
      href: "/admin/participations",
      icon: SparklesIcon,
    },
    {
      label: "Badges",
      value: counts.badges,
      href: "/admin/badges",
      icon: IdCardIcon,
    },
    {
      label: "Partenaires",
      value: counts.partners,
      href: "/admin/partners",
      icon: BriefcaseIcon,
    },
    {
      label: "Intervenants",
      value: counts.speakers,
      href: "/admin/speakers",
      icon: MicIcon,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide2 text-blue-dark">
            Convention Nationale · Maradi
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink md:text-3xl">
            Vue d&apos;ensemble
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            9 — 10 octobre 2026 · Pilotez la Convention depuis cette console.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/admin/participants">
              <UserPlusIcon className="h-4 w-4" />
              Inscrire un participant
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ExternalLinkIcon className="h-4 w-4" />
              Voir le site
            </Link>
          </Button>
        </div>
      </div>

      <DashboardStatsCards stats={stats} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart data={activity} />
        </div>
        <Card className="border-line/10 shadow-card">
          <CardHeader>
            <CardTitle>Raccourcis</CardTitle>
            <CardDescription>Les actions les plus utilisées de la console.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SHORTCUTS.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-line/10 hover:bg-muted"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <shortcut.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{shortcut.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {shortcut.description}
                  </span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <RecentParticipations rows={participations} loading={loadingParticipations} />
    </div>
  );
}

function buildActivity(
  events: { event_name: string; created_at: string }[],
): ActivityPoint[] {
  const buckets = new Map<string, ActivityPoint>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = ACTIVITY_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, { date: key, visuels: 0, badges: 0 });
  }

  for (const event of events) {
    const bucket = buckets.get(new Date(event.created_at).toISOString().slice(0, 10));
    if (!bucket) continue;
    if (event.event_name === "poster_generated") bucket.visuels += 1;
    if (event.event_name === "badge_generated") bucket.badges += 1;
  }

  return [...buckets.values()];
}
