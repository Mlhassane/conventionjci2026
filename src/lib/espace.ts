import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  is_admin: boolean;
  member_code: string;
  badge: EspaceBadge;
};

export type EspaceSession = {
  name: string;
  member_code: string;
};

const STORAGE_KEY = "jci_espace_session";

/**
 * Normalizes a Niger phone number: strips spaces/dots/dashes, adds the
 * +227 prefix when missing. Used by the admin registration form.
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

/** Collapses whitespace for session storage (server normalizes case/accents). */
export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Logs a participant in with convention code + full name.
 * Returns null on failure (unknown code, name mismatch).
 */
export async function participantLogin(
  name: string,
  code: string
): Promise<EspaceParticipant | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("participant_login_by_name", {
      p_name: normalizeName(name),
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
    const { data, error } = await supabase.rpc(
      "participant_update_profile_by_name",
      {
        p_name: session.name,
        p_code: session.member_code,
        p_is_public: patch.is_public ?? null,
        p_photo_url: patch.photo_url ?? null,
      }
    );
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
    if (!parsed.name || !parsed.member_code) return null;
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

/**
 * Guard hook for protected participant pages (/badge, /visuel, mon-espace).
 * Redirects to /espace?next=... when there is no valid session, otherwise
 * returns the fresh profile (used to prefill the generators).
 */
export function useEspaceProfile(next: string): {
  status: "checking" | "ready";
  profile: EspaceParticipant | null;
  setProfile: React.Dispatch<React.SetStateAction<EspaceParticipant | null>>;
} {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready">("checking");
  const [profile, setProfile] = useState<EspaceParticipant | null>(null);

  useEffect(() => {
    (async () => {
      const session = getEspaceSession();
      if (!session) {
        router.replace(`/espace?next=${next}`);
        return;
      }
      const data = await participantLogin(session.name, session.member_code);
      if (!data) {
        clearEspaceSession();
        router.replace(`/espace?next=${next}`);
        return;
      }
      saveEspaceSession({ name: data.name, member_code: data.member_code });
      setProfile(data);
      setStatus("ready");
    })();
  }, [router, next]);

  return { status, profile, setProfile };
}
