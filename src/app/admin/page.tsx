"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "email" | "code";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
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

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !adminCode.trim()) {
      setError("Veuillez saisir votre nom et votre code administrateur.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/code-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: adminCode.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Connexion impossible. Réessayez.");
        setLoading(false);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase n'est pas encore connecté.");
        setLoading(false);
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
      setLoading(false);
      if (sessionError) {
        setError("Session impossible. Réessayez.");
        return;
      }
      router.push("/admin/dashboard");
    } catch {
      setLoading(false);
      setError("Une erreur est survenue. Réessayez.");
    }
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
          <span className="inline-block rounded-2xl bg-white px-6 py-4 shadow-lift ring-2 ring-blue/30">
            <Image
              src="/logo.png"
              alt="Convention Nationale JCI Niger 2026"
              width={360}
              height={126}
              priority
              className="h-16 w-auto object-contain"
            />
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

        <div className="mt-8 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          {(["code", "email"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-full py-2 transition-colors ${
                mode === m
                  ? "bg-blue text-ink font-medium"
                  : "text-paper/60 hover:text-paper"
              }`}
            >
              {m === "code" ? "Code admin" : "Email"}
            </button>
          ))}
        </div>

        {mode === "code" ? (
          <form
            onSubmit={handleCodeSubmit}
            className="mt-4 space-y-4 rounded-xl2 border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <div>
              <label className="block text-xs text-paper/60 mb-1.5">
                Nom complet
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Hassane"
                autoComplete="name"
                className="w-full rounded-xl2 bg-white/5 border border-white/10 p-3.5 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/20 transition-all placeholder:text-paper/30"
              />
            </div>
            <div>
              <label className="block text-xs text-paper/60 mb-1.5">
                Code administrateur
              </label>
              <input
                required
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                placeholder="Ex : JCI-2026-ADMIN"
                autoComplete="off"
                className="w-full rounded-xl2 bg-white/5 border border-white/10 p-3.5 text-sm font-mono uppercase outline-none focus:border-blue focus:ring-4 focus:ring-blue/20 transition-all placeholder:text-paper/30"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
            >
              {loading ? "Connexion…" : "Accéder à l'administration"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleEmailSubmit}
            className="mt-4 space-y-4 rounded-xl2 border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
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
        )}
      </div>
    </main>
  );
}
