"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  LockIcon,
  MailIcon,
  PauseCircleIcon,
  PencilIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserCogIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { generateMemberCode } from "@/lib/participants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { SelectField, TextField } from "@/components/admin/ui/form-fields";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

type AdminAccount = {
  id: string;
  name: string;
  auth_email: string | null;
  member_code: string | null;
  admin_role: string | null;
  admin_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

type AdminCandidate = {
  id: string;
  name: string;
  city: string | null;
  organization: string | null;
  role: string | null;
  photo_url: string | null;
  member_code: string | null;
};

const ROLES = ["Super admin", "Admin", "Admin badges", "Admin contenu", "Admin participants"];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "AD"
  );
}

export default function AdminTeamPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: string; code: string } | null>(
    null
  );
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [selected, setSelected] = useState<AdminCandidate | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ name: string; code: string; email: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!supabase || !token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Chargement impossible");
        setAdmins([]);
      } else {
        setAdmins((payload.admins ?? []) as AdminAccount[]);
      }
    } catch {
      toast.error("Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getSupabaseClient()
      ?.auth.getUser()
      .then(({ data }) => {
        setCurrentId(data.user ? findIdByEmail(admins, data.user.email) : null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admins]);

  useEffect(() => {
    load();
  }, [load]);

  // Recherche des participants déjà inscrits, promotions possibles.
  useEffect(() => {
    if (mode !== "existing") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const query = supabase
        .from("participants")
        .select("id, name, city, organization, role, photo_url, member_code")
        .eq("is_admin", false)
        .order("name", { ascending: true })
        .limit(8);
      const { data } = search.trim()
        ? await query.ilike("name", `%${search.trim()}%`)
        : await query;
      if (!cancelled) setCandidates((data ?? []) as AdminCandidate[]);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, search]);

  async function mutate(
    input: Omit<RequestInit, "method"> & { method: string; url?: string }
  ): Promise<boolean> {
    const supabase = getSupabaseClient();
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!supabase || !token) {
      toast.error("Session expirée. Reconnectez-vous.");
      return false;
    }
    try {
      const { url: target, ...init } = input;
      const res = await fetch(target ?? "/api/admin/admins", {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(input.headers ?? {}),
        },
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Action impossible");
        return false;
      }
      return true;
    } catch {
      toast.error("Action impossible");
      return false;
    }
  }

  async function handleCreateWithResult() {
    if (!form) return;
    if (mode === "existing" && !selected) {
      setFormError("Choisissez un participant dans la liste.");
      return;
    }
    if (!form.email.trim()) {
      setFormError("L'email de connexion est obligatoire.");
      return;
    }
    if (mode === "new" && !form.name.trim()) {
      setFormError("Le nom est obligatoire.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const supabase = getSupabaseClient();
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!supabase || !token) {
      setSaving(false);
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          participantId: mode === "existing" ? selected?.id : undefined,
          name: form.name.trim() || selected?.name,
          email: form.email.trim(),
          role: form.role,
          code: form.code.trim() || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setFormError(payload.error ?? "Impossible d'ajouter cet administrateur.");
        setSaving(false);
        return;
      }
      setInvite({
        name: form.name.trim() || selected?.name || "",
        email: form.email.trim(),
        code: payload.code as string,
      });
      setForm(null);
      setSelected(null);
      setSearch("");
      setSaving(false);
      await load();
    } catch {
      setFormError("Action impossible");
      setSaving(false);
    }
  }

  async function handleUpdate(
    admin: AdminAccount,
    patch: Record<string, unknown>
  ): Promise<boolean> {
    const ok = await mutate({
      method: "PATCH",
      body: JSON.stringify({ id: admin.id, ...patch }),
    });
    if (!ok) return false;
    await load();
    return true;
  }

  async function handleRevoke(admin: AdminAccount) {
    const ok = await mutate({
      method: "DELETE",
      url: `/api/admin/admins?id=${encodeURIComponent(admin.id)}`,
    });
    if (!ok) return;
    await load();
    toast.success("Accès retiré", { description: admin.name });
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success("Code copié", { description: code });
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Copie impossible");
    }
  }

  const stats = useMemo(
    () => ({
      total: admins.length,
      active: admins.filter((admin) => admin.admin_active).length,
      suspended: admins.filter((admin) => !admin.admin_active).length,
      neverLogged: admins.filter((admin) => !admin.last_login_at).length,
    }),
    [admins]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Équipe admin"
        description="Ajoutez des administrateurs et pilotez leurs accès à la console. Chaque personne se connecte avec son nom et son code convention."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setMode("existing");
              setSelected(null);
              setSearch("");
              setForm({ name: "", email: "", role: "Admin", code: "" });
            }}
          >
            <UserPlusIcon className="h-4 w-4" />
            Ajouter un administrateur
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Administrateurs" value={stats.total} icon={UsersIcon} />
        <StatCard label="Accès actifs" value={stats.active} icon={ShieldCheckIcon} />
        <StatCard label="Suspendus" value={stats.suspended} icon={PauseCircleIcon} />
        <StatCard label="Jamais connecté" value={stats.neverLogged} icon={KeyRoundIcon} />
      </div>

      <Card className="border-line/10 bg-gradient-to-t from-primary/5 to-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockIcon className="h-4 w-4 text-muted-foreground" />
            Comment fonctionne l’accès
          </CardTitle>
          <CardDescription>
            Un accès administrateur est la combinaison d’un email lié, d’un code convention
            unique et d’un statut actif. Le code est la preuve d’accès : transmettez-le à la
            personne concernée, il ne doit jamais être publié.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <p>
            <span className="font-medium text-foreground">1. Création</span> — l’admin est
            ajouté ici avec son email et son rôle.
          </p>
          <p>
            <span className="font-medium text-foreground">2. Connexion</span> — la personne saisit
            son nom complet et son code sur /admin.
          </p>
          <p>
            <span className="font-medium text-foreground">3. Révocation</span> — suspendre ou
            retirer l’accès coupe immédiatement la console.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={5} rows={4} />
          ) : admins.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={UserCogIcon}
                title="Aucun administrateur"
                description="Ajoutez la première personne qui vous accompagnera dans la gestion de la Convention."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Administrateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Code convention</TableHead>
                    <TableHead>Dernier accès</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {initials(admin.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {admin.name}
                              {admin.id === currentId && (
                                <span className="ml-2 text-[11px] text-muted-foreground">
                                  (vous)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {admin.auth_email ?? "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <UiBadge variant="secondary">{admin.admin_role ?? "Admin"}</UiBadge>
                      </TableCell>
                      <TableCell>
                        {admin.member_code ? (
                          <button
                            onClick={() => copyCode(admin.member_code as string)}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground hover:bg-accent"
                          >
                            {copied === admin.member_code ? (
                              <CheckIcon className="h-3 w-3 text-success" />
                            ) : (
                              <CopyIcon className="h-3 w-3" />
                            )}
                            {admin.member_code}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {admin.last_login_at
                          ? new Date(admin.last_login_at).toLocaleString("fr-FR")
                          : "Jamais connecté"}
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            admin.admin_active
                              ? "border-success/40 text-success"
                              : "border-destructive/40 text-destructive"
                          }
                        >
                          {admin.admin_active ? "Actif" : "Suspendu"}
                        </UiBadge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          items={[
                            {
                              label: "Modifier le rôle",
                              icon: PencilIcon,
                              onSelect: () => {
                                setFormError(null);
                                setEditing(admin);
                              },
                            },
                            {
                              label: "Régénérer le code",
                              icon: RefreshCwIcon,
                              onSelect: () => handleUpdate(admin, { regenerateCode: true }),
                            },
                            {
                              label: admin.admin_active ? "Suspendre l’accès" : "Réactiver l’accès",
                              icon: admin.admin_active ? PauseCircleIcon : PlayCircleIcon,
                              onSelect: () =>
                                handleUpdate(admin, { active: !admin.admin_active }),
                              confirm: admin.admin_active
                                ? {
                                    title: `Suspendre l’accès de ${admin.name} ?`,
                                    description:
                                      "La personne ne pourra plus se connecter à la console tant que l’accès n’est pas réactivé.",
                                    label: "Suspendre",
                                  }
                                : undefined,
                            },
                            {
                              label: "Retirer l’accès",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: () => handleRevoke(admin),
                              confirm: {
                                title: `Retirer l’accès de ${admin.name} ?`,
                                description:
                                  "Le compte de connexion est supprimé. Le dernier administrateur actif ne peut pas être retiré.",
                                label: "Retirer l’accès",
                              },
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Ajout ---------------- */}
      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un administrateur</DialogTitle>
            <DialogDescription>
              Promouvez un participant déjà inscrit ou créez une nouvelle fiche. Un compte de
              connexion et un code convention sont générés.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={mode} onValueChange={(value) => { setMode(value as "existing" | "new"); setFormError(null); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Participant existant</TabsTrigger>
              <TabsTrigger value="new">Nouvelle personne</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="mt-4 space-y-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un participant par nom…"
                aria-label="Rechercher un participant"
              />
              {candidates.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aucun participant trouvé. Vérifiez la recherche ou créez une nouvelle personne.
                </p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {candidates.map((candidate) => {
                    const active = selected?.id === candidate.id;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setSelected(candidate);
                          setFormError(null);
                          setForm((f) => (f ? { ...f, email: "" } : f));
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          active
                            ? "border-primary bg-primary/5"
                            : "border-line/10 hover:bg-muted"
                        }`}
                      >
                        <Avatar className="h-9 w-9">
                          {candidate.photo_url && (
                            <AvatarImage src={candidate.photo_url} alt={candidate.name} />
                          )}
                          <AvatarFallback className="bg-muted text-xs">
                            {initials(candidate.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {candidate.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {[candidate.organization, candidate.city, candidate.role]
                              .filter(Boolean)
                              .join(" · ") || "Fiche sans détail"}
                          </span>
                        </span>
                        {active && <CheckIcon className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {selected && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {selected.name} sera promu administrateur et masqué de l&apos;annuaire
                  public. Son code actuel est conservé
                  {selected.member_code ? ` (${selected.member_code}).` : " (un code sera généré)."}
                </p>
              )}
            </TabsContent>

            <TabsContent value="new" className="mt-4">
              <TextField
                label="Nom complet"
                required
                value={form?.name ?? ""}
                onChange={(value) => setForm({ ...form!, name: value })}
              />
            </TabsContent>
          </Tabs>

          <div className="grid gap-4">
            <TextField
              label="Email de connexion"
              type="email"
              required
              placeholder="prenom.nom@jci-niger.org"
              hint="Sert à lier le compte : la connexion se fait avec le nom et le code."
              value={form?.email ?? ""}
              onChange={(value) => setForm({ ...form!, email: value })}
            />
            <SelectField
              label="Rôle"
              value={form?.role ?? "Admin"}
              onChange={(value) => setForm({ ...form!, role: value })}
              options={ROLES.map((role) => ({ value: role, label: role }))}
              hint="Informationnel : tous les administrateurs ont les mêmes droits sur la console."
            />
            <TextField
              label="Code convention"
              placeholder={generateMemberCode()}
              hint="Laissez vide pour générer un code automatiquement."
              value={form?.code ?? ""}
              onChange={(value) => setForm({ ...form!, code: value.toUpperCase() })}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateWithResult}
              disabled={saving || (mode === "existing" && !selected)}
            >
              <UserPlusIcon className="h-4 w-4" />
              {saving
                ? "Création…"
                : mode === "existing"
                  ? "Donner les accès"
                  : "Créer l’accès"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Modification du rôle ---------------- */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rôle de {editing?.name}</DialogTitle>
            <DialogDescription>
              Sert à repérer qui gère quoi dans l’équipe d’organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <TextField
              label="Nom affiché"
              value={editing?.name ?? ""}
              onChange={(value) => setEditing({ ...editing!, name: value })}
            />
            <SelectField
              label="Rôle"
              value={editing?.admin_role ?? "Admin"}
              onChange={(value) => setEditing({ ...editing!, admin_role: value })}
              options={ROLES.map((role) => ({ value: role, label: role }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Annuler
            </Button>
            <Button
              disabled={saving}
              onClick={async () => {
                if (!editing) return;
                setSaving(true);
                const ok = await handleUpdate(editing, {
                  name: editing.name,
                  role: editing.admin_role,
                });
                setSaving(false);
                if (ok) {
                  setEditing(null);
                  toast.success("Administrateur mis à jour");
                }
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Invitation ---------------- */}
      <Dialog open={Boolean(invite)} onOpenChange={(open) => !open && setInvite(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accès créé pour {invite?.name}</DialogTitle>
            <DialogDescription>
              Communiquez ces informations à la personne : elle se connecte sur /admin avec son
              nom complet et ce code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-line/10 bg-muted/50 px-3 py-2">
              <MailIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{invite?.email}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <KeyRoundIcon className="h-4 w-4 text-primary" />
              <code className="font-mono text-sm font-semibold">{invite?.code}</code>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => invite && copyCode(invite.code)}
              >
                {copied === invite?.code ? (
                  <CheckIcon className="h-4 w-4 text-success" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
                Copier
              </Button>
            </div>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <TriangleAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Ce code donne un accès complet à la console : transmettez-le en privé. Vous
              pourrez le régénérer à tout moment.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setInvite(null)}>Terminé</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Retrouve l'id de l'administrateur connecté à partir de son email. */
function findIdByEmail(admins: AdminAccount[], email?: string | null) {
  if (!email) return null;
  const match = admins.find(
    (admin) => (admin.auth_email ?? "").toLowerCase() === email.toLowerCase()
  );
  return match?.id ?? null;
}
