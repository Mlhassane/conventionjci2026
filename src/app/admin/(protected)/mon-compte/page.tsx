"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  KeyRoundIcon,
  LoaderIcon,
  MailIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/admin/ui/page-header";
import { TextField } from "@/components/admin/ui/form-fields";

const MIN_LENGTH = 8;

export default function AdminAccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(async ({ data }) => {
      const userEmail = data.user?.email ?? null;
      setEmail(userEmail);
      if (!userEmail) return;
      // Reprend le nom affiché et la date de dernière connexion.
      const { data: rows } = await supabase
        .from("participants")
        .select("name, last_login_at")
        .eq("auth_email", userEmail)
        .eq("is_admin", true)
        .limit(1)
        .maybeSingle();
      if (rows) {
        setAdminName((rows as { name: string }).name);
      }
    });
  }, []);

  function validate() {
    if (newPassword.length < MIN_LENGTH) {
      return `Le nouveau mot de passe doit contenir au moins ${MIN_LENGTH} caractères.`;
    }
    if (newPassword !== confirmPassword) {
      return "Les deux mots de passe ne correspondent pas.";
    }
    if (newPassword === currentPassword) {
      return "Le nouveau mot de passe doit être différent de l'ancien.";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }

    setSaving(true);
    setError(null);
    setDone(false);

    // Si un mot de passe existe déjà, on demande l'ancien pour confirmer
    // que c'est bien l'administrateur connecté qui le change.
    if (currentPassword && email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        setSaving(false);
        setError("Mot de passe actuel incorrect.");
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSaving(false);
    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("same")
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : "Modification impossible. Réessayez."
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setDone(true);
    toast.success("Mot de passe mis à jour", {
      description: "Il sert uniquement à la connexion par email.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mon compte"
        description="Gérez vos identifiants de connexion à la console d’administration."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-line/10 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundIcon className="h-4 w-4 text-muted-foreground" />
              Identité
            </CardTitle>
            <CardDescription>
              Ces informations sont celles utilisées pour votre accès administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="text-sm text-muted-foreground">Nom complet</span>
              <span className="text-sm font-medium text-foreground">
                {adminName ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MailIcon className="h-3.5 w-3.5" />
                Email
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {email ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Accès
              </span>
              <span className="text-sm font-medium text-success">Administrateur actif</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-line/10 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRoundIcon className="h-4 w-4 text-muted-foreground" />
              Mot de passe
            </CardTitle>
            <CardDescription>
              Utilisé pour la connexion par email. Votre connexion par
              nom&nbsp;+ code convention reste valable quel que soit ce mot de passe.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <TextField
                label="Mot de passe actuel"
                type="password"
                placeholder="••••••••"
                hint="Optionnel — uniquement si vous en avez déjà défini un."
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <TextField
                label="Nouveau mot de passe"
                type="password"
                required
                placeholder="••••••••"
                hint={`${MIN_LENGTH} caractères minimum.`}
                autoComplete="new-password"
                value={newPassword}
                onChange={setNewPassword}
              />
              <TextField
                label="Confirmer le nouveau mot de passe"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              {done && !error && (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2Icon className="h-4 w-4" />
                  Mot de passe enregistré.
                </p>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <LoaderIcon className="h-4 w-4 animate-spin" />}
                {saving ? "Enregistrement…" : "Enregistrer le mot de passe"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5 shadow-card">
        <CardHeader>
          <CardTitle className="text-base text-primary">Bon à savoir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Votre connexion principale reste le couple <strong>nom complet + code
            convention</strong> : le code ne change pas lorsque vous modifiez votre mot de
            passe.
          </p>
          <p>
            • En cas d’oubli du mot de passe, un administrateur peut le régénérer depuis
            <strong> Équipe admin</strong>.
          </p>
          <p>
            • Un administrateur ne peut pas être suspendu s’il est le dernier actif : la
            console reste toujours accessible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
