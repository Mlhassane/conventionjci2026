"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheckIcon,
  DownloadIcon,
  EyeIcon,
  ImageIcon,
  Share2Icon,
  SparklesIcon,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/ui/page-header";
import { StatCard } from "@/components/admin/ui/stat-card";

const EVENT_LABELS: Record<string, string> = {
  poster_generated: "Visuels générés",
  poster_downloaded: "Visuels téléchargés",
  poster_shared: "Visuels partagés",
  whatsapp_share_clicked: "Partages WhatsApp",
  badge_generated: "Badges générés",
  badge_downloaded: "Badges téléchargés",
  partner_viewed: "Partenaires consultés",
  speaker_viewed: "Intervenants consultés",
  program_viewed: "Programme consulté",
};

const EVENTS = Object.keys(EVENT_LABELS);

const EVENT_ICONS: Record<string, typeof ImageIcon> = {
  poster_generated: ImageIcon,
  poster_downloaded: DownloadIcon,
  poster_shared: Share2Icon,
  whatsapp_share_clicked: Share2Icon,
  badge_generated: BadgeCheckIcon,
  badge_downloaded: DownloadIcon,
  partner_viewed: EyeIcon,
  speaker_viewed: EyeIcon,
  program_viewed: SparklesIcon,
};

const trendConfig = {
  total: { label: "Actions", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export default function AdminAnalyticsPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [trend, setTrend] = useState<{ date: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const results: Record<string, number> = {};
      for (const event of EVENTS) {
        const { count } = await supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", event);
        results[event] = count ?? 0;
      }
      setCounts(results);

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_name, created_at")
        .gte("created_at", since.toISOString())
        .limit(2000);

      const buckets = new Map<string, number>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let offset = 29; offset >= 0; offset -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - offset);
        buckets.set(day.toISOString().slice(0, 10), 0);
      }
      for (const event of events ?? []) {
        const key = new Date(event.created_at).toISOString().slice(0, 10);
        if (buckets.has(key)) {
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
      }
      setTrend(
        [...buckets.entries()].map(([date, total]) => ({
          date,
          total,
        }))
      );
      setLoading(false);
    })();
  }, []);

  const totalActions = useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + value, 0),
    [counts]
  );
  const max = Math.max(1, ...Object.values(counts));
  const barData = EVENTS.map((event) => ({
    event,
    label: EVENT_LABELS[event],
    value: counts[event] ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Statistiques"
        description="Suivi des actions clés déclenchées sur la plateforme publique."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Actions totales"
          value={loading ? null : totalActions}
          icon={SparklesIcon}
        />
        <StatCard
          label="Visuels générés"
          value={loading ? null : (counts.poster_generated ?? 0)}
          icon={ImageIcon}
        />
        <StatCard
          label="Badges générés"
          value={loading ? null : (counts.badge_generated ?? 0)}
          icon={BadgeCheckIcon}
        />
        <StatCard
          label="Partages WhatsApp"
          value={loading ? null : (counts.whatsapp_share_clicked ?? 0)}
          icon={Share2Icon}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-line/10 shadow-card xl:col-span-3">
          <CardHeader>
            <CardTitle>Activité des 30 derniers jours</CardTitle>
            <CardDescription>Nombre d&apos;actions enregistrées chaque jour.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ChartContainer config={trendConfig} className="aspect-auto h-[240px] w-full">
                <AreaChart data={trend} margin={{ left: 4, right: 8 }}>
                  <defs>
                    <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })
                    }
                  />
                  <YAxis width={28} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })
                        }
                      />
                    }
                  />
                  <Area
                    dataKey="total"
                    type="natural"
                    fill="url(#fillTotal)"
                    stroke="var(--color-total)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-line/10 shadow-card xl:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par action</CardTitle>
            <CardDescription>Volumes cumulés depuis le lancement.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ChartContainer
                config={{ value: { label: "Actions", color: "hsl(var(--chart-2))" } }}
                className="aspect-auto h-[240px] w-full"
              >
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ left: 8, right: 8 }}
                  barSize={12}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel indicator="dot" />}
                  />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-line/10 shadow-card">
        <CardHeader>
          <CardTitle>Détail par événement</CardTitle>
          <CardDescription>Chaque action suivie sur le site public.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))
          ) : (
            EVENTS.map((event) => {
              const value = counts[event] ?? 0;
              const Icon = EVENT_ICONS[event];
              return (
                <div key={event}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {EVENT_LABELS[event]}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
