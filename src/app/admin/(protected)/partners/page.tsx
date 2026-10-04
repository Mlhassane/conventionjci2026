"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2Icon,
  EyeIcon,
  EyeOffIcon,
  HandshakeIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import ImageUpload from "@/components/form/ImageUpload";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import { PARTNER_CATEGORIES, type Partner } from "@/lib/types";
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
import { LogoBackgroundEditor } from "@/components/admin/logo-background-editor";
import { PartnerPosterPreview } from "@/components/admin/partner-poster-preview";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ComboField, TextAreaField, TextField } from "@/components/admin/ui/form-fields";
import { ListToolbar } from "@/components/admin/ui/list-toolbar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

/** Valeurs proposées : on peut aussi saisir un type libre. */
const CATEGORIES = [...PARTNER_CATEGORIES];

const EMPTY: Partial<Partner> = {
  name: "",
  category: "Sponsor",
  description: "",
  website: "",
  whatsapp: "",
  offer: "",
  logo_url: "",
  display_order: 0,
  is_visible: true,
};

export default function AdminPartnersPage() {
  const { rows, loading, error, create, update, remove } = useTable<Partner>(
    "partners",
    "display_order"
  );
  const [form, setForm] = useState<Partial<Partner> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [poster, setPoster] = useState<Partner | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((partner) =>
      [partner.name, partner.category, partner.offer, partner.website]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, search]);

  function openCreate() {
    setFormError(null);
    setForm(EMPTY);
  }

  function openEdit(partner: Partner) {
    setFormError(null);
    setForm(partner);
  }

  async function handleLogoFile(file: File) {
    setFormError(null);
    setUploading(true);
    const url = await uploadAdminImage("partners", "logos", file);
    setUploading(false);
    if (!url) {
      setFormError("Échec de l’envoi du logo. Réessayez.");
      return;
    }
    setForm((current) => (current ? { ...current, logo_url: url } : current));
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
    toast.success(form.id ? "Partenaire mis à jour" : "Partenaire ajouté", {
      description: name,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Partenaires"
        description="Structures et entreprises qui soutiennent la Convention et apparaissent sur le site public."
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            Ajouter un partenaire
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Partenaires" value={rows.length} icon={HandshakeIcon} />
        <StatCard
          label="Publiés"
          value={rows.filter((partner) => partner.is_visible).length}
          icon={EyeIcon}
        />
        <StatCard
          label="Masqués"
          value={rows.filter((partner) => !partner.is_visible).length}
          icon={EyeOffIcon}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, catégorie, offre…"
          count={filtered.length}
          total={rows.length}
        />
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={HandshakeIcon}
                title={rows.length === 0 ? "Aucun partenaire" : "Aucun résultat"}
                description={
                  rows.length === 0
                    ? "Ajoutez le premier partenaire de la Convention."
                    : "Modifiez votre recherche pour trouver un partenaire."
                }
                action={
                  rows.length === 0 ? (
                    <Button size="sm" onClick={openCreate}>
                      <PlusIcon className="h-4 w-4" />
                      Ajouter un partenaire
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
                    <TableHead className="pl-6">Partenaire</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prestation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          {partner.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={partner.logo_url}
                              alt=""
                              className="h-9 w-14 shrink-0 rounded-lg border border-line/10 bg-white object-contain"
                            />
                          ) : (
                            <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-line/10 bg-muted">
                              <Building2Icon className="h-4 w-4 text-muted-foreground" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{partner.name}</p>
                            {partner.website && (
                              <p className="truncate text-xs text-muted-foreground">
                                {partner.website.replace(/^https?:\/\//, "")}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <UiBadge variant="secondary">{partner.category}</UiBadge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {partner.offer ?? "—"}
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            partner.is_visible
                              ? "border-success/40 text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {partner.is_visible ? "Publié" : "Masqué"}
                        </UiBadge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          items={[
                            {
                              label: "Générer l’affiche",
                              icon: ImageIcon,
                              onSelect: () => setPoster(partner),
                            },
                            {
                              label: "Modifier",
                              icon: PencilIcon,
                              onSelect: () => openEdit(partner),
                            },
                            {
                              label: partner.is_visible ? "Masquer" : "Publier",
                              icon: partner.is_visible ? EyeOffIcon : EyeIcon,
                              onSelect: () => {
                                update(partner.id, { is_visible: !partner.is_visible });
                                toast.success(
                                  partner.is_visible ? "Partenaire masqué" : "Partenaire publié",
                                  { description: partner.name }
                                );
                              },
                            },
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: async () => {
                                const ok = await remove(partner.id);
                                if (ok) {
                                  toast.success("Partenaire supprimé", { description: partner.name });
                                } else {
                                  toast.error("Suppression impossible");
                                }
                              },
                              confirm: {
                                title: `Supprimer « ${partner.name} » ?`,
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

      <Dialog open={Boolean(poster)} onOpenChange={(open) => !open && setPoster(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Affiche — {poster?.name}</DialogTitle>
            <DialogDescription>
              Logo, type de partnership et le texte de la « Description »
              (à défaut, la prestation/contribution).
            </DialogDescription>
          </DialogHeader>
          {poster && <PartnerPosterPreview partner={poster} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Modifier le partenaire" : "Ajouter un partenaire"}</DialogTitle>
            <DialogDescription>
              Le logo et l&apos;offre Convention sont affichés sur la page publique.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nom"
              required
              value={form?.name ?? ""}
              onChange={(value) => setForm({ ...form, name: value })}
            />
            <ComboField
              label="Type de partenariat"
              id="partner-category"
              value={form?.category ?? ""}
              onChange={(value) => setForm({ ...form, category: value })}
              suggestions={CATEGORIES}
              placeholder="Choisir ou écrire un type"
              hint="Choisis un type proposé ou écris le tien."
              required
            />
          </div>

          <TextAreaField
            label="Description"
            rows={3}
            value={form?.description ?? ""}
            onChange={(value) => setForm({ ...form, description: value })}
          />

          <div className="space-y-1.5">
            <p className="text-xs text-ink/60">Logo</p>
            <div className="rounded-lg border border-line/10 bg-muted/40 p-3">
              <ImageUpload
                onFile={handleLogoFile}
                currentUrl={form?.logo_url}
                error={uploading ? "Envoi en cours…" : null}
                shape="rect"
                label="Téléverser le logo"
                hint="PNG transparent recommandé, 8 Mo max"
              />
              {form?.logo_url && (
                <div className="mt-3 border-t pt-3">
                  <LogoBackgroundEditor
                    logoUrl={form.logo_url}
                    busy={uploading}
                    onApply={async (file) => {
                      setFormError(null);
                      setUploading(true);
                      const url = await uploadAdminImage("partners", "logos", file);
                      setUploading(false);
                      if (!url) {
                        setFormError("Envoi du logo impossible. Réessayez.");
                        return;
                      }
                      setForm((current) => (current ? { ...current, logo_url: url } : current));
                    }}
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Le logo est affiché sur fond blanc : supprime le fond pour
                    qu’il s’accorde aux deux bandeaux.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Site web"
              placeholder="https://"
              value={form?.website ?? ""}
              onChange={(value) => setForm({ ...form, website: value })}
            />
            <TextField
              label="WhatsApp"
              inputMode="tel"
              value={form?.whatsapp ?? ""}
              onChange={(value) => setForm({ ...form, whatsapp: value })}
            />
            <TextField
              label="Prestation / contribution"
              value={form?.offer ?? ""}
              onChange={(value) => setForm({ ...form, offer: value })}
            />
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
