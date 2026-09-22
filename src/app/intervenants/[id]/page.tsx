import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import { getProgram, getSpeaker } from "@/lib/data";

export default async function SpeakerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const speaker = await getSpeaker(params.id);
  if (!speaker) notFound();

  const program = await getProgram();
  const sessions = program.filter((s) => s.speaker_id === speaker.id);

  return (
    <main>
      <div className="container-edge pt-10 md:pt-16 pb-24 max-w-2xl">
        <Link
          href="/intervenants"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          ← Tous les intervenants
        </Link>

        <div className="mt-8 flex flex-col items-center text-center">
          <div className="h-28 w-28 rounded-full bg-blue/10 border-4 border-blue/20 flex items-center justify-center overflow-hidden shadow-card">
            {speaker.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={speaker.photo_url} alt={speaker.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-serif text-3xl text-blue-dark">
                {speaker.name.charAt(0)}
              </span>
            )}
          </div>
          <h1 className="mt-5 font-serif text-3xl">{speaker.name}</h1>
          <p className="mt-1 text-blue-dark text-sm">{speaker.position}</p>
          <p className="text-ink/50 text-sm">{speaker.organization}</p>
        </div>

        {speaker.bio && (
          <div className="mt-8 card p-6">
            <p className="eyebrow mb-4">Biographie</p>
            <p className="text-ink/70 leading-relaxed">{speaker.bio}</p>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow mb-4">Sessions animées</p>
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="card p-4 transition-shadow hover:shadow-card">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-ink/45 mt-1">
                    {s.start_time} · {s.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
