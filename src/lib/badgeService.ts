import { getSupabaseClient } from "./supabase/client";
import { generateBadgeCode } from "./badgeCode";

export type NewBadgeInput = {
  name: string;
  role: string;
  organization: string;
  city: string;
};

/**
 * Persists the participant + badge to Supabase so the QR verification page
 * can resolve it later. Always returns a usable unique_code, even if the
 * database write fails or Supabase isn't configured yet (offline/demo mode) —
 * the badge PNG itself must never fail to generate because of the network.
 */
export async function createBadgeRecord(input: NewBadgeInput): Promise<{
  uniqueCode: string;
  saved: boolean;
}> {
  const uniqueCode = generateBadgeCode();
  const supabase = getSupabaseClient();
  if (!supabase) return { uniqueCode, saved: false };

  try {
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .insert({
        name: input.name,
        city: input.city || null,
        organization: input.organization || null,
        role: input.role,
        is_public: true,
      })
      .select("id")
      .single();

    if (participantError) return { uniqueCode, saved: false };

    const { error: badgeError } = await supabase.from("badges").insert({
      participant_id: participant?.id ?? null,
      unique_code: uniqueCode,
      full_name: input.name,
      role: input.role,
      organization: input.organization || null,
      city: input.city || null,
      status: "active",
    });

    if (badgeError) return { uniqueCode, saved: false };

    return { uniqueCode, saved: true };
  } catch {
    return { uniqueCode, saved: false };
  }
}
