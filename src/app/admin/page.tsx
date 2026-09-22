"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(
        "Supabase n'est pas encore connecté. Ajoutez vos clés dans .env.local."
      );
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Identifiants incorrects. Réessayez.");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <main className="min-h-screen bg-ink text-paper flex items-center justify-center px-6 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 h-96 w-96 rounded-full bg-blue/25 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-navy/30 blur-[100px]"
      />

      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue text-ink font-serif text-sm font-semibold shadow-cta">
            JCI
          </span>
        </div>
        <p className="font-sans text-xs tracking-wide2 uppercase text-blue text-center">
          JCI Experience 2026
        </p>
        <h1 className="mt-3 font-serif text-3xl text-center">Administration</h1>

        {!isSupabaseConfigured && (
          <p className="mt-6 text-xs text-paper/50 text-center leading-relaxed">
            Supabase n&apos;est pas encore configuré sur cette instance. Ajoutez
            NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans
            .env.local, puis créez un utilisateur admin depuis Supabase Auth.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-xl2 border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
        >
          <div>
            <label className="block text-xs text-paper/60 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl2 bg-white/5 border border-white/10 p-3.5 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/20 transition-all placeholder:text-paper/30"
            />
          </div>
          <div>
            <label className="block text-xs text-paper/60 mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl2 bg-white/5 border border-white/10 p-3.5 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/20 transition-all"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
