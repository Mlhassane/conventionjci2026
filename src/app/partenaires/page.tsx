import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getEventSettings, getPartners } from "@/lib/data";
import { PartnerDirectory } from "@/components/public/partner-directory";

export const dynamic = "force-dynamic";

export default async function PartenairesPage() {
  const [partners, settings] = await Promise.all([getPartners(), getEventSettings()]);

  return (
    <main>
      <PageHeader
        eyebrow={settings.event_name}
        title="Nos partenaires"
        description="Ils contribuent à la réussite de la Convention."
      >
        {partners.length > 0 && (
          <p className="mt-4 text-sm text-ink/50">
            {partners.length} partenaire{partners.length > 1 ? "s" : ""} engagé
            {partners.length > 1 ? "s" : ""}
          </p>
        )}
      </PageHeader>

      <div className="container-edge pb-24">
        <PartnerDirectory partners={partners} />
      </div>
      <Footer />
    </main>
  );
}
