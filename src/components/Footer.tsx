import Link from "next/link";

const NAV_LINKS = [
  { href: "/programme", label: "Programme" },
  { href: "/intervenants", label: "Intervenants" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/infos", label: "Infos pratiques" },
  { href: "/badge", label: "Mon badge" },
  { href: "/visuel", label: "Mon visuel" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-paper mt-24 pb-24 lg:pb-0">
      {/* JCI brand stripe */}
      <div aria-hidden className="flex">
        <div className="h-1 w-1/2 bg-blue" />
        <div className="h-1 w-1/6 bg-yellow" />
        <div className="h-1 w-1/3 bg-teal" />
      </div>

      <div className="container-edge py-14 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue text-ink font-serif text-sm font-semibold">
              JCI
            </span>
            <div>
              <p className="font-serif text-lg leading-tight">
                JCI Experience 2026
              </p>
              <p className="text-[10px] tracking-wide2 uppercase text-blue">
                Convention JCI Niger
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-paper/60 max-w-xs leading-relaxed">
            La plateforme digitale officielle de la Convention JCI Niger 2026 —
            Maradi.
          </p>
          <p className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs text-blue">
            #MaConventionJCI2026
          </p>
        </div>

        <div>
          <p className="text-[10px] tracking-wide2 uppercase text-paper/40 mb-4">
            Navigation
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-paper/70 hover:text-blue transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] tracking-wide2 uppercase text-paper/40 mb-4">
            L&apos;événement
          </p>
          <p className="text-sm text-paper/70">9 — 10 octobre 2026</p>
          <p className="mt-1.5 text-sm text-paper/70">Maradi, Niger</p>
          <p className="mt-4 text-sm text-paper/50">
            contact@jci-niger.org
          </p>
        </div>
      </div>

      <div className="container-edge pt-6 border-t border-white/10 text-xs text-paper/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>© 2026 JCI Niger — Tous droits réservés.</span>
        <span className="text-paper/30">Junior Chamber International</span>
      </div>
    </footer>
  );
}
