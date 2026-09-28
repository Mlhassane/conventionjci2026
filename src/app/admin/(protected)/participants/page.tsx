"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  CopyIcon,
  IdCardIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import { getSupabaseClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/form/ImageUpload";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import { Badge, Participant } from "@/lib/types";
import { generateMemberCode, normalizePhone } from "@/lib/participants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { SelectField, TextField } from "@/components/admin/ui/form-fields";
import { ListToolbar } from "@/components/admin/ui/list-toolbar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

const ROLES = [
  "Participant",
  "Délégué",
  "Membre JCI",
  "Invité",
  "Speaker",
  "Organisateur",
  "Partenaire",
  "Média",
  "Bénévole",
];

const EMPTY: Partial<Participant> = {
  name: "",
  phone: "",
  city: "",
  organization: "",
  role: "Participant",
  photo_url: "",
  is_public: true,
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function AdminParticipantsPage() {
  const { rows, loading, error, create, update, remove, refresh } =
    useTable<Participant>("participants", "created_at");
  const { rows: badges } = useTable<Badge>("badges", "created_at");
  const [form, setForm] = useState<Partial<Participant> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const badgeByParticipant = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const badge of badges) {
      if (badge.participant_id && !map.has(badge.participant_id)) {
        map.set(badge.participant_id, badge);
      }
    }
    return map;
  }, [badges]);

  const missingCodes = useMemo(
    () => rows.filter((participant) => !participant.is_admin && !participant.member_code),
    [rows]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((participant) =>
      [
        participant.name,
        participant.phone,
        participant.member_code,
        participant.organization,
        participant.city,
        participant.role,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, search]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copié", { description: code });
    } catch {
      toast.error("Copie impossible", { description: "Le presse-papiers est bloqué." });
    }
  }

  async function assignCode(participantId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { error: updateError } = await supabase
        .from("participants")
        .update({ member_code: generateMemberCode() })
        .eq("id", participantId);
      if (!updateError) return true;
    }
    return false;
  }

  async function handleGenerateCode(participant: Participant) {
    setCodeError(null);
    const ok = await assignCode(participant.id);
    await refresh();
    if (ok) {
      toast.success("Code attribué", { description: participant.name });
    } else {
      setCodeError(`Impossible de générer un code pour ${participant.name}.`);
    }
  }

  async function handleGenerateAllCodes() {
    if (missingCodes.length === 0) return;
    setCodeError(null);
    let failed = 0;
    for (const participant of missingCodes) {
      if (!(await assignCode(participant.id))) failed += 1;
    }
    await refresh();
    if (failed > 0) {
      setCodeError(`${failed} code(s) n'ont pas pu être générés. Réessayez.`);
    } else {
      toast.success(`${missingCodes.length} code(s) attribué(s)`);
    }
  }

  async function handlePhotoFile(file: File) {
    setFormError(null);
    setUploading(true);
    const prefix =
      (form?.name ?? "").trim().toLowerCase().replace(/\s+/g, "-") ||
      form?.id ||
      "participant";
    const url = await uploadAdminImage("photos", `admin/${prefix}`, file);
    setUploading(false);
    if (!url) {
      setFormError("Échec de l’envoi de la photo. Réessayez.");
      return;
    }
    setForm((current) => (current ? { ...current, photo_url: url } : current));
  }

  async function handleSave() {
    if (!form) return;
    if (!form.name?.trim()) {
      setFormError("Le nom complet est requis.");
      return;
    }
    const phone = normalizePhone(form.phone ?? "");
    if (!phone || phone.replace(/\D/g, "").length < 8) {
      setFormError("Numéro de téléphone invalide (ex : 90 00 00 00).");
      return;
    }

    setSaving(true);
    setFormError(null);
    const supabase = getSupabaseClient();

    if (form.id) {
      const { data: clash } = await supabase
        ?.from("participants")
        .select("id")
        .eq("phone", phone)
        .neq("id", form.id)
        .limit(1);
      if (clash && clash.length > 0) {
        setFormError("Ce numéro est déjà utilisé par un autre participant.");
        setSaving(false);
        return;
      }
      const ok = await update(form.id, {
        name: form.name.trim(),
        phone,
        city: form.city?.trim() || null,
        organization: form.organization?.trim() || null,
        role: form.role || "Participant",
        photo_url: form.photo_url?.trim() || null,
        is_public: form.is_public ?? true,
      });
      setSaving(false);
      if (ok) {
        setForm(null);
        toast.success("Participant mis à jour", { description: form.name.trim() });
      } else {
        setFormError("Une erreur est survenue. Réessayez.");
      }
      return;
    }

    const { data: existing } = await supabase
      ?.from("participants")
      .select("id")
      .eq("phone", phone)
      .limit(1);
    if (existing && existing.length > 0) {
      setFormError("Ce numéro est déjà enregistré.");
      setSaving(false);
      return;
    }

    let created = false;
    for (let attempt = 0; attempt < 4 && !created; attempt++) {
      created = await create({
        name: form.name.trim(),
        phone,
        member_code: generateMemberCode(),
        city: form.city?.trim() || null,
        organization: form.organization?.trim() || null,
        role: form.role || "Participant",
        photo_url: form.photo_url?.trim() || null,
        is_public: form.is_public ?? true,
      });
    }
    setSaving(false);
    if (created) {
      setForm(null);
      toast.success("Participant inscrit", { description: form.name.trim() });
    } else {
      setFormError("Une erreur est survenue. Réessayez.");
    }
  }

  async function handleDelete(participant: Participant) {
    const ok = await remove(participant.id);
    if (ok) {
      toast.success("Participant supprimé", { description: participant.name });
    } else {
      toast.error("Suppression impossible");
    }
  }

  const formName = (form?.name ?? "").trim();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Participants"
        description="Inscription après paiement : téléphone, photo et code unique généré automatiquement."
        actions={
          <>
            {missingCodes.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleGenerateAllCodes}>
                <IdCardIcon className="h-4 w-4" />
                Attribuer {missingCodes.length} code(s)
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setForm(EMPTY);
                setFormError(null);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Inscrire un participant
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Participants"
          value={rows.length}
          icon={UsersIcon}
          hint="Inscriptions enregistrées"
        />
        <StatCard
          label="Avec code"
          value={rows.filter((participant) => participant.member_code).length}
          hint="Code convention attribué"
        />
        <StatCard
          label="Badge généré"
          value={rows.filter((participant) => badgeByParticipant.has(participant.id)).length}
          icon={IdCardIcon}
        />
        <StatCard
          label="Publics"
          value={rows.filter((participant) => participant.is_public).length}
          icon={SparklesIcon}
          hint="Visibles sur le site"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {codeError && <p className="text-sm text-destructive">{codeError}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, téléphone, code, ville…"
          count={filtered.length}
          total={rows.length}
        />
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={5} rows={6} />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={UserRoundIcon}
                title={rows.length === 0 ? "Aucun participant inscrit" : "Aucun résultat"}
                description={
                  rows.length === 0
                    ? "Inscrivez le premier participant de la Convention."
                    : "Modifiez votre recherche pour trouver un participant."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Participant</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Organisation · Ville</TableHead>
                    <TableHead>Statuts</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((participant) => {
                    const hasBadge = badgeByParticipant.has(participant.id);
                    return (
                      <TableRow key={participant.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {participant.photo_url && (
                                <AvatarImage
                                  src={participant.photo_url}
                                  alt={participant.name}
                                />
                              )}
                              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                {getInitials(participant.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {participant.name}
                              </p>
                              {participant.member_code ? (
                                <button
                                  onClick={() => copyCode(participant.member_code as string)}
                                  className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                                >
                                  <CopyIcon className="h-3 w-3" />
                                  {participant.member_code}
                                </button>
                              ) : participant.is_admin ? (
                                <p className="text-[11px] text-muted-foreground">
                                  Administrateur
                                </p>
                              ) : (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-[11px]"
                                  onClick={() => handleGenerateCode(participant)}
                                >
                                  Générer le code
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {participant.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <UiBadge variant="secondary">{participant.role ?? "—"}</UiBadge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {[participant.organization, participant.city]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {hasBadge ? (
                              <UiBadge className="bg-success/10 text-success hover:bg-success/10">
                                <CheckIcon className="h-3 w-3" />
                                Badge
                              </UiBadge>
                            ) : (
                              <UiBadge variant="outline">Badge en attente</UiBadge>
                            )}
                            <UiBadge
                              variant="outline"
                              className={
                                participant.is_public
                                  ? "border-success/40 text-success"
                                  : "text-muted-foreground"
                              }
                            >
                              {participant.is_public ? "Public" : "Masqué"}
                            </UiBadge>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <RowActions
                            items={[
                              {
                                label: "Modifier",
                                icon: PencilIcon,
                                onSelect: () => {
                                  setFormError(null);
                                  setForm(participant);
                                },
                              },
                              {
                                label: participant.is_public
                                  ? "Masquer de la page publique"
                                  : "Rendre public",
                                icon: UserRoundIcon,
                                onSelect: () => {
                                  update(participant.id, { is_public: !participant.is_public });
                                  toast.success(
                                    participant.is_public
                                      ? "Participant masqué"
                                      : "Participant rendu public",
                                    { description: participant.name }
                                  );
                                },
                              },
                              {
                                label: "Supprimer",
                                icon: Trash2Icon,
                                tone: "destructive",
                                onSelect: () => handleDelete(participant),
                                confirm: {
                                  title: `Supprimer ${participant.name} ?`,
                                  description:
                                    "Le participant et son code convention seront définitivement supprimés.",
                                  label: "Supprimer",
                                },
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Modifier le participant" : "Inscrire un participant"}</DialogTitle>
            <DialogDescription>
              Le code convention est généré automatiquement à l&apos;inscription.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nom complet"
              required
              value={form?.name ?? ""}
              onChange={(value) => setForm({ ...form, name: value })}
            />
            <TextField
              label="Téléphone"
              required
              inputMode="tel"
              placeholder="90 00 00 00"
              value={form?.phone ?? ""}
              onChange={(value) => setForm({ ...form, phone: value })}
            />
            <TextField
              label="Ville"
              value={form?.city ?? ""}
              onChange={(value) => setForm({ ...form, city: value })}
            />
            <TextField
              label="Organisation / Local JCI"
              value={form?.organization ?? ""}
              onChange={(value) => setForm({ ...form, organization: value })}
            />
            <SelectField
              label="Rôle"
              className="sm:col-span-2"
              value={(form?.role as string) ?? "Participant"}
              onChange={(value) => setForm({ ...form, role: value })}
              options={ROLES.map((role) => ({ value: role, label: role }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs text-ink/60">Photo — badge & annuaire</p>
              <div className="rounded-lg border border-line/10 bg-muted/40 p-3">
                <ImageUpload
                  onFile={handlePhotoFile}
                  currentUrl={form?.photo_url}
                  error={uploading ? "Envoi en cours…" : null}
                  shape="circle"
                  label="Téléverser la photo"
                  hint="JPG ou PNG, 8 Mo max"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm">
                <Switch
                  checked={form?.is_public ?? true}
                  onCheckedChange={(checked) => setForm({ ...form, is_public: checked })}
                />
                Visible sur la page participants publique
              </label>
            </div>

            <div className="rounded-lg border border-line/10 bg-muted/40 p-4">
              <p className="mb-3 text-[11px] uppercase tracking-wide2 text-ink/40">
                Aperçu participant
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {form?.photo_url && <AvatarImage src={form.photo_url} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-lg text-primary">
                    {formName ? getInitials(formName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold leading-tight text-foreground">
                    {(form?.name ?? "").trim() || "Nom du participant"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[form?.role, form?.organization, form?.city]
                      .filter(Boolean)
                      .join(" · ") || "Rôle · Organisation · Ville"}
                  </p>
                  {form?.member_code && (
                    <p className="mt-2 inline-block rounded-md bg-ink px-2 py-0.5 font-mono text-[11px] text-blue">
                      {form.member_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving || uploading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
