"use client";

import Link from "next/link";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type DashboardStat = {
  label: string;
  value: number | null;
  href: string;
  icon: LucideIcon;
};

export function DashboardStatsCards({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="gap-4 border-line/10 bg-gradient-to-t from-primary/5 to-card py-5 shadow-card transition-shadow hover:shadow-lift"
        >
          <CardHeader className="px-5">
            <CardDescription className="text-[11px] uppercase tracking-wide2 text-ink/50">
              {stat.label}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums text-ink">
              {stat.value === null ? (
                <Skeleton className="h-8 w-14" />
              ) : (
                stat.value.toLocaleString("fr-FR")
              )}
            </CardTitle>
          </CardHeader>
          <CardFooter className="px-5 pt-0">
            <Link
              href={stat.href}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-dark hover:underline"
            >
              Gérer
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
