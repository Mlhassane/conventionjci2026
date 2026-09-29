"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon, MicIcon, SearchIcon } from "lucide-react";
import type { Speaker } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export function SpeakerDirectory({ speakers }: { speakers: Speaker[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return speakers;
    return speakers.filter((speaker) =>
      [speaker.name, speaker.position, speaker.organization, speaker.bio]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [speakers, query]);

  if (speakers.length === 0) {
    return (
      <EmptyState
        icon={MicIcon}
        title="Aucun intervenant publié pour le moment"
        description="La liste des intervenants sera annoncée prochainement."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un intervenant…"
            aria-label="Rechercher un intervenant"
            className="pl-9"
          />
        </div>
        <UiBadge variant="secondary" className="h-7">
          {filtered.length} / {speakers.length}
        </UiBadge>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Aucun résultat"
          description="Modifiez votre recherche pour trouver un intervenant."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((speaker) => (
            <Link
              key={speaker.id}
              href={`/intervenants/${speaker.id}`}
              className="group h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="flex h-full flex-col overflow-hidden py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <Avatar className="h-14 w-14">
                      {speaker.photo_url && (
                        <AvatarImage src={speaker.photo_url} alt={speaker.name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                        {initials(speaker.name)}
                      </AvatarFallback>
                    </Avatar>
                    {speaker.position && (
                      <UiBadge variant="secondary" className="shrink-0">
                        {speaker.position}
                      </UiBadge>
                    )}
                  </div>

                  <p className="mt-4 font-serif text-xl leading-tight text-foreground">
                    {speaker.name}
                  </p>
                  {speaker.organization && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {speaker.organization}
                    </p>
                  )}
                  {speaker.bio && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {speaker.bio}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="border-t bg-muted/40 px-6 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Voir le profil
                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SpeakerAvatar({
  speaker,
  className,
  size = 96,
}: {
  speaker: Speaker;
  className?: string;
  size?: number;
}) {
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {speaker.photo_url && (
        <AvatarImage src={speaker.photo_url} alt={speaker.name} className="object-cover" />
      )}
      <AvatarFallback className="bg-primary/10 text-2xl font-medium text-primary">
        {initials(speaker.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function SpeakerPhoto({ speaker }: { speaker: Speaker }) {
  if (!speaker.photo_url) return null;
  return (
    <Image
      src={speaker.photo_url}
      alt={speaker.name}
      width={160}
      height={160}
      className="h-full w-full object-cover"
    />
  );
}
