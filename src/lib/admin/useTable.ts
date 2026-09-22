"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function useTable<T extends { id: string }>(
  table: string,
  orderBy: string = "created_at"
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending: true });
    if (fetchError) {
      setError("Une erreur est survenue. Réessayez.");
    } else {
      setRows((data as T[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [table, orderBy]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function create(values: Partial<T>) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error: insertError } = await supabase.from(table).insert(values as never);
    if (insertError) {
      setError("Une erreur est survenue. Réessayez.");
      return false;
    }
    await refresh();
    return true;
  }

  async function update(id: string, values: Partial<T>) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error: updateError } = await supabase
      .from(table)
      .update(values as never)
      .eq("id", id);
    if (updateError) {
      setError("Une erreur est survenue. Réessayez.");
      return false;
    }
    await refresh();
    return true;
  }

  async function remove(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
    if (deleteError) {
      setError("Une erreur est survenue. Réessayez.");
      return false;
    }
    await refresh();
    return true;
  }

  return { rows, loading, error, refresh, create, update, remove };
}
