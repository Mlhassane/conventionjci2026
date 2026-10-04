const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function parseDate(dateISO: string | null | undefined): Date | null {
  if (!dateISO) return null;
  const date = new Date(dateISO);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateRange(
  startISO: string | null | undefined,
  endISO: string | null | undefined
): string {
  const start = parseDate(startISO);
  const end = parseDate(endISO);
  // Une date manquante ou invalide ne doit pas casser la page.
  if (!start || !end) return "";
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const month = MONTHS_FR[end.getUTCMonth()];
  const year = end.getUTCFullYear();

  if (sameMonth) {
    return `${startDay} — ${endDay} ${month} ${year}`;
  }
  const startMonth = MONTHS_FR[start.getUTCMonth()];
  return `${startDay} ${startMonth} — ${endDay} ${month} ${year}`;
}

/** Variante sans l'année, utilisée sur les visuels imprimés. */
export function formatShortDateRange(
  startISO: string | null | undefined,
  endISO: string | null | undefined
): string {
  return formatDateRange(startISO, endISO).replace(/\s+\d{4}$/, "");
}

export function formatDayLabel(dateISO: string | null | undefined): string {
  const date = parseDate(dateISO);
  if (!date) return "";
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const day = days[date.getUTCDay()];
  const dayNum = date.getUTCDate();
  const month = MONTHS_FR[date.getUTCMonth()];
  return `${day.charAt(0).toUpperCase() + day.slice(1)} ${dayNum} ${month}`;
}
