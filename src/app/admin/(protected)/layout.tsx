"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import AdminShell from "@/components/admin/AdminShell";

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
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("ok");
      } else {
        router.replace("/admin");
      }
    });
    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/admin");
    });
    return () => listener.subscription.unsubscribe();
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

  return <AdminShell>{children}</AdminShell>;
}
