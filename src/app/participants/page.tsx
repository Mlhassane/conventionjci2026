import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ParticipantsView from "./ParticipantsView";
import { getPublicParticipants } from "@/lib/data";

export default async function ParticipantsPage() {
  const participants = await getPublicParticipants();

  return (
    <main className="bg-canvas min-h-[70vh]">
      <PageHeader
        eyebrow="Communauté JCI"
        title="Les participants"
        description="Découvrez les membres de la communauté présents à la Convention."
      />
      <ParticipantsView participants={participants} />
      <Footer />
    </main>
  );
}
