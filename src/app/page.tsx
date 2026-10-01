import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  getEventSettings,
  getPartners,
  getProgram,
  getSpeakers,
  getStats,
} from "@/lib/data";
import { formatDateRange, formatDayLabel } from "@/lib/date";
import { SessionCategory } from "@/lib/types";
import Reveal from "@/components/Reveal";
import { PartnerLogoSlider } from "@/components/public/partner-logo-slider";

export const dynamic = "force-dynamic";

const CATEGORY_STYLE: Record<SessionCategory, string> = {
  "Cérémonie": "bg-blue/15 text-blue-dark",
  "Formation": "bg-teal/20 text-teal-dark",
  "Panel": "bg-ink/8 text-ink",
  "Networking": "bg-navy/10 text-navy",
  "Pause": "bg-ink/5 text-ink/50",
  "Soirée": "bg-blue/20 text-blue-dark",
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
      <section className="w-full">
        <div className="relative isolate overflow-hidden flex flex-col min-h-screen min-h-[100dvh] bg-ink">
          <Image
            src="/hero_image.png"
            alt="Maradi, cœur du Niger"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(165deg, rgba(31,71,137,0.88) 0%, rgba(0,151,215,0.55) 45%, rgba(19,15,45,0.82) 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background:
                "linear-gradient(to top, rgba(19,15,45,0.75), transparent)",
            }}
          />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-28 md:pt-32 pb-16 md:pb-20 text-center text-paper">
            <div className="animate-fade-up anim-delay-1 mb-6 rounded-3xl bg-white/95 px-6 py-4 shadow-[0_0_60px_rgba(0,151,215,0.45)] ring-2 ring-blue/50">
              <Image
                src="/logo.png"
                alt="JCI Experience"
                width={280}
                height={96}
                priority
                className="h-14 md:h-16 w-auto object-contain"
              />
            </div>

            <p className="animate-fade-up anim-delay-1 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-[11px] tracking-wide2 uppercase text-paper">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-paper" />
              {settings.event_name}
            </p>

            <h1 className="animate-fade-up anim-delay-2 mt-7 max-w-3xl font-serif text-[2.6rem] leading-[1.05] sm:text-6xl md:text-[4.25rem] text-balance text-paper">
              {taglineParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && <br />}
                  {i === taglineParts.length - 1 ? (
                    <span className="italic underline decoration-white/40 underline-offset-8">
                      {part}.
                    </span>
                  ) : (
                    <>{part}.</>
                  )}
                </span>
              ))}
            </h1>

            <p className="animate-fade-up anim-delay-3 mt-6 max-w-lg font-sans text-base md:text-lg leading-relaxed text-paper/90">
              {settings.hero_text}
            </p>

            <div className="animate-fade-up anim-delay-4 mt-9 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/j-y-seri"
                className="group inline-flex items-center gap-2 rounded-full bg-paper text-ink px-7 py-3.5 text-sm font-semibold shadow-cta hover:bg-blue transition-colors"
              >
                J’y serai
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper text-xs transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <Link
                href="/programme"
                className="inline-flex items-center rounded-full border border-white/50 bg-white/15 backdrop-blur-sm px-7 py-3.5 text-sm font-medium text-paper hover:bg-paper hover:text-ink transition-colors"
              >
                Voir le programme
              </Link>
            </div>
          </div>

          <div className="relative z-10 animate-fade-up anim-delay-4 px-6 pb-8 md:pb-10 flex flex-col items-center gap-3 text-center text-xs md:text-sm">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-paper/90">
              <span>{dateLabel}</span>
              <span aria-hidden className="text-paper/50">
                ·
              </span>
              <span>{settings.location}</span>
              <span aria-hidden className="text-paper/50">
                ·
              </span>
              <span className="text-paper font-semibold">
                {settings.hashtag}
              </span>
            </div>
            <div aria-hidden className="flex items-center gap-1 text-paper">
              ★★★★★
              <span className="ml-2 text-paper/80 font-medium text-[11px]">
                L&apos;expérience digitale officielle JCI
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= BANDEAU LOGOS ======================= */}
      <section className="border-b border-line/8 bg-paper">
        <div className="container-edge py-7 md:py-9">
          {partners.length === 0 ? (
            <p className="text-center font-sans text-[11px] tracking-wide2 uppercase text-ink/40">
              {`Partenaires officiels · ${settings.event_name}`}
            </p>
          ) : (
            <PartnerLogoSlider partners={partners} />
          )}
        </div>
      </section>

      {/* ======================= À PROPOS / BENTO ======================= */}
      <section className="py-16 md:py-24">
        <div className="px-5 lg:px-[20%]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-center">À propos</p>
            <h2 className="mt-5 font-serif text-3xl md:text-[2.75rem] leading-[1.12] text-balance">
              La Convention qui connecte{" "}
              <span className="text-blue-dark">leadership</span>, culture et{" "}
              <span className="italic text-blue-dark">opportunités</span>
              {settings.location ? ` à ${settings.location.split(",")[0]}.` : "."}
            </h2>
            <p className="mt-5 text-sm md:text-base text-ink/60 leading-relaxed">
              {settings.hero_text ||
                "Une expérience digitale pensée pour apprendre, célébrer et faire grandir votre réseau JCI."}
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2 md:auto-rows-fr">
            {/* Feature card — participants */}
            <div className="relative overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 bg-gradient-to-br from-navy via-ink to-[#0A3A6B] text-paper p-7 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[380px] shadow-lift">
              <div
                aria-hidden
                className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-blue/40 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-blue/30 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-blue via-paper to-transparent"
              />

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue/40 bg-blue/15 px-3.5 py-1.5 text-[11px] tracking-wide2 uppercase text-blue">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blue" />
                  Participants
                </span>
              </div>

              <div className="relative mt-8">
                <p className="font-serif text-6xl md:text-[5.5rem] leading-none tracking-tight">
                  {stats.participants}
                  <span className="text-blue">+</span>
                </p>
                <p className="mt-4 text-sm md:text-base text-paper/75 max-w-md leading-relaxed">
                  Membres et invités réunis pour l&apos;édition{" "}
                  {settings.start_date.slice(0, 4) || "à venir"} — le réseau
                  qui fait vivre {settings.location || "la Convention"}.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {dateLabel && (
                    <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-paper/85">
                      {dateLabel}
                    </span>
                  )}
                  {settings.location && (
                    <span className="rounded-full bg-blue/20 px-3.5 py-1.5 text-xs text-blue">
                      {settings.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="group relative overflow-hidden rounded-3xl bg-white border border-line/10 p-6 md:p-7 flex flex-col justify-between min-h-[170px] shadow-card transition-all hover:-translate-y-1 hover:shadow-lift hover:border-blue/40">
              <div
                aria-hidden
                className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-blue/10 blur-2xl transition-transform duration-500 group-hover:scale-125"
              />
              <div className="relative flex items-start justify-between">
                <p className="text-[11px] tracking-wide2 uppercase text-ink/45">
                  Badges générés
                </p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue/10 text-blue-dark text-sm">
                  ✓
                </span>
              </div>
              <div className="relative mt-6">
                <p className="font-serif text-5xl md:text-6xl leading-none">
                  {stats.badges}
                </p>
                <p className="mt-2.5 text-xs text-ink/55 leading-relaxed">
                  Identités digitales prêtes en 30 secondes.
                </p>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-line/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue to-blue-light" />
                </div>
              </div>
            </div>

            {/* Visuels */}
            <div className="group relative overflow-hidden rounded-3xl bg-blue text-ink p-6 md:p-7 flex flex-col justify-between min-h-[170px] transition-all hover:-translate-y-1 shadow-card hover:shadow-lift">
              <div
                aria-hidden
                className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-white/30 blur-2xl transition-transform duration-500 group-hover:scale-125"
              />
              <div className="relative flex items-start justify-between">
                <p className="text-[11px] tracking-wide2 uppercase text-ink/70">
                  Visuels générés
                </p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ink/10 text-ink text-sm">
                  ✦
                </span>
              </div>
              <div className="relative mt-6">
                <p className="font-serif text-5xl md:text-6xl leading-none">
                  {stats.posters}
                  <span className="text-ink/40">+</span>
                </p>
                <p className="mt-2.5 text-xs text-ink/75 leading-relaxed">
                  Affiches officielles partagées en un clic.
                </p>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-ink/20">
                  <div className="h-full w-3/4 rounded-full bg-ink" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= EXPÉRIENCE / SERVICES ======================= */}
      <section className="pb-16 md:pb-24">
        <div className="px-5 lg:px-[20%]">
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow eyebrow-center">Expérience digitale</p>
            <h2 className="mt-5 font-serif text-3xl md:text-[2.5rem] leading-[1.15] text-balance">
              Tout pour vivre la Convention
            </h2>
            <p className="mt-4 text-sm text-ink/60 leading-relaxed">
              Visuel, programme, annuaire — les outils officiels de
              l&apos;édition 2026, au même endroit.
            </p>
            <div className="mt-7">
              <Link
                href="/j-y-seri"
                className="group inline-flex items-center gap-2 rounded-full bg-ink text-paper px-6 py-3 text-sm font-medium hover:bg-blue hover:text-ink transition-colors"
              >
                Commencer
                <span
                  aria-hidden
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue text-ink text-xs"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceCard
              href="/j-y-seri"
              icon={<SparkGlyph />}
              title="Visuel officiel"
              text="Affiche ta participation et partage-la partout avec ton réseau."
            />
            <ServiceCard
              href="/programme"
              icon={<CalGlyph />}
              title="Programme"
              text={`${formatDayLabel(settings.start_date)} — ${formatDayLabel(
                settings.end_date
              )}`}
            />
            <ServiceCard
              href="/intervenants"
              icon={<MicGlyph />}
              title="Intervenants"
              text={`${speakers.length} voix de l'édition 2026 à découvrir.`}
            />
            <ServiceCard
              href="/partenaires"
              icon={<HandGlyph />}
              title="Partenaires"
              text={`${partners.length} partenaires officiels aux côtés de ${settings.event_name}.`}
            />
            <ServiceCard
              href="/participants"
              icon={<PeopleGlyph />}
              title="Participants"
              text="Annuaire & networking pour trouver les bonnes personnes."
            />
          </div>
        </div>
      </section>

      {/* ======================= PROGRAMME ======================= */}
      <section className="py-16 md:py-24">
        <div className="px-5 lg:px-[20%]">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="eyebrow eyebrow-center">Au programme</p>
            <h2 className="mt-5 font-serif text-3xl md:text-[2.5rem] leading-[1.15] text-balance">
              {dateLabel ? `${dateLabel} pour apprendre, connecter et célébrer.` : "Apprendre, connecter et célébrer."}
            </h2>
            <p className="mt-4 text-sm text-ink/60 leading-relaxed">
              Un aperçu des premières sessions de l&apos;édition 2026.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-3 md:gap-4 max-w-3xl mx-auto">
            {sessions.map((session, i) => (
              <Reveal key={session.id} delay={i * 0.07}>
                <Link
                  href="/programme"
                  className="group relative flex items-stretch gap-0 rounded-2xl bg-white border border-line/10 overflow-hidden shadow-card transition-all hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-lift"
                >
                {/* Left rail */}
                <div className="flex w-20 md:w-28 shrink-0 flex-col items-center justify-center border-r border-line/8 bg-canvas px-2 py-5">
                  <span className="font-sans text-base md:text-lg font-bold tracking-tight text-ink">
                    {session.start_time}
                  </span>
                  <span className="mt-1 text-[10px] tracking-wide2 uppercase text-ink/40">
                    {session.date === settings.start_date ? "J1" : "J2"}
                  </span>
                </div>

                {/* Accent bar by category */}
                <span
                  aria-hidden
                  className={`w-1 shrink-0 ${
                    session.category === "Pause"
                      ? "bg-line/15"
                      : session.category === "Networking" ||
                          session.category === "Panel" ||
                          session.category === "Statutaire"
                        ? "bg-navy"
                        : session.category === "Formation"
                          ? "bg-teal"
                          : "bg-blue"
                  }`}
                />

                <div className="flex flex-1 items-center justify-between gap-3 px-4 md:px-5 py-4 md:py-5 min-w-0">
                  <div className="min-w-0">
                    <p className="font-sans text-base md:text-lg font-semibold leading-snug text-ink group-hover:text-blue-dark transition-colors">
                      {session.title}
                    </p>
                    {session.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink/45">
                        <PinTiny />
                        {session.location}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`text-[11px] rounded-full px-2.5 py-1 font-medium ${CATEGORY_STYLE[session.category]}`}
                    >
                      {session.category}
                    </span>
                    <span
                      aria-hidden
                      className="text-ink/25 transition-all group-hover:text-blue group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </div>
                </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-8 text-center">
            <Link
              href="/programme"
              className="group inline-flex items-center gap-2 rounded-full bg-ink text-paper px-7 py-3.5 text-sm font-medium hover:bg-blue hover:text-ink transition-colors"
            >
              Voir tout le programme
              <span
                aria-hidden
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue text-ink text-xs transition-transform group-hover:translate-x-0.5 group-hover:bg-paper"
              >
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ======================= INTERVENANTS ======================= */}
      <section className="py-16 md:py-24">
        <div className="px-5 lg:px-[20%]">
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow eyebrow-center">Intervenants</p>
            <h2 className="mt-5 font-serif text-3xl md:text-[2.5rem] text-balance">
              Les voix de l&apos;édition 2026
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {featuredSpeakers.map((speaker) => (
              <Link
                key={speaker.id}
                href={`/intervenants/${speaker.id}`}
                className="group rounded-2xl border border-line/10 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-blue/40 hover:shadow-lift"
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

          <div className="mt-8 text-center">
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
        <div className="px-5 lg:px-[20%]">
          <div className="rounded-2xl border border-line/10 bg-white px-6 py-10 md:px-10 md:py-12 shadow-card">
            <div className="text-center max-w-lg mx-auto">
              <p className="eyebrow eyebrow-center">Partenaires</p>
              <h2 className="mt-5 font-serif text-2xl md:text-3xl">
                Ils rendent la Convention possible
              </h2>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:gap-4">
              {partners.map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partenaires/${partner.id}`}
                  className="group rounded-full border border-line/12 px-5 py-3 md:px-6 md:py-3.5 transition-all hover:-translate-y-0.5 hover:border-blue/50 hover:shadow-soft"
                >
                  <p className="font-sans text-sm font-medium leading-tight">
                    {partner.name}
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
      <section className="px-5 lg:px-[20%] pb-4">
        <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem] bg-ink text-paper px-6 py-14 md:px-14 md:py-20 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-blue/30 blur-[90px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blue/25 blur-[80px]"
          />

          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow eyebrow-center !text-blue">Rejoignez-nous</p>
            <h2 className="mt-5 font-serif text-3xl md:text-4xl leading-tight text-balance">
              Prêt pour la Convention&nbsp;?
            </h2>
            <p className="mt-4 text-sm md:text-base text-paper/70 leading-relaxed max-w-lg mx-auto">
              Confirmez votre participation à la Convention et portrayez
              fièrement votre engagement auprès de votre réseau.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/j-y-seri"
                className="group inline-flex justify-center items-center gap-2 rounded-full bg-blue text-ink px-7 py-3.5 text-sm font-semibold hover:bg-paper transition-colors"
              >
                J’y serai
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper text-xs transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
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

function ServiceCard({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white border border-line/10 p-6 flex flex-col shadow-card transition-all hover:-translate-y-1 hover:border-blue/40 hover:shadow-lift"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue text-ink transition-transform group-hover:scale-105">
        {icon}
      </span>
      <p className="mt-5 font-serif text-xl leading-tight">{title}</p>
      <p className="mt-2 text-sm text-ink/55 leading-relaxed flex-1">{text}</p>
      <span className="mt-5 text-sm font-medium text-blue-dark">
        Ouvrir <span aria-hidden>→</span>
      </span>
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

function PinTiny() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0" aria-hidden>
      <path
        d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SparkGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
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

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M8 12V6.5a1.5 1.5 0 1 1 3 0V11m0-4.5v-1a1.5 1.5 0 1 1 3 0V11m0-3.5a1.5 1.5 0 1 1 3 0V13c0 4-2.5 7-6 7s-6-2.5-6-6v-3.5a1.5 1.5 0 1 1 3 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5M14 14.5c2.2.2 3.8 1.5 4.5 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
