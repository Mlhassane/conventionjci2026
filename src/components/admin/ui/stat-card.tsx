import Link from "next/link";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
}: {
  label: string;
  value: number | null;
  icon?: LucideIcon;
  hint?: string;
  href?: string;
}) {
  return (
    <Card className="gap-2 border-line/10 bg-gradient-to-t from-primary/5 to-card py-5 shadow-card transition-shadow hover:shadow-lift">
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] uppercase tracking-wide2 text-ink/50">{label}</p>
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="mt-3 text-3xl font-semibold tabular-nums text-ink">
          {value === null ? <Skeleton className="h-8 w-14" /> : value.toLocaleString("fr-FR")}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
      {href && (
        <CardFooter className="px-5 pt-0">
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-dark hover:underline"
          >
            Ouvrir
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton key={columnIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
