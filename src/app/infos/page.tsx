import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { getPracticalInfo } from "@/lib/data";
import { PracticalInfoSection } from "@/lib/types";

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
  const infos = await getPracticalInfo();

  return (
    <main>
      <PageHeader
        eyebrow="Convention JCI Niger 2026"
        title="Infos pratiques"
        description="Lieu, hébergement, transport et contacts — tout ce qu'il faut savoir avant de venir."
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
      </div>
      <Footer />
    </main>
  );
}
