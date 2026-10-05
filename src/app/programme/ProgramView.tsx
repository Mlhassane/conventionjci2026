"use client";

import { useMemo, useState } from "react";
import { ProgramSession, Speaker, SessionCategory } from "@/lib/types";
import { formatDayLabel } from "@/lib/date";
import EmptyState from "@/components/EmptyState";
import Reveal from "@/components/Reveal";

const CATEGORIES: SessionCategory[] = [
  "Cérémonie",
  "Formation",
  "Panel",
  "Networking",
  "Pause",
  "Soirée",
  "Statutaire",
];

const CATEGORY_STYLE: Record<SessionCategory, string> = {
  "Cérémonie": "bg-blue/15 text-blue-dark",
  "Formation": "bg-teal/20 text-teal-dark",
  "Panel": "bg-ink/8 text-ink",
  "Networking": "bg-navy/10 text-navy",
  "Pause": "bg-ink/5 text-ink/50",
  "Soirée": "bg-blue/20 text-blue-dark",
  "Statutaire": "bg-ink/8 text-ink",
};

const RAIL_COLOR: Record<SessionCategory, string> = {
  "Cérémonie": "bg-blue",
  "Formation": "bg-teal",
  "Panel": "bg-navy",
  "Networking": "bg-navy",
  "Pause": "bg-line/15",
  "Soirée": "bg-blue",
  "Statutaire": "bg-ink",
};

export default function ProgramView({
  sessions,
  speakers,
}: {
  sessions: ProgramSession[];
  speakers: Speaker[];
}) {
  const [activeCategory, setActiveCategory] = useState<SessionCategory | "Tout">(
    "Tout"
  );
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const speakerMap = useMemo(
    () => new Map(speakers.map((s) => [s.id, s])),
    [speakers]
  );

  const days = useMemo(() => {
    const set = new Set(sessions.map((s) => s.date));
    return Array.from(set).sort();
  }, [sessions]);

  const selectedDay = activeDay ?? days[0] ?? null;

  const filtered = useMemo(() => {
    let list = sessions;
    if (selectedDay) list = list.filter((s) => s.date === selectedDay);
    if (activeCategory !== "Tout")
      list = list.filter((s) => s.category === activeCategory);
    // Les activités sans horaire passent en fin de journée.
    return [...list].sort((a, b) =>
      (a.start_time ?? "99:99").localeCompare(b.start_time ?? "99:99")
    );
  }, [sessions, selectedDay, activeCategory]);

  if (sessions.length === 0) {
    return (
      <div className="container-edge pb-24">
        <EmptyState
          title="Aucun programme publié pour le moment."
          description="Le déroulé de la Convention sera bientôt disponible."
        />
      </div>
    );
  }

  return (
    <div className="container-edge pb-24 max-w-3xl mx-auto">
      {/* Day tabs */}
      <div className="inline-flex rounded-full border border-line/10 bg-white p-1 shadow-card">
        {days.map((date, idx) => {
          const active = selectedDay === date;
          return (
            <button
              key={date}
              onClick={() => setActiveDay(date)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-ink text-paper shadow-soft"
                  : "text-ink/55 hover:text-ink hover:bg-ink/5"
              }`}
            >
              Jour {idx + 1}
              <span className="ml-2 hidden sm:inline text-[11px] opacity-70">
                {formatDayLabel(date).split(" ").slice(1).join(" ")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category chips */}
      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        <Chip
          active={activeCategory === "Tout"}
          onClick={() => setActiveCategory("Tout")}
        >
          Tout
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            active={activeCategory === c}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Aucune session dans cette catégorie." />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <p className="text-[11px] tracking-wide2 uppercase text-ink/40 px-1">
            {selectedDay ? formatDayLabel(selectedDay) : ""} ·{" "}
            {filtered.length} sessions
          </p>

          {filtered.map((session, i) => {
            const speaker = session.speaker_id
              ? speakerMap.get(session.speaker_id)
              : null;

            return (
              <Reveal key={session.id} delay={Math.min(i * 0.06, 0.36)}>
              <article
                className="group flex items-stretch rounded-2xl bg-white border border-line/10 overflow-hidden shadow-card transition-all hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-lift"
              >
                <div className="flex w-20 md:w-28 shrink-0 flex-col items-center justify-center border-r border-line/8 bg-canvas px-2 py-5">
                  <span className="font-sans text-base md:text-lg font-bold tracking-tight text-ink">
                    {session.start_time ?? "—"}
                  </span>
                  {session.end_time && (
                    <span className="mt-0.5 text-[11px] text-ink/40">
                      → {session.end_time}
                    </span>
                  )}
                  {!session.start_time && (
                    <span className="mt-0.5 text-[11px] text-ink/40">
                      à confirmer
                    </span>
                  )}
                </div>

                <span
                  aria-hidden
                  className={`w-1 shrink-0 ${RAIL_COLOR[session.category]}`}
                />

                <div className="flex-1 min-w-0 px-4 md:px-5 py-4 md:py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-sans text-base md:text-lg font-semibold leading-snug text-ink group-hover:text-blue-dark transition-colors">
                        {session.title}
                      </h3>
                      {session.description && (
                        <p className="mt-1.5 text-sm text-ink/55 leading-relaxed line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-[11px] rounded-full px-2.5 py-1 font-medium ${CATEGORY_STYLE[session.category]}`}
                    >
                      {session.category}
                    </span>
                  </div>

                  {(session.location || session.responsibility || speaker) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/45">
                      {session.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-3.5 w-3.5"
                            aria-hidden
                          >
                            <path
                              d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <circle
                              cx="12"
                              cy="10"
                              r="2.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                          </svg>
                          {session.location}
                        </span>
                      )}
                      {session.responsibility && (
                        <span className="inline-flex items-center gap-1.5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-3.5 w-3.5"
                            aria-hidden
                          >
                            <circle
                              cx="12"
                              cy="8"
                              r="3.2"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M5.5 19.5c1.3-3.2 3.7-4.8 6.5-4.8s5.2 1.6 6.5 4.8"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                          {session.responsibility}
                        </span>
                      )}
                      {speaker && (
                        <span className="inline-flex items-center gap-1.5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-3.5 w-3.5"
                            aria-hidden
                          >
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
                              d="M6 11a6 6 0 0 0 12 0M12 17v4"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                          {speaker.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm border transition-all duration-150 active:scale-[0.97] ${
        active
          ? "bg-blue text-ink border-blue shadow-cta font-semibold"
          : "border-line/12 bg-white text-ink/60 hover:border-blue/45 hover:text-ink hover:bg-blue/5"
      }`}
    >
      {children}
    </button>
  );
}
