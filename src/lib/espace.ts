import { getSupabaseClient } from "./supabase/client";

export type EspaceBadge = {
  id: string;
  unique_code: string;
  status: "active" | "revoked";
  badge_url: string | null;
} | null;

export type EspaceParticipant = {
  id: string;
  name: string;
  city: string | null;
  organization: string | null;
  role: string | null;
  photo_url: string | null;
  is_public: boolean;
  member_code: string;
  badge: EspaceBadge;
};

export type EspaceSession = {
  phone: string;
  member_code: string;
};

const STORAGE_KEY = "jci_espace_session";

/**
 * Normalizes a Niger phone number: strips spaces/dots/dashes, adds the
 * +227 prefix when missing. Mirrors the normalization in the
 * participant_login SQL function.
 */
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

/** Generates a unique member code like JCI-2026-A7X2 (no ambiguous chars). */
export function generateMemberCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `JCI-2026-${suffix}`;
}

/** Logs a participant in with phone + member code. Returns null on failure. */
export async function participantLogin(
  phone: string,
  code: string
): Promise<EspaceParticipant | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("participant_login", {
      p_phone: normalizePhone(phone),
      p_code: code.trim(),
    });
    if (error || !data) return null;
    return data as EspaceParticipant;
  } catch {
    return null;
  }
}

/** Updates visibility and/or photo for the logged-in participant. */
export async function updateMyProfile(
  session: EspaceSession,
  patch: { is_public?: boolean; photo_url?: string }
): Promise<{ is_public: boolean; photo_url: string | null } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("participant_update_profile", {
      p_phone: session.phone,
      p_code: session.member_code,
      p_is_public: patch.is_public ?? null,
      p_photo_url: patch.photo_url ?? null,
    });
    if (error || !data) return null;
    return data as { is_public: boolean; photo_url: string | null };
  } catch {
    return null;
  }
}

export function getEspaceSession(): EspaceSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EspaceSession;
    if (!parsed.phone || !parsed.member_code) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveEspaceSession(session: EspaceSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearEspaceSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
