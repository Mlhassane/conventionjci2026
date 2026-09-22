"use client";

import { useMemo, useState } from "react";
import { ProgramSession, Speaker, SessionCategory } from "@/lib/types";
import { formatDayLabel } from "@/lib/date";
import EmptyState from "@/components/EmptyState";

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
  "Soirée": "bg-yellow/35 text-ink",
  "Statutaire": "bg-ink/8 text-ink",
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

  const speakerMap = useMemo(
    () => new Map(speakers.map((s) => [s.id, s])),
    [speakers]
  );

  const filtered = useMemo(
    () =>
      activeCategory === "Tout"
        ? sessions
        : sessions.filter((s) => s.category === activeCategory),
    [sessions, activeCategory]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, ProgramSession[]>();
    for (const s of filtered) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

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
    <div className="container-edge pb-24">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 -mx-1 px-1">
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

      {byDate.length === 0 ? (
        <EmptyState title="Aucune session dans cette catégorie." />
      ) : (
        <div className="space-y-12">
          {byDate.map(([date, items]) => (
            <div key={date}>
              <h2 className="font-serif text-2xl mb-5 capitalize">
                {formatDayLabel(date)}
              </h2>
              <div className="relative border-l border-line/15 pl-6 space-y-6">
                {items
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((session) => {
                    const speaker = session.speaker_id
                      ? speakerMap.get(session.speaker_id)
                      : null;
                    return (
                      <div key={session.id} className="relative">
                        <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue ring-4 ring-blue/15" />
                        <div className="card p-5 transition-all duration-200 hover:border-blue/40 hover:shadow-lift">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="font-sans text-sm font-semibold">
                              {session.start_time}
                              {session.end_time ? ` – ${session.end_time}` : ""}
                            </span>
                            <span
                              className={`text-xs rounded-full px-3 py-1 font-medium ${CATEGORY_STYLE[session.category]}`}
                            >
                              {session.category}
                            </span>
                          </div>
                          <p className="mt-2 font-serif text-lg">{session.title}</p>
                          {session.description && (
                            <p className="mt-1 text-sm text-ink/60">
                              {session.description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-4 text-xs text-ink/45">
                            {session.location && <span>📍 {session.location}</span>}
                            {speaker && <span>🎙️ {speaker.name}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
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
          ? "bg-blue text-ink border-blue shadow-cta font-medium"
          : "border-line/15 bg-white hover:border-blue/50 hover:bg-blue/5"
      }`}
    >
      {children}
    </button>
  );
}
