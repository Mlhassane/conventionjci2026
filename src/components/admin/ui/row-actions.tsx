"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontalIcon, type LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  href?: string;
  external?: boolean;
  tone?: "default" | "destructive";
  /** When set, a confirmation dialog is shown before running `onSelect`. */
  confirm?: { title: string; description?: string; label?: string };
};

export function RowActions({
  items,
  label = "Actions",
}: {
  items: RowAction[];
  label?: string;
}) {
  const [pending, setPending] = useState<RowAction | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={label}>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {items.map((item, index) => {
            const destructive = item.tone === "destructive";
            const className = destructive
              ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
              : undefined;

            const content = (
              <>
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </>
            );

            return (
              <div key={item.label}>
                {index > 0 && item.tone === "destructive" && <DropdownMenuSeparator />}
                {item.href ? (
                  <DropdownMenuItem asChild className={className}>
                    {item.external ? (
                      <a href={item.href} target="_blank" rel="noreferrer">
                        {content}
                      </a>
                    ) : (
                      <Link href={item.href}>{content}</Link>
                    )}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className={className}
                    onSelect={(event) => {
                      if (item.confirm) {
                        event.preventDefault();
                        setPending(item);
                        return;
                      }
                      item.onSelect?.();
                    }}
                  >
                    {content}
                  </DropdownMenuItem>
                )}
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.confirm?.title ?? "Confirmer"}</AlertDialogTitle>
            {pending?.confirm?.description && (
              <AlertDialogDescription>
                {pending.confirm.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                pending?.onSelect?.();
                setPending(null);
              }}
            >
              {pending?.confirm?.label ?? "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
