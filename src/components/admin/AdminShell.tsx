"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin/dashboard", label: "Vue d'ensemble", icon: GridIcon },
  { href: "/admin/participants", label: "Participants", icon: UsersIcon },
  { href: "/admin/participations", label: "J’y serai", icon: SparkIcon },
  { href: "/admin/badges", label: "Badges", icon: BadgeIcon },
  { href: "/admin/partners", label: "Partenaires", icon: BriefcaseIcon },
  { href: "/admin/speakers", label: "Intervenants", icon: MicIcon },
  { href: "/admin/officials", label: "Officiels", icon: ShieldIcon },
  { href: "/admin/programme", label: "Programme", icon: CalendarIcon },
  { href: "/admin/infos", label: "Infos pratiques", icon: InfoIcon },
  { href: "/admin/analytics", label: "Statistiques", icon: ChartIcon },
  { href: "/admin/settings", label: "Paramètres", icon: GearIcon },
];

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

  const initial = (adminEmail?.charAt(0) ?? "A").toUpperCase();

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[264px_1fr]">
      {/* ------------------------- Sidebar desktop ------------------------- */}
      <aside className="hidden lg:flex flex-col bg-ink text-paper px-5 py-6 sticky top-0 h-screen">
        <Link href="/" className="group px-1">
          <span className="block rounded-2xl bg-white px-4 py-3 shadow-soft transition-shadow group-hover:shadow-lift">
            <Image
              src="/logo.png"
              alt="Convention Nationale JCI Niger 2026"
              width={320}
              height={112}
              priority
              className="h-11 w-auto object-contain"
            />
          </span>
          <span className="mt-3 flex items-center gap-2 px-1 font-sans text-[10px] tracking-wide2 uppercase text-blue">
            <span aria-hidden className="h-px w-6 bg-blue" />
            Administration
          </span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1 flex-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-blue text-ink font-semibold shadow-cta"
                    : "text-paper/60 hover:text-paper hover:bg-white/5"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue font-serif text-sm font-semibold text-ink">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">
                {adminEmail ?? "Administrateur"}
              </p>
              <p className="text-[11px] text-paper/50">Administrateur</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-paper/70 transition-colors hover:border-white/40 hover:text-paper"
            >
              Voir le site
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-paper/70 transition-colors hover:border-danger hover:text-red-400"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------- Barre mobile ------------------------- */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 bg-ink text-paper px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="rounded-lg bg-white px-2 py-1 shrink-0">
              <Image
                src="/logo.png"
                alt="Convention Nationale JCI Niger 2026"
                width={160}
                height={56}
                className="h-7 w-auto object-contain"
              />
            </span>
            <p className="font-sans text-[10px] tracking-wide2 uppercase text-blue truncate">
              Administration
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-paper/60 shrink-0"
          >
            Déconnexion
          </button>
        </div>
        <div className="bg-ink text-paper px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
                pathname === link.href
                  ? "bg-blue text-ink font-semibold"
                  : "bg-white/10 text-paper/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="min-h-screen">
        <main className="p-5 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

/* ------------------------------ Icônes ------------------------------ */

function SparkIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.7L12 18l-1.6-5.7L5 10.6 10.4 9 12 3.5Z" />
      <path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
    </Base>
  );
}

function Base({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Base>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M4 19c.8-3 2.7-4.5 5-4.5s4.2 1.5 5 4.5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16.5 14.6c2 .3 3.3 1.6 3.9 3.9" />
    </Base>
  );
}

function BadgeIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <circle cx="12" cy="10" r="2.4" />
      <path d="M8.5 17c.7-1.6 2-2.4 3.5-2.4s2.8.8 3.5 2.4" />
    </Base>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M4 13h16" />
    </Base>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="9" y="3.5" width="6" height="10" rx="3" />
      <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5V20M9 20h6" />
    </Base>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 9.5h16M8 3.5v3M16 3.5v3" />
    </Base>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" />
    </Base>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="M8.5 15.5v-4M12.5 15.5v-7M16.5 15.5v-2.5" />
    </Base>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M12 3.5 5.5 6v6c0 4 2.8 6.8 6.5 8.5 3.7-1.7 6.5-4.5 6.5-8.5V6L12 3.5Z" />
      <path d="M9 11.5l2.2 2.2L15.5 9.5" />
    </Base>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.6M12 18.6v2.6M4.2 7l2.2 1.3M17.6 15.7l2.2 1.3M2.8 12h2.6M18.6 12h2.6M4.2 17l2.2-1.3M17.6 8.3l2.2-1.3" />
    </Base>
  );
}
