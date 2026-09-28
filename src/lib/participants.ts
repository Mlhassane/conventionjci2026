export function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = "+" + cleaned.slice(1).replace(/\+/g, "");
  } else {
    cleaned = cleaned.replace(/\+/g, "");
  }
  if (/^[0-9]{8}$/.test(cleaned)) return "+227" + cleaned;
  if (/^227[0-9]{8}$/.test(cleaned)) return "+" + cleaned;
  return cleaned;
}

/** Generates a unique member code like JCI-2026-A7X2. */
export function generateMemberCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `JCI-2026-${suffix}`;
}
