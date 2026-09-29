import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ParticipantsView from "./ParticipantsView";
import { getEventSettings, getPublicParticipants } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const [participants, settings] = await Promise.all([
    getPublicParticipants(),
    getEventSettings(),
  ]);

  return (
    <main className="bg-canvas min-h-[70vh]">
      <PageHeader
        eyebrow={settings.hashtag || "Communauté JCI"}
        title="Les participants"
        description="Découvrez les membres de la communauté présents à la Convention."
      />
      <ParticipantsView participants={participants} />
      <Footer />
    </main>
  );
}
