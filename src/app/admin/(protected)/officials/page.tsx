"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import ImageUpload from "@/components/form/ImageUpload";
import { Official } from "@/lib/types";
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
import { TextField } from "@/components/admin/ui/form-fields";
import { ListToolbar } from "@/components/admin/ui/list-toolbar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

const EMPTY: Partial<Official> = {
  name: "",
  title: "",
  organization: "",
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

export default function AdminOfficialsPage() {
  const { rows, loading, error, create, update, remove } = useTable<Official>(
    "officials",
    "display_order"
  );
  const [form, setForm] = useState<Partial<Official> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((official) =>
      [official.name, official.title, official.organization]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, search]);

  function openCreate() {
    setFormError(null);
    setForm(EMPTY);
  }

  async function handlePhotoFile(file: File) {
    setFormError(null);
    setUploading(true);
    const name = (form?.name ?? "official").trim().toLowerCase().replace(/\s+/g, "-");
    const url = await uploadAdminImage("branding", `officials/${name || "official"}`, file);
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
    const ok = form.id
      ? await update(form.id, { ...form, name, display_order: form.display_order ?? rows.length })
      : await create({ ...form, name, display_order: rows.length });
    setSaving(false);

    if (!ok) {
      setFormError("Une erreur est survenue. Réessayez.");
      return;
    }
    setForm(null);
    toast.success(form.id ? "Officiel mis à jour" : "Officiel ajouté", { description: name });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Officiels de l’événement"
        description="Comité d’organisation, parrains et autorités — affichés sur la page Infos pratiques."
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            Ajouter un officiel
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Officiels" value={rows.length} icon={ShieldCheckIcon} />
        <StatCard
          label="Publiés"
          value={rows.filter((official) => official.is_visible).length}
          icon={EyeIcon}
        />
        <StatCard
          label="Masqués"
          value={rows.filter((official) => !official.is_visible).length}
          icon={EyeOffIcon}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, fonction, organisation…"
          count={filtered.length}
          total={rows.length}
        />
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={ShieldCheckIcon}
                title={rows.length === 0 ? "Aucun officiel" : "Aucun résultat"}
                description={
                  rows.length === 0
                    ? "Ajoutez le premier membre du comité d’organisation."
                    : "Modifiez votre recherche pour trouver un officiel."
                }
                action={
                  rows.length === 0 ? (
                    <Button size="sm" onClick={openCreate}>
                      <PlusIcon className="h-4 w-4" />
                      Ajouter un officiel
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
                    <TableHead className="pl-6">Officiel</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((official) => (
                    <TableRow key={official.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {official.photo_url && (
                              <AvatarImage src={official.photo_url} alt={official.name} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {getInitials(official.name)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="truncate font-medium text-foreground">{official.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {official.title ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {official.organization ?? "—"}
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            official.is_visible
                              ? "border-success/40 text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {official.is_visible ? "Publié" : "Masqué"}
                        </UiBadge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          items={[
                            {
                              label: "Modifier",
                              icon: PencilIcon,
                              onSelect: () => {
                                setFormError(null);
                                setForm(official);
                              },
                            },
                            {
                              label: official.is_visible ? "Masquer" : "Publier",
                              icon: official.is_visible ? EyeOffIcon : EyeIcon,
                              onSelect: () => {
                                update(official.id, { is_visible: !official.is_visible });
                                toast.success(
                                  official.is_visible ? "Officiel masqué" : "Officiel publié",
                                  { description: official.name }
                                );
                              },
                            },
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: async () => {
                                const ok = await remove(official.id);
                                if (ok) {
                                  toast.success("Officiel supprimé", { description: official.name });
                                } else {
                                  toast.error("Suppression impossible");
                                }
                              },
                              confirm: {
                                title: `Supprimer ${official.name} ?`,
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
            <DialogTitle>{form?.id ? "Modifier l’officiel" : "Ajouter un officiel"}</DialogTitle>
            <DialogDescription>
              Ces profils sont visibles sur la page Infos pratiques du site.
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
              label="Fonction / titre"
              value={form?.title ?? ""}
              onChange={(value) => setForm({ ...form, title: value })}
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
                hint="JPG ou PNG, 8 Mo max"
              />
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
