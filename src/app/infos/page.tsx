import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { getEventSettings, getOfficials, getPracticalInfo } from "@/lib/data";
import { PracticalInfoSection } from "@/lib/types";

export const dynamic = "force-dynamic";

const SECTION_ICON: Record<PracticalInfoSection, string> = {
  "Lieu": "📍",
  "Localisation": "🗺️",
  "Hébergement": "🏨",
  "Transport": "🚕",
  "Restauration": "🍽️",
  "Contacts utiles": "📞",
  "Informations importantes": "ℹ️",
};

export default async function InfosPage() {
  const [infos, officials, settings] = await Promise.all([
    getPracticalInfo(),
    getOfficials(),
    getEventSettings(),
  ]);

  return (
    <main>
      <PageHeader
        eyebrow={settings.event_name}
        title="Infos pratiques"
        description="Lieu, hébergement, transport, officiels et contacts — tout ce qu'il faut savoir avant de venir."
      />

      <div className="container-edge pb-24 max-w-2xl">
        {infos.length === 0 ? (
          <EmptyState title="Aucune information publiée pour le moment." />
        ) : (
          <div className="space-y-4">
            {infos.map((info) => (
              <div key={info.id} className="card p-6 transition-shadow hover:shadow-card">
                <div className="flex items-start gap-4">
                  <span className="h-11 w-11 shrink-0 rounded-xl2 bg-blue/10 border border-blue/15 flex items-center justify-center text-lg">
                    {SECTION_ICON[info.section] ?? "ℹ️"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-xl">{info.title}</p>
                    <p className="mt-2 text-sm text-ink/65 leading-relaxed whitespace-pre-line">
                      {info.content}
                    </p>
                    {info.map_url && (
                      <a
                        href={info.map_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm mt-4"
                      >
                        Voir sur la carte
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {officials.length > 0 && (
          <div className="mt-12">
            <p className="eyebrow">Officiels de l&apos;événement</p>
            <h2 className="mt-4 font-serif text-2xl">
              Ils portent la Convention
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {officials.map((official) => (
                <div
                  key={official.id}
                  className="card p-5 flex items-center gap-4 transition-shadow hover:shadow-card"
                >
                  {official.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={official.photo_url}
                      alt={official.name}
                      className="h-14 w-14 shrink-0 rounded-full object-cover border-2 border-blue/30"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-lg text-blue">
                      {getInitials(official.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-serif text-lg leading-tight">
                      {official.name}
                    </p>
                    {official.title && (
                      <p className="mt-0.5 text-sm text-blue-dark">
                        {official.title}
                      </p>
                    )}
                    {official.organization && (
                      <p className="mt-0.5 text-xs text-ink/50">
                        {official.organization}
                      </p>
                    )}
                  </div>
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}
