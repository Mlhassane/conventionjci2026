import Link from "next/link";
import { getEventSettings } from "@/lib/data";
import { formatDateRange } from "@/lib/date";

const NAV_LINKS = [
  { href: "/programme", label: "Programme" },
  { href: "/intervenants", label: "Intervenants" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/infos", label: "Infos pratiques" },
  { href: "/j-y-seri", label: "Mon visuel" },
];

const SOCIAL_KEYS = [
  ["social_facebook", "Facebook"],
  ["social_instagram", "Instagram"],
  ["social_linkedin", "LinkedIn"],
  ["social_whatsapp", "WhatsApp"],
] as const;

export default async function Footer() {
  const settings = await getEventSettings();
  const dateLabel = settings.start_date
    ? formatDateRange(settings.start_date, settings.end_date)
    : null;
  const socials = SOCIAL_KEYS.filter(([key]) => Boolean(settings[key]));
  const year = settings.start_date
    ? settings.start_date.slice(0, 4)
    : String(new Date().getFullYear());

  return (
    <footer className="bg-ink text-paper mt-24 pb-24 lg:pb-0">
      {/* JCI brand stripe */}
      <div aria-hidden className="flex">
        <div className="h-1 w-1/2 bg-blue" />
        <div className="h-1 w-1/4 bg-paper" />
        <div className="h-1 w-1/4 bg-blue/50" />
      </div>

      <div className="container-edge py-14 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue text-ink font-serif text-sm font-semibold">
              JCI
            </span>
            <div>
              <p className="font-serif text-lg leading-tight">{settings.event_name}</p>
              <p className="text-[10px] tracking-wide2 uppercase text-blue">
                {settings.location || "JCI Experience"}
              </p>
            </div>
          </div>
          {settings.hero_text && (
            <p className="mt-4 text-sm text-paper/60 max-w-xs leading-relaxed">
              {settings.hero_text}
            </p>
          )}
          {settings.hashtag && (
            <p className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs text-blue">
              {settings.hashtag}
            </p>
          )}
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
          {dateLabel && <p className="text-sm text-paper/70">{dateLabel}</p>}
          {settings.location && (
            <p className="mt-1.5 text-sm text-paper/70">{settings.location}</p>
          )}
          {settings.contact_email && (
            <a
              href={`mailto:${settings.contact_email}`}
              className="mt-4 block text-sm text-paper/50 hover:text-blue transition-colors"
            >
              {settings.contact_email}
            </a>
          )}
          {settings.contact_phone && (
            <p className="mt-1.5 text-sm text-paper/50">{settings.contact_phone}</p>
          )}
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map(([key, label]) => (
                <a
                  key={key}
                  href={settings[key] as string}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-paper/50 hover:text-blue transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container-edge pt-6 border-t border-white/10 text-xs text-paper/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>© {year} {settings.event_name} — Tous droits réservés.</span>
        <span className="text-paper/30">Junior Chamber International</span>
      </div>
    </footer>
  );
}
