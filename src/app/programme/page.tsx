import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProgramView from "./ProgramView";
import { getEventSettings, getProgram, getSpeakers } from "@/lib/data";
import { formatDateRange } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function ProgrammePage() {
  const [sessions, speakers, settings] = await Promise.all([
    getProgram(),
    getSpeakers(),
    getEventSettings(),
  ]);

  const dateLabel = settings.start_date
    ? formatDateRange(settings.start_date, settings.end_date)
    : settings.event_name;

  return (
    <main>
      <PageHeader
        eyebrow={`${dateLabel}${settings.location ? ` · ${settings.location}` : ""}`}
        title="Programme"
        description={`Le déroulé complet de la ${settings.event_name}.`}
      />
      <ProgramView sessions={sessions} speakers={speakers} />
      <Footer />
    </main>
  );
}
