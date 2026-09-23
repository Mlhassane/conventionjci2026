"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getEspaceSession,
  participantLogin,
  saveEspaceSession,
} from "@/lib/espace";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function EspaceLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-canvas min-h-screen flex items-center justify-center">
          <p className="text-sm text-ink/50">Chargement…</p>
        </main>
      }
    >
      <EspaceLoginForm />
    </Suspense>
  );
}

function EspaceLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/espace/mon-espace";

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Already logged in? Revalidate the saved session, then dispatch by role.
  useEffect(() => {
    (async () => {
      const session = getEspaceSession();
      if (session) {
        const profile = await participantLogin(
          session.name,
          session.member_code
        );
        if (profile) {
          await dispatchByRole(profile.name, profile.member_code, profile.is_admin);
          return;
        }
      }
      setChecking(false);
    })();
  }, [router, next]);

  /**
   * Single entry point: verifies the credentials, then shows the right
   * section — administration for admins, participant espace for others.
   */
  async function dispatchByRole(
    displayName: string,
    memberCode: string,
    isAdmin: boolean
  ): Promise<boolean> {
    if (isAdmin) {
      const ok = await openAdminSession(displayName, memberCode);
      if (!ok) {
        setError(
          "Session administrateur impossible. Réessayez ou contactez l'organisation."
        );
        return false;
      }
      // Auth session (admin section) + espace session (badge/visuel) both set.
      saveEspaceSession({ name: displayName, member_code: memberCode });
      router.push(next);
      return true;
    }
    saveEspaceSession({ name: displayName, member_code: memberCode });
    router.push(next);
    return true;
  }

  async function openAdminSession(
    displayName: string,
    memberCode: string
  ): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/code-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, code: memberCode }),
      });
      if (!res.ok) return false;
      const payload = await res.json();
      const supabase = getSupabaseClient();
      if (!supabase) return false;
      const { error } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
      return !error;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !name.trim()) {
      setError("Veuillez saisir votre code convention et votre nom complet.");
      return;
    }
    setLoading(true);
    const profile = await participantLogin(name, code);
    if (!profile) {
      setLoading(false);
      setError(
        "Code ou nom incorrect. Vérifiez le code remis par l'organisation après votre inscription."
      );
      return;
    }
    const ok = await dispatchByRole(
      profile.name,
      profile.member_code,
      profile.is_admin
    );
    setLoading(false);
    if (!ok) return;
  }

  if (checking) {
    return (
      <main className="bg-canvas min-h-screen flex items-center justify-center">
        <p className="text-sm text-ink/50">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="bg-canvas min-h-screen">
      <div className="container-edge py-10 md:py-16 max-w-md mx-auto pb-28 lg:pb-16">
        <p className="eyebrow">Espace participant</p>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl text-balance">
          Accédez à votre espace
        </h1>
        <p className="mt-2 text-ink/60 font-sans text-sm leading-relaxed">
          Connectez-vous avec votre <strong>code convention unique</strong>{" "}
          (reçu après votre inscription) et votre{" "}
          <strong>nom complet</strong>. Vous serez dirigé vers votre espace
          participant — ou vers l&apos;administration si vous êtes
          administrateur.
        </p>

        {!isSupabaseConfigured ? (
          <div className="mt-8 card p-6 shadow-card">
            <p className="text-sm text-ink/60">
              La connexion n&apos;est pas encore configurée sur cette instance.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 card p-6 md:p-8 shadow-card space-y-5"
          >
            {error && (
              <div className="rounded-xl2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Code convention
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex : JCI-2026-A7X2"
                autoComplete="off"
                className="input font-mono uppercase"
              />
              <p className="mt-1.5 text-xs text-ink/45">
                Demandez votre code à l&apos;organisation si vous l&apos;avez perdu.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom complet
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Mariama Souley"
                autoComplete="name"
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg btn-block"
            >
              {loading ? "Connexion…" : "Accéder à mon espace"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
