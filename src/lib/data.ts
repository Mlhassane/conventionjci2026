import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";
import {
  mockEventSettings,
  mockParticipants,
  mockPartners,
  mockPracticalInfo,
  mockProgram,
  mockSpeakers,
  mockStats,
} from "./mockData";
import {
  EventSettings,
  Participant,
  Partner,
  PracticalInfo,
  ProgramSession,
  Speaker,
} from "./types";

export async function getEventSettings(): Promise<EventSettings> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockEventSettings;
  const { data, error } = await supabase
    .from("event_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error || !data) return mockEventSettings;
  return data as EventSettings;
}

export async function getSpeakers(): Promise<Speaker[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockSpeakers;
  const { data, error } = await supabase
    .from("speakers")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  if (error || !data) return mockSpeakers;
  return data as Speaker[];
}

export async function getSpeaker(id: string): Promise<Speaker | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockSpeakers.find((s) => s.id === id) ?? null;
  const { data, error } = await supabase
    .from("speakers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data as Speaker | null;
}

export async function getPartners(): Promise<Partner[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockPartners;
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  if (error || !data) return mockPartners;
  return data as Partner[];
}

export async function getPartner(id: string): Promise<Partner | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockPartners.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data as Partner | null;
}

export async function getProgram(): Promise<ProgramSession[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockProgram;
  const { data, error } = await supabase
    .from("program_sessions")
    .select("*")
    .eq("is_visible", true)
    .order("date", { ascending: true })
    .order("display_order", { ascending: true });
  if (error || !data) return mockProgram;
  return data as ProgramSession[];
}

export async function getPracticalInfo(): Promise<PracticalInfo[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockPracticalInfo;
  const { data, error } = await supabase
    .from("practical_information")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  if (error || !data) return mockPracticalInfo;
  return data as PracticalInfo[];
}

export async function getPublicParticipants(): Promise<Participant[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockParticipants;
  // Explicit column list: phone + member_code are never readable by anon.
  const { data, error } = await supabase
    .from("participants")
    .select("id,name,city,organization,role,photo_url,is_public,created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error || !data) return mockParticipants;
  return data as Participant[];
}

export async function getStats() {
  const supabase = getSupabaseClient();
  if (!supabase) return mockStats;
  const [participants, posters, badges, partners] = await Promise.all([
    supabase.from("participants").select("id", { count: "exact", head: true }),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "poster_generated"),
    supabase.from("badges").select("id", { count: "exact", head: true }),
    supabase
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("is_visible", true),
  ]);
  return {
    participants: participants.count ?? mockStats.participants,
    posters: posters.count ?? mockStats.posters,
    badges: badges.count ?? mockStats.badges,
    partners: partners.count ?? mockStats.partners,
  };
}

export async function getBadgeByCode(code: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .eq("unique_code", code)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export { isSupabaseConfigured };
