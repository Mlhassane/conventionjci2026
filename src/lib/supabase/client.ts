import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// `isSupabaseConfigured` lets every page fall back to polished mock data
// during local preview or before the Supabase project is connected,
// instead of crashing the whole app.
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
      global: {
        // Never let Next.js Data Cache freeze Supabase responses —
        // admin edits must show up on the public site immediately.
        fetch: (input, init) =>
          fetch(input, { ...init, cache: "no-store" } as RequestInit),
      },
    });
  }
  return client;
}
