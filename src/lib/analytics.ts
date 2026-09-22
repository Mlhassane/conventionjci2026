import { getSupabaseClient } from "./supabase/client";
import { AnalyticsEventName } from "./types";

/**
 * Fire-and-forget analytics tracking. Never throws — a tracking failure
 * must never block the user's poster/badge flow.
 */
export function track(
  eventName: AnalyticsEventName,
  metadata: Record<string, unknown> = {}
) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void supabase.from("analytics_events").insert({
      event_name: eventName,
      metadata,
    });
  } catch {
    // Silently ignore — analytics must never disrupt the UX.
  }
}
