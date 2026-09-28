"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeOffIcon,
  MicIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import ImageUpload from "@/components/form/ImageUpload";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import { Speaker } from "@/lib/types";
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
import { EmptyState } from "@/components/admin/ui/empty-state";
import { TextAreaField, TextField } from "@/components/admin/ui/form-fields";
import { ListToolbar } from "@/components/admin/ui/list-toolbar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

const EMPTY: Partial<Speaker> = {
  name: "",
  position: "",
  organization: "",
  bio: "",
  photo_url: "",
  display_order: 0,
  is_visible: true,
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function AdminSpeakersPage() {
  const { rows, loading, error, create, update, remove } = useTable<Speaker>(
    "speakers",
    "display_order"
  );
  const [form, setForm] = useState<Partial<Speaker> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((speaker) =>
      [speaker.name, speaker.position, speaker.organization]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, search]);

  function openCreate() {
    setFormError(null);
    setForm(EMPTY);
  }

  function openEdit(speaker: Speaker) {
    setFormError(null);
    setForm(speaker);
  }

  async function handlePhotoFile(file: File) {
    setFormError(null);
    setUploading(true);
    const name = (form?.name ?? "speaker").trim().toLowerCase().replace(/\s+/g, "-");
    const url = await uploadAdminImage("speakers", name || "speaker", file);
    setUploading(false);
    if (!url) {
      setFormError("Échec de l’envoi de la photo. Réessayez.");
      return;
    }
    setForm((current) => (current ? { ...current, photo_url: url } : current));
  }

  async function handleSave() {
    if (!form || saving) return;
    const name = (form.name ?? "").trim();
    if (!name) {
      setFormError("Le nom est obligatoire.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload = { ...form, name };

    const ok = form.id
      ? await update(form.id, payload)
      : await create({ ...payload, display_order: rows.length });
    setSaving(false);

    if (!ok) {
      setFormError("Une erreur est survenue. Réessayez.");
      return;
    }
    setForm(null);
    toast.success(form.id ? "Intervenant mis à jour" : "Intervenant ajouté", {
      description: name,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Intervenants"
        description="Personnalités et experts qui s&apos;expriment pendant la Convention."
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            Ajouter un intervenant
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Intervenants" value={rows.length} icon={MicIcon} />
        <StatCard
          label="Publiés"
          value={rows.filter((speaker) => speaker.is_visible).length}
          icon={EyeIcon}
        />
        <StatCard
          label="Masqués"
          value={rows.filter((speaker) => !speaker.is_visible).length}
          icon={EyeOffIcon}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, poste, organisation…"
          count={filtered.length}
          total={rows.length}
        />
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={UsersIcon}
                title={rows.length === 0 ? "Aucun intervenant" : "Aucun résultat"}
                description={
                  rows.length === 0
                    ? "Ajoutez la première personnalité du programme."
                    : "Modifiez votre recherche pour trouver un intervenant."
                }
                action={
                  rows.length === 0 ? (
                    <Button size="sm" onClick={openCreate}>
                      <PlusIcon className="h-4 w-4" />
                      Ajouter un intervenant
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Intervenant</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((speaker) => (
                    <TableRow key={speaker.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {speaker.photo_url && (
                              <AvatarImage src={speaker.photo_url} alt={speaker.name} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {getInitials(speaker.name)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="truncate font-medium text-foreground">{speaker.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {speaker.position ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {speaker.organization ?? "—"}
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            speaker.is_visible
                              ? "border-success/40 text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {speaker.is_visible ? "Publié" : "Masqué"}
                        </UiBadge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          items={[
                            {
                              label: "Modifier",
                              icon: PencilIcon,
                              onSelect: () => openEdit(speaker),
                            },
                            {
                              label: speaker.is_visible ? "Masquer" : "Publier",
                              icon: speaker.is_visible ? EyeOffIcon : EyeIcon,
                              onSelect: () => {
                                update(speaker.id, { is_visible: !speaker.is_visible });
                                toast.success(
                                  speaker.is_visible ? "Intervenant masqué" : "Intervenant publié",
                                  { description: speaker.name }
                                );
                              },
                            },
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: async () => {
                                const ok = await remove(speaker.id);
                                if (ok) {
                                  toast.success("Intervenant supprimé", { description: speaker.name });
                                } else {
                                  toast.error("Suppression impossible");
                                }
                              },
                              confirm: {
                                title: `Supprimer ${speaker.name} ?`,
                                description: "Cette action est définitive.",
                                label: "Supprimer",
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

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "Modifier l’intervenant" : "Ajouter un intervenant"}
            </DialogTitle>
            <DialogDescription>
              Les informations apparaissent sur la page publique des intervenants.
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
              label="Poste / fonction"
              value={form?.position ?? ""}
              onChange={(value) => setForm({ ...form, position: value })}
            />
            <TextField
              label="Organisation"
              className="sm:col-span-2"
              value={form?.organization ?? ""}
              onChange={(value) => setForm({ ...form, organization: value })}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-ink/60">Photo</p>
            <div className="rounded-lg border border-line/10 bg-muted/40 p-3">
              <ImageUpload
                onFile={handlePhotoFile}
                currentUrl={form?.photo_url}
                error={uploading ? "Envoi en cours…" : null}
                shape="circle"
                label="Téléverser la photo"
                hint="JPG ou PNG carré recommandé, 8 Mo max"
              />
            </div>
          </div>

          <TextAreaField
            label="Biographie"
            value={form?.bio ?? ""}
            onChange={(value) => setForm({ ...form, bio: value })}
          />

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
