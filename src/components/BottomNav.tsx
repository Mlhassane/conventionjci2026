"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, HomeIcon, SparklesIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Dock, DockIcon } from "@/registry/magicui/dock";

const ITEMS = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/j-y-seri", label: "J’y serai", icon: SparklesIcon },
  { href: "/programme", label: "Programme", icon: CalendarDaysIcon },
];

/** Icônes supplementary pour /visuel (alias de /j-y-seri). */
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  if (href === "/j-y-seri") return pathname === "/j-y-seri" || pathname === "/visuel";
  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <Dock>
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <DockIcon key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full text-paper/70 transition-colors hover:bg-white/10 hover:text-paper",
                      active && "bg-blue text-ink hover:bg-blue hover:text-ink"
                    )}
                  >
                    <Icon className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          );
        })}
      </Dock>
    </TooltipProvider>
  );
}
