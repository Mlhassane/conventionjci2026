import { getEventSettings } from "@/lib/data";
import { formatDateRange, formatShortDateRange } from "@/lib/date";
import VisuelGenerator from "./VisuelGenerator";

export const dynamic = "force-dynamic";

/**
 * Le générateur est alimenté par les paramètres de l'événement
 * (admin > Paramètres) : nom, dates, lieu et hashtag.
 */
export default async function VisuelPage() {
  const settings = await getEventSettings();
  const hasDates = Boolean(settings.start_date && settings.end_date);

  return (
    <VisuelGenerator
      event={{
        name: settings.event_name,
        location: settings.location ?? "",
        dateLabel: hasDates ? formatDateRange(settings.start_date, settings.end_date) : "",
        shortDateLabel: hasDates
          ? formatShortDateRange(settings.start_date, settings.end_date)
          : "",
        hashtag: settings.hashtag ?? "",
      }}
    />
  );
}
