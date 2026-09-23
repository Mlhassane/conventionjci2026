import Link from "next/link";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { getSpeakers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function IntervenantsPage() {
  const speakers = await getSpeakers();

  return (
    <main>
      <PageHeader
        eyebrow="Convention JCI Niger 2026"
        title="Nos intervenants"
        description="Les leaders, entrepreneurs et voices qui animeront l'édition 2026."
      />

      <div className="container-edge pb-24">
        {speakers.length === 0 ? (
          <EmptyState
            title="Aucun intervenant publié pour le moment."
            description="La liste des intervenants sera annoncée prochainement."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {speakers.map((speaker) => (
              <Link
                key={speaker.id}
                href={`/intervenants/${speaker.id}`}
                className="card card-hover p-6 group"
              >
                <div className="h-16 w-16 rounded-full bg-blue/10 border border-blue/20 flex items-center justify-center overflow-hidden">
                  {speaker.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={speaker.photo_url} alt={speaker.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-serif text-xl text-blue-dark">
                      {speaker.name.charAt(0)}
                    </span>
                  )}
                </div>
                <p className="mt-4 font-serif text-xl">{speaker.name}</p>
                <p className="mt-1 text-sm text-blue-dark">{speaker.position}</p>
                <p className="text-sm text-ink/50">{speaker.organization}</p>
                {speaker.bio && (
                  <p className="mt-3 text-sm text-ink/55 line-clamp-2">{speaker.bio}</p>
                )}
                <p className="mt-4 text-xs font-medium text-blue-dark opacity-0 group-hover:opacity-100 transition-opacity">
                  Voir le profil →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
