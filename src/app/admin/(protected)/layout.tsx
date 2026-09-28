"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import AdminShell from "@/components/admin/AdminShell";
import { AdminToaster } from "@/components/admin/ui/admin-toaster";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("denied");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("denied");
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/admin");
        return;
      }

      let isAdmin = false;
      const { data: userData } = await supabase.auth.getUser();
      const { data: rpcResult, error: rpcError } = await supabase.rpc("is_admin_user");

      if (!rpcError && typeof rpcResult === "boolean") {
        isAdmin = rpcResult;
      } else if (userData.user?.email) {
        // Backward-compatible fallback until the admin policy migration is
        // applied to the remote Supabase project.
        const { data: profile } = await supabase
          .from("participants")
          .select("is_admin")
          .eq("auth_email", userData.user.email)
          .eq("is_admin", true)
          .maybeSingle();
        isAdmin = Boolean(profile);
      }

      if (cancelled) return;
      if (isAdmin) setStatus("ok");
      else router.replace("/admin");
    })().catch(() => {
      if (!cancelled) router.replace("/admin");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/admin");
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-ink/50">Chargement…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="font-serif text-2xl">Supabase non connecté</p>
        <p className="mt-2 text-sm text-ink/55 max-w-sm">
          Ajoutez vos clés Supabase dans .env.local pour activer
          l&apos;authentification et le tableau de bord d&apos;administration.
        </p>
      </div>
    );
  }

  return (
    <>
      <AdminShell>{children}</AdminShell>
      <AdminToaster />
    </>
  );
}
