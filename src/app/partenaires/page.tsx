import Link from "next/link";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { getPartners } from "@/lib/data";
import { PartnerCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: PartnerCategory[] = [
  "Partenaire officiel",
  "Partenaire principal",
  "Sponsor",
  "Partenaire média",
  "Partenaire institutionnel",
  "Partenaire technique",
];

export default async function PartenairesPage() {
  const partners = await getPartners();

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: partners.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <main>
      <PageHeader
        eyebrow="Convention JCI Niger 2026"
        title="Nos partenaires"
        description="Ils contribuent à la réussite de la Convention."
      />

      <div className="container-edge pb-24">
        {grouped.length === 0 ? (
          <EmptyState
            title="Aucun partenaire publié pour le moment."
            description="La liste des partenaires sera annoncée prochainement."
          />
        ) : (
          <div className="space-y-14">
            {grouped.map((group) => (
              <div key={group.category}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-serif text-2xl">{group.category}</h2>
                  <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-xs font-medium text-blue-dark">
                    {group.items.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((partner) => (
                    <Link
                      key={partner.id}
                      href={`/partenaires/${partner.id}`}
                      className="card card-hover p-6"
                    >
                      <div className="h-12 w-12 rounded-xl2 bg-blue/10 border border-blue/15 flex items-center justify-center overflow-hidden">
                        {partner.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-contain" />
                        ) : (
                          <span className="font-serif text-lg text-blue-dark">
                            {partner.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 font-serif text-lg">{partner.name}</p>
                      {partner.description && (
                        <p className="mt-2 text-sm text-ink/55 line-clamp-2">
                          {partner.description}
                        </p>
                      )}
                      {partner.offer && (
                        <p className="mt-3 text-xs text-blue-dark font-medium">
                          Offre Convention disponible
                        </p>
                      )}
                    </Link>
                  ))}
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
