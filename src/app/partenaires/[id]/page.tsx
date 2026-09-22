import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import { getPartner } from "@/lib/data";

export default async function PartnerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const partner = await getPartner(params.id);
  if (!partner) notFound();

  return (
    <main>
      <div className="container-edge pt-10 md:pt-16 pb-24 max-w-xl">
        <Link
          href="/partenaires"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          ← Tous les partenaires
        </Link>

        <div className="mt-8 flex items-center gap-5">
          <div className="h-20 w-20 rounded-xl2 bg-blue/10 border border-blue/15 flex items-center justify-center overflow-hidden shrink-0 shadow-card">
            {partner.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-contain" />
            ) : (
              <span className="font-serif text-2xl text-blue-dark">
                {partner.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-serif text-2xl">{partner.name}</h1>
            <p className="text-sm text-blue-dark mt-1">{partner.category}</p>
          </div>
        </div>

        {partner.description && (
          <div className="mt-8 card p-6">
            <p className="text-ink/70 leading-relaxed">{partner.description}</p>
          </div>
        )}

        {partner.offer && (
          <div className="mt-4 rounded-xl2 bg-blue/10 border border-blue/25 p-5">
            <p className="text-xs uppercase tracking-wide2 text-blue-dark mb-1">
              Offre spéciale Convention
            </p>
            <p className="text-sm">{partner.offer}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Visiter le site
            </a>
          )}
          {partner.whatsapp && (
            <a
              href={`https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-success"
            >
              Contacter sur WhatsApp
            </a>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
