import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProgramView from "./ProgramView";
import { getProgram, getSpeakers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProgrammePage() {
  const [sessions, speakers] = await Promise.all([getProgram(), getSpeakers()]);

  return (
    <main>
      <PageHeader
        eyebrow="9 — 10 octobre · Maradi"
        title="Programme"
        description="Le déroulé complet des deux jours de la Convention JCI Niger 2026."
      />
      <ProgramView sessions={sessions} speakers={speakers} />
      <Footer />
    </main>
  );
}
