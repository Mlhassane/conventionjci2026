import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarDaysIcon, MapPinIcon, MicIcon } from "lucide-react";
import Footer from "@/components/Footer";
import { getProgram, getSpeaker } from "@/lib/data";
import { formatDayLabel } from "@/lib/date";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SpeakerAvatar } from "@/components/public/speaker-directory";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const speaker = await getSpeaker(params.id);
  if (!speaker) return { title: "Intervenant introuvable" };
  return {
    title: `${speaker.name} — Intervenant`,
    description:
      speaker.bio ??
      `${speaker.name}${speaker.position ? `, ${speaker.position}` : ""} intervenant à la Convention.`,
  };
}

export default async function SpeakerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const speaker = await getSpeaker(params.id);
  if (!speaker) notFound();

  const program = await getProgram();
  const sessions = program.filter((session) => session.speaker_id === speaker.id);

  return (
    <main className="bg-muted/30">
      <div className="container-edge pt-8 pb-24">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/intervenants">
            <ArrowLeftIcon className="h-4 w-4" />
            Tous les intervenants
          </Link>
        </Button>

        <Card className="mt-6 overflow-hidden py-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:items-start sm:text-left">
            <SpeakerAvatar speaker={speaker} className="h-24 w-24 shrink-0 border-2" size={96} />
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-2xl leading-tight text-foreground md:text-3xl">
                {speaker.name}
              </h1>
              {speaker.position && (
                <p className="mt-2 text-sm font-medium text-primary">{speaker.position}</p>
              )}
              {speaker.organization && (
                <p className="mt-1 text-sm text-muted-foreground">{speaker.organization}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {speaker.bio && (
          <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Biographie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">{speaker.bio}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
              Sessions animées
            </CardTitle>
            <CardDescription>
              {sessions.length > 0
                ? `${sessions.length} session${sessions.length > 1 ? "s" : ""} au programme`
                : "Aucune session publiée pour le moment."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MicIcon className="h-4 w-4" />
                Le programme détaillé sera publié prochainement.
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{session.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatDayLabel(session.date)}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>
                        {session.start_time}
                        {session.end_time ? ` – ${session.end_time}` : ""}
                      </span>
                      {session.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          {session.location}
                        </span>
                      )}
                    </p>
                  </div>
                  <UiBadge variant="secondary">{session.category}</UiBadge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </main>
  );
}
