import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getEventSettings, getSpeakers } from "@/lib/data";
import { SpeakerDirectory } from "@/components/public/speaker-directory";

export const dynamic = "force-dynamic";

export default async function IntervenantsPage() {
  const [speakers, settings] = await Promise.all([getSpeakers(), getEventSettings()]);
  const edition = settings.start_date.slice(0, 4);

  return (
    <main>
      <PageHeader
        eyebrow={settings.event_name}
        title="Nos intervenants"
        description={`Les leaders, entrepreneurs et voices qui animeront l'édition ${edition}.`}
      >
        {speakers.length > 0 && (
          <p className="mt-4 text-sm text-ink/50">
            {speakers.length} intervenant{speakers.length > 1 ? "s" : ""} annoncé
            {speakers.length > 1 ? "s" : ""}
          </p>
        )}
      </PageHeader>

      <div className="container-edge pb-24">
        <SpeakerDirectory speakers={speakers} />
      </div>
      <Footer />
    </main>
  );
}
