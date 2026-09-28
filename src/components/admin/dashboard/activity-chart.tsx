"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ActivityPoint = {
  date: string;
  visuels: number;
  badges: number;
};

const RANGES = { "7j": 7, "30j": 30, "90j": 90 } as const;
type Range = keyof typeof RANGES;

const chartConfig = {
  visuels: { label: "Visuels générés", color: "hsl(var(--chart-1))" },
  badges: { label: "Badges générés", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const isMobile = useIsMobile();
  const [range, setRange] = React.useState<Range>(isMobile ? "7j" : "30j");

  const days = RANGES[range];
  const filtered = data.slice(-days);
  const total = filtered.reduce((sum, point) => sum + point.visuels + point.badges, 0);

  return (
    <Card className="border-line/10 shadow-card">
      <CardHeader className="relative">
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Générations sur les {days} derniers jours · {total} action{total > 1 ? "s" : ""}
          </span>
          <span className="@[540px]/card:hidden">{total} action{total > 1 ? "s" : ""}</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => value && setRange(value as Range)}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            {Object.keys(RANGES).map((value) => (
              <ToggleGroupItem key={value} value={value} className="h-8 px-2.5">
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={range} onValueChange={(value) => setRange(value as Range)}>
            <SelectTrigger className="@[767px]/card:hidden flex w-28" aria-label="Période">
              <SelectValue placeholder="30j" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(RANGES).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={filtered} margin={{ left: 4, right: 8 }}>
            <defs>
              <linearGradient id="fillVisuels" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visuels)" stopOpacity={0.9} />
                <stop offset="95%" stopColor="var(--color-visuels)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillBadges" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-badges)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-badges)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="visuels"
              type="natural"
              fill="url(#fillVisuels)"
              stroke="var(--color-visuels)"
              stackId="a"
            />
            <Area
              dataKey="badges"
              type="natural"
              fill="url(#fillBadges)"
              stroke="var(--color-badges)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
