"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  EyeOffIcon,
  MessageSquareHeartIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import { Feedback } from "@/lib/types";
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

export default function AdminAvisPage() {
  const { rows, loading, error, update, remove, refresh } = useTable<Feedback>(
    "feedbacks",
    "created_at"
  );
  const [form, setForm] = useState<Partial<Feedback> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((feedback) => {
      if (filter === "pending" && feedback.is_approved) return false;
      if (filter === "approved" && !feedback.is_approved) return false;
      if (!query) return true;
      return [feedback.name, feedback.message, feedback.organization, feedback.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [rows, search, filter]);

  const pending = rows.filter((feedback) => !feedback.is_approved);

  async function handleSave() {
    if (!form || saving) return;
    if (!form.name?.trim() || !form.message?.trim()) {
      setFormError("Le nom et le message sont obligatoires.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const ok = form.id ? await update(form.id, form) : false;
    setSaving(false);
    if (!ok) {
      setFormError("Une erreur est survenue. Réessayez.");
      return;
    }
    setForm(null);
    toast.success("Avis mis à jour");
  }

  async function handleApproveAll() {
    let failed = 0;
    for (const feedback of pending) {
      if (!(await update(feedback.id, { is_approved: true }))) failed += 1;
    }
    await refresh();
    if (failed > 0) {
      toast.error(`${failed} avis n'ont pas pu être approuvés.`);
    } else {
      toast.success(`${pending.length} avis approuvé(s)`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Avis des participants"
        description="Relisez les retours laissés sur la page Avis avant de les publier."
        actions={
          pending.length > 0 ? (
            <Button size="sm" onClick={handleApproveAll}>
              <CheckIcon className="h-4 w-4" />
              Tout approuver ({pending.length})
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Avis reçus" value={rows.length} icon={MessageSquareHeartIcon} />
        <StatCard label="En attente" value={pending.length} icon={EyeOffIcon} hint="À modérer" />
        <StatCard
          label="Publiés"
          value={rows.filter((feedback) => feedback.is_approved).length}
          icon={StarIcon}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, message, ville…"
          count={filtered.length}
          total={rows.length}
        >
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {(
              [
                ["all", "Tous"],
                ["pending", "En attente"],
                ["approved", "Publiés"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filter === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </ListToolbar>
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={MessageSquareHeartIcon}
                title={rows.length === 0 ? "Aucun avis reçu" : "Aucun résultat"}
                description={
                  rows.length === 0
                    ? "Les avis laissés depuis la page publique apparaîtront ici."
                    : "Modifiez votre recherche pour trouver un avis."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Auteur</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="pl-6 font-medium text-foreground">
                        {feedback.name}
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          {[feedback.organization, feedback.city].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[380px] truncate text-muted-foreground">
                          {feedback.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        {feedback.rating !== null ? (
                          <span className="text-sm text-blue" aria-label={`${feedback.rating}/5`}>
                            {"★".repeat(feedback.rating)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            feedback.is_approved
                              ? "border-success/40 text-success"
                              : "border-amber-500/40 text-amber-600"
                          }
                        >
                          {feedback.is_approved ? "Publié" : "En attente"}
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
                                setForm(feedback);
                              },
                            },
                            {
                              label: feedback.is_approved ? "Masquer" : "Approuver",
                              icon: feedback.is_approved ? EyeOffIcon : CheckIcon,
                              onSelect: async () => {
                                const ok = await update(feedback.id, {
                                  is_approved: !feedback.is_approved,
                                });
                                if (ok) {
                                  toast.success(
                                    feedback.is_approved ? "Avis masqué" : "Avis publié"
                                  );
                                } else {
                                  toast.error("Action impossible");
                                }
                              },
                            },
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: async () => {
                                const ok = await remove(feedback.id);
                                if (ok) {
                                  toast.success("Avis supprimé", { description: feedback.name });
                                } else {
                                  toast.error("Suppression impossible");
                                }
                              },
                              confirm: {
                                title: `Supprimer l'avis de ${feedback.name} ?`,
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
            <DialogTitle>Modifier l&apos;avis</DialogTitle>
            <DialogDescription>
              Corrigez le texte avant publication si besoin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nom"
              required
              value={form?.name ?? ""}
              onChange={(value) => setForm({ ...form, name: value })}
            />
            <TextField
              label="Ville"
              value={form?.city ?? ""}
              onChange={(value) => setForm({ ...form, city: value })}
            />
          </div>

          <TextField
            label="Organisation"
            value={form?.organization ?? ""}
            onChange={(value) => setForm({ ...form, organization: value })}
          />

          <TextAreaField
            label="Message"
            required
            rows={5}
            value={form?.message ?? ""}
            onChange={(value) => setForm({ ...form, message: value })}
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
