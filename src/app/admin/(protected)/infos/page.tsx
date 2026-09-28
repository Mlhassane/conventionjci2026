"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  MapPinnedIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import { PracticalInfo, PracticalInfoSection } from "@/lib/types";
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
import { SelectField, TextAreaField, TextField } from "@/components/admin/ui/form-fields";
import { ListToolbar } from "@/components/admin/ui/list-toolbar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

const SECTIONS: PracticalInfoSection[] = [
  "Lieu",
  "Localisation",
  "Hébergement",
  "Transport",
  "Restauration",
  "Contacts utiles",
  "Informations importantes",
];

const EMPTY: Partial<PracticalInfo> = {
  section: "Lieu",
  title: "",
  content: "",
  map_url: "",
  display_order: 0,
  is_visible: true,
};

export default function AdminInfosPage() {
  const { rows, loading, error, create, update, remove } = useTable<PracticalInfo>(
    "practical_information",
    "display_order"
  );
  const [form, setForm] = useState<Partial<PracticalInfo> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((info) =>
      [info.title, info.content, info.section]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, search]);

  function openCreate() {
    setFormError(null);
    setForm(EMPTY);
  }

  async function handleSave() {
    if (!form || saving) return;
    if (!form.title?.trim() || !form.content?.trim()) {
      setFormError("Le titre et le contenu sont obligatoires.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const ok = form.id
      ? await update(form.id, form)
      : await create({ ...form, display_order: rows.length });
    setSaving(false);

    if (!ok) {
      setFormError("Une erreur est survenue. Réessayez.");
      return;
    }
    setForm(null);
    toast.success(form.id ? "Information mise à jour" : "Information ajoutée", {
      description: form.title ?? "",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Infos pratiques"
        description="Lieu, hébergement, transport, restauration et contacts utiles affichés sur le site."
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            Ajouter une information
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Informations" value={rows.length} icon={InfoIcon} />
        <StatCard
          label="Publiées"
          value={rows.filter((info) => info.is_visible).length}
          icon={EyeIcon}
        />
        <StatCard
          label="Avec lien carte"
          value={rows.filter((info) => Boolean(info.map_url)).length}
          icon={MapPinnedIcon}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Titre, section, contenu…"
          count={filtered.length}
          total={rows.length}
        />
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={3} rows={5} />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={InfoIcon}
                title={rows.length === 0 ? "Aucune information" : "Aucun résultat"}
                description={
                  rows.length === 0
                    ? "Ajoutez la première information pratique."
                    : "Modifiez votre recherche pour trouver une information."
                }
                action={
                  rows.length === 0 ? (
                    <Button size="sm" onClick={openCreate}>
                      <PlusIcon className="h-4 w-4" />
                      Ajouter une information
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
                    <TableHead className="pl-6">Information</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((info) => (
                    <TableRow key={info.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium text-foreground">{info.title}</p>
                        <p className="mt-0.5 max-w-[420px] truncate text-xs text-muted-foreground">
                          {info.content}
                        </p>
                      </TableCell>
                      <TableCell>
                        <UiBadge variant="secondary">{info.section}</UiBadge>
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            info.is_visible
                              ? "border-success/40 text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {info.is_visible ? "Publié" : "Masqué"}
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
                                setForm(info);
                              },
                            },
                            {
                              label: info.is_visible ? "Masquer" : "Publier",
                              icon: info.is_visible ? EyeOffIcon : EyeIcon,
                              onSelect: () => {
                                update(info.id, { is_visible: !info.is_visible });
                                toast.success(
                                  info.is_visible ? "Information masquée" : "Information publiée"
                                );
                              },
                            },
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: async () => {
                                const ok = await remove(info.id);
                                if (ok) {
                                  toast.success("Information supprimée", { description: info.title });
                                } else {
                                  toast.error("Suppression impossible");
                                }
                              },
                              confirm: {
                                title: `Supprimer « ${info.title} » ?`,
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
              {form?.id ? "Modifier l’information" : "Ajouter une information"}
            </DialogTitle>
            <DialogDescription>
              Chaque information est regroupée par section sur la page publique.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Section"
              value={(form?.section as string) ?? "Lieu"}
              onChange={(value) =>
                setForm({ ...form, section: value as PracticalInfoSection })
              }
              options={SECTIONS.map((section) => ({ value: section, label: section }))}
            />
            <TextField
              label="Titre"
              required
              value={form?.title ?? ""}
              onChange={(value) => setForm({ ...form, title: value })}
            />
          </div>

          <TextAreaField
            label="Contenu"
            required
            rows={5}
            value={form?.content ?? ""}
            onChange={(value) => setForm({ ...form, content: value })}
          />

          <TextField
            label="Lien carte (optionnel)"
            placeholder="https://maps.google.com/…"
            value={form?.map_url ?? ""}
            onChange={(value) => setForm({ ...form, map_url: value })}
          />

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
