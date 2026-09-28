"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function ListToolbar({
  search,
  onSearchChange,
  placeholder = "Rechercher…",
  count,
  total,
  children,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  count?: number;
  total?: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      {onSearchChange && (
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-9 pl-8"
          />
        </div>
      )}
      {count !== undefined && (
        <Badge variant="secondary" className="h-7 font-medium">
          {total !== undefined ? `${count} / ${total}` : count}
        </Badge>
      )}
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
