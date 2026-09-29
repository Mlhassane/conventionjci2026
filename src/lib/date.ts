const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
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
export function formatShortDateRange(startISO: string, endISO: string): string {
  return formatDateRange(startISO, endISO).replace(/\s+\d{4}$/, "");
}

export function formatDayLabel(dateISO: string): string {
  const date = new Date(dateISO + "T00:00:00Z");
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const day = days[date.getUTCDay()];
  const dayNum = date.getUTCDate();
  const month = MONTHS_FR[date.getUTCMonth()];
  return `${day.charAt(0).toUpperCase() + day.slice(1)} ${dayNum} ${month}`;
}
