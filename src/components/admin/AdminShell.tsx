"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin/dashboard", label: "Vue d'ensemble" },
  { href: "/admin/partners", label: "Partenaires" },
  { href: "/admin/speakers", label: "Intervenants" },
  { href: "/admin/programme", label: "Programme" },
  { href: "/admin/infos", label: "Infos pratiques" },
  { href: "/admin/analytics", label: "Statistiques" },
  { href: "/admin/settings", label: "Paramètres" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
    router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden lg:flex flex-col bg-ink text-paper p-6 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue text-ink font-serif text-[11px] font-semibold">
            JCI
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-base">JCI Experience</span>
            <span className="text-[9px] tracking-wide2 uppercase text-blue mt-1">
              Administration
            </span>
          </span>
        </Link>

        <nav className="mt-10 flex flex-col gap-1 flex-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-blue font-medium"
                    : "text-paper/60 hover:text-paper hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <button
            onClick={handleLogout}
            className="text-sm text-paper/50 hover:text-paper text-left transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="min-h-screen">
        <div className="lg:hidden sticky top-0 z-40 bg-ink text-paper px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue text-ink font-serif text-[10px] font-semibold">
              JCI
            </span>
            <p className="font-serif text-sm">Admin</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-paper/60">
            Déconnexion
          </button>
        </div>
        <div className="lg:hidden bg-ink text-paper px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
                pathname === link.href
                  ? "bg-blue text-ink font-medium"
                  : "bg-white/10 text-paper/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <main className="p-5 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
