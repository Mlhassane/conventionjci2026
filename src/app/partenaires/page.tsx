import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getEventSettings, getPartners } from "@/lib/data";
import { PartnerDirectory } from "@/components/public/partner-directory";
import { PartnerLogoSlider } from "@/components/public/partner-logo-slider";

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

      {partners.length > 0 && (
        <section className="border-b border-line/8 bg-paper">
          <div className="container-edge py-7 md:py-9">
            <PartnerLogoSlider partners={partners} />
          </div>
        </section>
      )}

      <div className="container-edge py-10 md:py-14">
        <PartnerDirectory partners={partners} />
      </div>
      <Footer />
    </main>
  );
}
