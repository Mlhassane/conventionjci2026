import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow = "Administration",
  actions,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide2 text-blue-dark">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
