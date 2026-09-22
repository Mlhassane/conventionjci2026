import Link from "next/link";
import Footer from "@/components/Footer";
import StatCounter from "@/components/StatCounter";
import {
  getEventSettings,
  getPartners,
  getProgram,
  getSpeakers,
  getStats,
} from "@/lib/data";
import { formatDateRange, formatDayLabel } from "@/lib/date";
import { SessionCategory } from "@/lib/types";

const CATEGORY_STYLE: Record<SessionCategory, string> = {
  "Cérémonie": "bg-blue/15 text-blue-dark",
  "Formation": "bg-teal/20 text-teal-dark",
  "Panel": "bg-ink/8 text-ink",
  "Networking": "bg-navy/10 text-navy",
  "Pause": "bg-ink/5 text-ink/50",
  "Soirée": "bg-yellow/35 text-ink",
  "Statutaire": "bg-ink/8 text-ink",
};

export default async function HomePage() {
  const [settings, stats, partners, program, speakers] = await Promise.all([
    getEventSettings(),
    getStats(),
    getPartners(),
    getProgram(),
    getSpeakers(),
  ]);

  const dateLabel = formatDateRange(settings.start_date, settings.end_date);
  const taglineParts = settings.tagline.replace(/\.\s*$/, "").split(/\.\s+/);
  const sessions = program.slice(0, 4);
  const featuredSpeakers = speakers.slice(0, 3);

  return (
    <main>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        {/* JCI Blue glow accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-24 h-[480px] w-[480px] rounded-full bg-blue/20 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-64 -left-40 h-[360px] w-[360px] rounded-full bg-navy/10 blur-[100px]"
        />

        <div className="container-edge pt-12 md:pt-20 pb-14 md:pb-20 grid gap-12 md:grid-cols-2 md:items-center">
          {/* Left — copy */}
          <div>
            <p className="animate-fade-up anim-delay-1 flex items-center gap-3 font-sans text-xs tracking-wide2 uppercase text-blue-dark">
              <span aria-hidden className="h-px w-8 bg-blue" />
              {settings.event_name}
            </p>

            <h1 className="animate-fade-up anim-delay-2 mt-6 font-serif text-[2.7rem] leading-[1.04] sm:text-6xl md:text-[4.5rem] text-balance">
              {taglineParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && <br />}
                  {i === taglineParts.length - 1 ? (
                    <span className="italic text-blue-dark">{part}.</span>
                  ) : (
                    <>{part}.</>
                  )}
                </span>
              ))}
            </h1>

            <div className="animate-fade-up anim-delay-3">
              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-line/15 bg-white px-4 py-2 text-xs font-medium">
                  <CalendarIcon />
                  {dateLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-line/15 bg-white px-4 py-2 text-xs font-medium">
                  <PinIcon />
                  {settings.location}
                </span>
              </div>

              <p className="mt-6 max-w-md font-sans text-base text-ink/65 leading-relaxed">
                {settings.hero_text}
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/badge"
                  className="inline-flex justify-center items-center rounded-full bg-blue text-ink px-7 py-3.5 font-sans text-sm font-semibold hover:bg-navy hover:text-paper transition-colors"
                >
                  Créer mon badge
                </Link>
                <Link
                  href="/visuel"
                  className="inline-flex justify-center items-center rounded-full border border-ink/25 px-7 py-3.5 font-sans text-sm font-medium hover:border-ink hover:bg-ink hover:text-paper transition-colors"
                >
                  Créer mon visuel
                </Link>
                <Link
                  href="/programme"
                  className="inline-flex justify-center items-center px-2 py-3.5 font-sans text-sm font-medium text-blue-dark hover:underline underline-offset-4"
                >
                  Voir le programme →
                </Link>
              </div>
            </div>
          </div>

          {/* Right — badge mock visual */}
          <div className="animate-fade-up anim-delay-4 relative mx-auto w-full max-w-[340px]">
            <div
              aria-hidden
              className="absolute inset-0 translate-x-4 translate-y-4 rounded-xl2 bg-blue/15"
            />
            <div className="relative overflow-hidden rounded-xl2 bg-ink text-paper shadow-soft">
              <div className="h-1.5 w-full bg-blue" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] tracking-wide2 uppercase text-blue">
                    JCI Niger
                  </p>
                  <p className="text-[10px] tracking-wide2 uppercase text-paper/40">
                    Badge digital
                  </p>
                </div>

                <p className="mt-3 font-serif text-2xl">Convention 2026</p>
                <p className="mt-1 text-xs text-paper/60">
                  {dateLabel} · {settings.location.split(",")[0].trim()}
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blue bg-white/5 font-serif text-lg text-blue">
                    MS
                  </span>
                  <div>
                    <p className="font-serif text-lg leading-tight">
                      Mariama Souley
                    </p>
                    <p className="text-xs text-paper/55">
                      Déléguée · JCI Niamey
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                  <QrMock />
                  <div className="text-right">
                    <p className="text-sm font-medium tracking-wide2">
                      JCI-2026-A7X2Q1
                    </p>
                    <p className="mt-1 text-[11px] text-blue">
                      {settings.hashtag}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-2 md:-left-6 bottom-5 rounded-full border border-line/10 bg-white px-4 py-2 text-xs font-medium shadow-soft">
              Badge prêt en 30&nbsp;s ✓
            </div>
          </div>
        </div>
      </section>

      {/* ======================= INFO STRIP ======================= */}
      <div className="bg-blue text-ink">
        <div className="container-edge flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-3 text-center text-[11px] font-semibold tracking-wide2 uppercase">
          <span>{dateLabel}</span>
          <span aria-hidden className="text-ink/40">
            ●
          </span>
          <span>{settings.location}</span>
          <span aria-hidden className="text-ink/40">
            ●
          </span>
          <span>
            {program.length} sessions
          </span>
          <span aria-hidden className="text-ink/40">
            ●
          </span>
          <span>{settings.hashtag}</span>
        </div>
      </div>

      {/* ========================= CHIFFRES ========================= */}
      <section className="relative overflow-hidden bg-ink py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-blue/15 blur-[80px]"
        />
        <div className="container-edge relative">
          <p className="flex items-center gap-3 font-sans text-xs tracking-wide2 uppercase text-blue">
            <span aria-hidden className="h-px w-8 bg-blue" />
            En chiffres
          </p>
          <p className="mt-4 font-serif text-2xl md:text-3xl text-paper mb-10 md:mb-14">
            La Convention en chiffres
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-0">
            {[
              { value: stats.participants, label: "Participants" },
              { value: stats.posters, label: "Visuels générés" },
              { value: stats.badges, label: "Badges générés" },
              { value: stats.partners, label: "Partenaires" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="md:px-7 md:first:pl-0 md:border-l md:border-white/10 md:first:border-l-0"
              >
                <StatCounter value={stat.value} label={stat.label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= EXPÉRIENCE ======================= */}
      <section className="py-16 md:py-24">
        <div className="container-edge">
          <div className="flex items-end justify-between gap-4 mb-9">
            <div>
              <p className="flex items-center gap-3 font-sans text-xs tracking-wide2 uppercase text-blue-dark">
                <span aria-hidden className="h-px w-8 bg-blue" />
                Expérience digitale
              </p>
              <h2 className="mt-4 font-serif text-2xl md:text-3xl">
                Tout pour vivre la Convention
              </h2>
            </div>
            <Link
              href="/badge"
              className="hidden sm:inline-flex shrink-0 pb-1 text-sm font-medium text-blue-dark hover:underline underline-offset-4"
            >
              Commencer →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-3 md:gap-4">
            <PreviewCard
              href="/badge"
              large
              className="col-span-2 row-span-2 min-h-[240px] md:min-h-0"
              title="Badge digital"
              subtitle="Ton identité officielle pour la Convention"
              tone="ink"
            />
            <PreviewCard
              href="/visuel"
              className="col-span-2 min-h-[150px] md:min-h-0"
              title="Visuel officiel"
              subtitle="Affiche ta participation en un clic"
              tone="blue"
            />
            <PreviewCard
              href="/programme"
              className="min-h-[150px] md:min-h-0"
              title="Programme"
              subtitle={`${formatDayLabel(settings.start_date)} — ${formatDayLabel(settings.end_date)}`}
              tone="paper"
            />
            <PreviewCard
              href="/partenaires"
              className="min-h-[150px] md:min-h-0"
              title="Partenaires"
              subtitle={`${partners.length} partenaires officiels`}
              tone="navy"
            />
            <PreviewCard
              href="/intervenants"
              className="col-span-2 min-h-[150px] md:min-h-0"
              title="Intervenants"
              subtitle={`${speakers.length} voix de l'édition 2026`}
              tone="teal"
            />
            <PreviewCard
              href="/infos"
              className="min-h-[150px] md:min-h-0"
              title="Infos pratiques"
              subtitle="Lieu, transport & hébergement"
              tone="paper"
            />
            <PreviewCard
              href="/participants"
              className="min-h-[150px] md:min-h-0"
              title="Participants"
              subtitle="Annuaire & networking"
              tone="yellow"
            />
          </div>
        </div>
      </section>

      {/* ======================= PROGRAMME ======================= */}
      <section className="bg-blue/5 py-16 md:py-24">
        <div className="container-edge">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="flex items-center gap-3 font-sans text-xs tracking-wide2 uppercase text-blue-dark">
                <span aria-hidden className="h-px w-8 bg-blue" />
                Au programme
              </p>
              <h2 className="mt-4 font-serif text-2xl md:text-3xl text-balance">
                Deux jours pour apprendre, connecter et célébrer.
              </h2>
              <p className="mt-4 text-sm text-ink/60 leading-relaxed max-w-sm">
                Cérémonies, panels, formations et networking — découvrez les
                premières sessions de l&apos;édition 2026.
              </p>
              <Link
                href="/programme"
                className="mt-7 inline-flex items-center rounded-full bg-ink text-paper px-6 py-3 text-sm font-medium hover:bg-blue hover:text-ink transition-colors"
              >
                Voir tout le programme
              </Link>
            </div>

            <ul className="rounded-xl2 border border-line/10 bg-white divide-y divide-line/10 overflow-hidden">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-start gap-4 md:gap-5 p-5 md:p-6 transition-colors hover:bg-blue/5"
                >
                  <div className="w-16 md:w-20 shrink-0">
                    <p className="font-sans text-sm font-bold text-blue-dark">
                      {session.start_time}
                    </p>
                    <p className="text-[11px] text-ink/45">
                      {session.date === settings.start_date ? "Jour 1" : "Jour 2"}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base md:text-lg leading-snug">
                      {session.title}
                    </p>
                    {session.location && (
                      <p className="mt-1 text-xs text-ink/50">
                        📍 {session.location}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 self-start text-[11px] rounded-full px-2.5 py-1 font-medium ${CATEGORY_STYLE[session.category]}`}
                  >
                    {session.category}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ======================= INTERVENANTS ======================= */}
      <section className="py-16 md:py-24">
        <div className="container-edge">
          <div className="flex items-end justify-between gap-4 mb-9">
            <div>
              <p className="flex items-center gap-3 font-sans text-xs tracking-wide2 uppercase text-blue-dark">
                <span aria-hidden className="h-px w-8 bg-blue" />
                Intervenants
              </p>
              <h2 className="mt-4 font-serif text-2xl md:text-3xl">
                Les voix de l&apos;édition 2026
              </h2>
            </div>
            <Link
              href="/intervenants"
              className="hidden sm:inline-flex shrink-0 pb-1 text-sm font-medium text-blue-dark hover:underline underline-offset-4"
            >
              Tous les intervenants →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredSpeakers.map((speaker) => (
              <Link
                key={speaker.id}
                href={`/intervenants/${speaker.id}`}
                className="group rounded-xl2 border border-line/10 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-blue/40 hover:shadow-soft"
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue/30 bg-blue/10 font-serif text-xl text-blue-dark">
                  {getInitials(speaker.name)}
                </span>
                <p className="mt-4 font-serif text-lg leading-tight">
                  {speaker.name}
                </p>
                {speaker.position && (
                  <p className="mt-1 text-sm text-blue-dark">
                    {speaker.position}
                  </p>
                )}
                {speaker.organization && (
                  <p className="mt-1 text-xs text-ink/50">
                    {speaker.organization}
                  </p>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/intervenants"
              className="text-sm font-medium text-blue-dark hover:underline underline-offset-4"
            >
              Tous les intervenants →
            </Link>
          </div>
        </div>
      </section>

      {/* ======================= PARTENAIRES ======================= */}
      <section className="pb-16 md:pb-24">
        <div className="container-edge">
          <div className="rounded-xl2 border border-line/10 bg-white px-6 py-10 md:px-10 md:py-12">
            <div className="text-center">
              <p className="flex items-center justify-center gap-3 font-sans text-xs tracking-wide2 uppercase text-blue-dark">
                <span aria-hidden className="h-px w-8 bg-blue" />
                Partenaires
                <span aria-hidden className="h-px w-8 bg-blue" />
              </p>
              <h2 className="mt-4 font-serif text-2xl md:text-3xl">
                Ils rendent la Convention possible
              </h2>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:gap-4">
              {partners.map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partenaires/${partner.id}`}
                  className="group rounded-xl2 border border-line/12 px-5 py-4 md:px-7 md:py-5 text-center transition-all hover:-translate-y-0.5 hover:border-blue/50 hover:shadow-soft"
                >
                  <p className="font-serif text-base md:text-lg leading-tight">
                    {partner.name}
                  </p>
                  <p className="mt-1 text-[11px] text-ink/45 group-hover:text-blue-dark transition-colors">
                    {partner.category}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/partenaires"
                className="text-sm font-medium text-blue-dark hover:underline underline-offset-4"
              >
                Découvrir tous les partenaires →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== CTA FINAL ======================== */}
      <section className="container-edge">
        <div className="relative overflow-hidden rounded-xl2 bg-navy text-paper px-6 py-12 md:px-14 md:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-blue/30 blur-[90px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal/20 blur-[80px]"
          />

          <div className="relative max-w-2xl">
            <p className="flex items-center gap-3 font-sans text-xs tracking-wide2 uppercase text-blue">
              <span aria-hidden className="h-px w-8 bg-blue" />
              Rejoignez-nous
            </p>
            <h2 className="mt-5 font-serif text-3xl md:text-4xl leading-tight text-balance">
              Prêt pour la Convention&nbsp;?
            </h2>
            <p className="mt-4 text-sm md:text-base text-paper/70 leading-relaxed max-w-lg">
              Générez votre badge digital et votre visuel officiel en quelques
              secondes, puis partagez-les avec votre réseau.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/badge"
                className="inline-flex justify-center items-center rounded-full bg-blue text-ink px-7 py-3.5 text-sm font-semibold hover:bg-paper hover:text-ink transition-colors"
              >
                Créer mon badge
              </Link>
              <Link
                href="/visuel"
                className="inline-flex justify-center items-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-medium hover:border-white hover:bg-white/10 transition-colors"
              >
                Créer mon visuel
              </Link>
            </div>
            <p className="mt-7 text-xs tracking-wide2 uppercase text-blue">
              {settings.hashtag}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ------------------------------ pieces ------------------------------ */

function PreviewCard({
  href,
  title,
  subtitle,
  tone,
  className = "",
  large,
}: {
  href: string;
  title: string;
  subtitle: string;
  tone: "ink" | "blue" | "paper" | "navy" | "teal" | "yellow";
  className?: string;
  large?: boolean;
}) {
  const tones: Record<string, string> = {
    ink: "bg-ink text-paper",
    blue: "bg-blue text-ink",
    paper: "bg-white text-ink border border-line/10",
    navy: "bg-navy text-paper",
    teal: "bg-teal text-ink",
    yellow: "bg-yellow text-ink",
  };
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl2 p-5 flex h-full flex-col justify-end shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift ${className} ${tones[tone]}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125"
      />
      <span
        aria-hidden
        className="absolute top-4 right-4 text-lg opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
      >
        ↗
      </span>
      <p
        className={`relative font-serif leading-tight ${
          large ? "text-2xl md:text-3xl" : "text-lg"
        }`}
      >
        {title}
      </p>
      <p
        className={`relative mt-1 font-sans opacity-70 ${
          large ? "text-sm" : "text-xs"
        }`}
      >
        {subtitle}
      </p>
    </Link>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 text-blue-dark"
      aria-hidden
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 9.5h16M8 3.5v3M16 3.5v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 text-blue-dark"
      aria-hidden
    >
      <path
        d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function QrMock() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-14 w-14 text-paper"
      aria-hidden
      fill="currentColor"
    >
      {/* finder patterns */}
      <path
        d="M4 12a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V12Zm8 4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <path
        d="M64 12a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H72a8 8 0 0 1-8-8V12Zm8 4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <path
        d="M4 64a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V64Zm8 4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      {/* data dots */}
      <rect x="44" y="4" width="8" height="8" />
      <rect x="52" y="20" width="8" height="8" />
      <rect x="44" y="36" width="8" height="8" />
      <rect x="60" y="44" width="8" height="8" />
      <rect x="76" y="44" width="8" height="8" />
      <rect x="44" y="60" width="8" height="8" />
      <rect x="60" y="68" width="8" height="8" />
      <rect x="76" y="76" width="8" height="8" />
      <rect x="44" y="84" width="8" height="8" />
      <rect x="20" y="44" width="8" height="8" />
      <rect x="4" y="48" width="8" height="8" />
      <rect x="28" y="56" width="8" height="8" />
      <rect x="92" y="60" width="8" height="8" />
      <rect x="60" y="92" width="8" height="8" />
    </svg>
  );
}
