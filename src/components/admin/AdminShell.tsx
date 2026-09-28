"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3Icon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  IdCardIcon,
  InfoIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MicIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const GROUPS: { label: string; links: NavLink[] }[] = [
  {
    label: "Pilotage",
    links: [
      { href: "/admin/dashboard", label: "Vue d'ensemble", icon: LayoutDashboardIcon },
      { href: "/admin/participants", label: "Participants", icon: UsersIcon },
      { href: "/admin/participations", label: "J’y serai", icon: SparklesIcon },
      { href: "/admin/badges", label: "Badges", icon: IdCardIcon },
    ],
  },
  {
    label: "Contenu",
    links: [
      { href: "/admin/partners", label: "Partenaires", icon: BriefcaseIcon },
      { href: "/admin/speakers", label: "Intervenants", icon: MicIcon },
      { href: "/admin/officials", label: "Officiels", icon: ShieldCheckIcon },
      { href: "/admin/programme", label: "Programme", icon: CalendarDaysIcon },
      { href: "/admin/infos", label: "Infos pratiques", icon: InfoIcon },
    ],
  },
  {
    label: "Suivi",
    links: [
      { href: "/admin/analytics", label: "Statistiques", icon: BarChart3Icon },
      { href: "/admin/settings", label: "Paramètres", icon: SettingsIcon },
    ],
  },
];

type NavLink = { href: string; label: string; icon: LucideIcon };

const ALL_LINKS: NavLink[] = GROUPS.flatMap((group) => group.links);

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    getSupabaseClient()
      ?.auth.getUser()
      .then(({ data }) => setAdminEmail(data.user?.email ?? null));
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
    router.push("/admin");
  }

  const current = ALL_LINKS.find((link) => link.href === pathname);

  return (
    <SidebarProvider>
      <AdminSidebar pathname={pathname} adminEmail={adminEmail} onLogout={handleLogout} />
      <SidebarInset className="min-w-0 bg-canvas">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-paper/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="truncate text-sm font-semibold text-ink">
            {current?.label ?? "Administration"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/">
                <ExternalLinkIcon className="h-4 w-4" />
                Voir le site
              </Link>
            </Button>
            <UserMenu adminEmail={adminEmail} onLogout={handleLogout} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminSidebar({
  pathname,
  adminEmail,
  onLogout,
}: {
  pathname: string;
  adminEmail: string | null;
  onLogout: () => void;
}) {
  const initial = (adminEmail?.charAt(0) ?? "A").toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="JCI Experience 2026">
              <Link href="/admin/dashboard">
                <span className="flex aspect-square w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper">
                  <Image
                    src="/logo.png"
                    alt="Convention Nationale JCI Niger 2026"
                    width={160}
                    height={56}
                    className="h-6 w-auto object-contain"
                  />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">JCI Experience</span>
                  <span className="truncate text-[11px] font-normal text-sidebar-foreground/60">
                    Administration
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={link.label}
                      className={
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                          : undefined
                      }
                    >
                      <Link href={link.href}>
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Voir le site public">
              <Link href="/">
                <ExternalLinkIcon className="h-4 w-4" />
                <span>Voir le site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/60 p-2">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-xs font-medium">
                  {adminEmail ?? "Administrateur"}
                </span>
                <span className="truncate text-[11px] text-sidebar-foreground/60">
                  Administrateur
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onLogout}
                aria-label="Déconnexion"
              >
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu({
  adminEmail,
  onLogout,
}: {
  adminEmail: string | null;
  onLogout: () => void;
}) {
  const initial = (adminEmail?.charAt(0) ?? "A").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu administrateur">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue font-semibold text-ink">{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">Administrateur</p>
          <p className="truncate text-xs text-muted-foreground">
            {adminEmail ?? "Non connecté"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <ExternalLinkIcon className="h-4 w-4" />
            Voir le site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOutIcon className="h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
