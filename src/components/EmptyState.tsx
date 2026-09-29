import type { LucideIcon } from "lucide-react";
import { InboxIcon } from "lucide-react";

export default function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-serif text-xl text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
