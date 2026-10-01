"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogInIcon, ShieldCheckIcon } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "code" | "email";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
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

  async function handleCodeSubmit(event: React.FormEvent) {
    event.preventDefault();
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

      // Le serveur a déjà échangé son jeton contre une session standard :
      // le navigateur ne fait que l'ouvrir (aucun mot de passe involved).
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 py-12 text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-blue/25 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-navy/30 blur-[100px]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <span className="inline-block rounded-2xl bg-white px-6 py-4 shadow-lift ring-2 ring-blue/30">
            <Image
              src="/logo.png"
              alt="Convention Nationale JCI Niger 2026"
              width={360}
              height={126}
              priority
              className="h-14 w-auto object-contain"
            />
          </span>
        </div>
        <p className="text-center text-xs uppercase tracking-wide2 text-blue">
          JCI Experience 2026
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold">Administration</h1>

        {!isSupabaseConfigured && (
          <p className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-center text-xs leading-relaxed text-paper/60">
            Supabase n&apos;est pas encore configuré sur cette instance. Ajoutez
            NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local, puis
            créez un utilisateur admin depuis Supabase Auth.
          </p>
        )}

        <Card className="mt-8 border-white/10 bg-white/5 shadow-lift backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-paper">
              <ShieldCheckIcon className="h-4 w-4 text-blue" />
              Accès réservé
            </CardTitle>
            <CardDescription className="text-paper/60">
              Connectez-vous avec votre code administrateur ou votre email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(value) => { setMode(value as Mode); setError(null); }}>
              <TabsList className="grid w-full grid-cols-2 bg-white/5">
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-blue data-[state=active]:text-ink"
                >
                  Code admin
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="data-[state=active]:bg-blue data-[state=active]:text-ink"
                >
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="mt-4">
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-paper/60">Nom complet</Label>
                    <Input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex : Nom Prénom"
                      autoComplete="name"
                      className="border-white/10 bg-white/5 text-paper placeholder:text-paper/30 focus-visible:ring-blue/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-paper/60">Code administrateur</Label>
                    <Input
                      required
                      value={adminCode}
                      onChange={(event) => setAdminCode(event.target.value.toUpperCase())}
                      placeholder="Ex : JCI-2026-XXXX"
                      autoComplete="off"
                      className="border-white/10 bg-white/5 font-mono uppercase text-paper placeholder:font-sans placeholder:normal-case placeholder:text-paper/30 focus-visible:ring-blue/30"
                    />
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogInIcon className="h-4 w-4" />
                    {loading ? "Connexion…" : "Accéder à l’administration"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="email" className="mt-4">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-paper/60">Email</Label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="border-white/10 bg-white/5 text-paper placeholder:text-paper/30 focus-visible:ring-blue/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-paper/60">Mot de passe</Label>
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="border-white/10 bg-white/5 text-paper focus-visible:ring-blue/30"
                    />
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogInIcon className="h-4 w-4" />
                    {loading ? "Connexion…" : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
