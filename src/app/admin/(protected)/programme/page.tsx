"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import { ProgramSession, SessionCategory, Speaker } from "@/lib/types";
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
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

const CATEGORIES: SessionCategory[] = [
  "Cérémonie",
  "Formation",
  "Panel",
  "Networking",
  "Pause",
  "Soirée",
  "Statutaire",
];

const EMPTY: Partial<ProgramSession> = {
  date: "2026-10-09",
  start_time: "09:00",
  end_time: "",
  title: "",
  description: "",
  location: "",
  category: "Formation",
  speaker_id: null,
  display_order: 0,
  is_visible: true,
};

export default function AdminProgrammePage() {
  const { rows, loading, error, create, update, remove } = useTable<ProgramSession>(
    "program_sessions",
    "date"
  );
  const { rows: speakers } = useTable<Speaker>("speakers", "display_order");
  const [form, setForm] = useState<Partial<ProgramSession> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const speakerName = useMemo(() => {
    const map = new Map<string, string>();
    for (const speaker of speakers) map.set(speaker.id, speaker.name);
    return map;
  }, [speakers]);

  const sessions = useMemo(
    () =>
      [...rows].sort((a, b) =>
        `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)
      ),
    [rows]
  );

  const days = useMemo(
    () => new Set(sessions.map((session) => session.date)).size,
    [sessions]
  );

  function openCreate() {
    setFormError(null);
    setForm(EMPTY);
  }

  async function handleSave() {
    if (!form || saving) return;
    if (!form.date || !form.start_time || !form.title?.trim()) {
      setFormError("La date, l'heure de début et le titre sont obligatoires.");
      return;
    }
    if (form.end_time && form.end_time <= form.start_time) {
      setFormError("L'heure de fin doit être après l'heure de début.");
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
    toast.success(form.id ? "Session mise à jour" : "Session ajoutée", {
      description: form.title ?? "",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programme"
        description="Sessions, horaires et lieux des deux jours de Convention, classés par horaire."
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            Ajouter une session
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions" value={rows.length} icon={CalendarDaysIcon} />
        <StatCard label="Joursprogrammés" value={days} icon={ClockIcon} />
        <StatCard
          label="Publiées"
          value={rows.filter((session) => session.is_visible).length}
          icon={EyeIcon}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={5} rows={6} />
          ) : sessions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CalendarDaysIcon}
                title="Aucune session"
                description="Construisez le programme public de la Convention."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <PlusIcon className="h-4 w-4" />
                    Ajouter une session
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Horaire</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Intervenant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="pl-6">
                        <p className="whitespace-nowrap text-sm font-medium text-foreground">
                          {session.start_time}
                          {session.end_time ? ` – ${session.end_time}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.date}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{session.title}</p>
                        {session.location && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPinIcon className="h-3 w-3" />
                            {session.location}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <UiBadge variant="secondary">{session.category}</UiBadge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {session.speaker_id ? speakerName.get(session.speaker_id) ?? "—" : "—"}
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            session.is_visible
                              ? "border-success/40 text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {session.is_visible ? "Publié" : "Masqué"}
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
                                setForm(session);
                              },
                            },
                            {
                              label: session.is_visible ? "Masquer" : "Publier",
                              icon: session.is_visible ? EyeOffIcon : EyeIcon,
                              onSelect: () => {
                                update(session.id, { is_visible: !session.is_visible });
                                toast.success(
                                  session.is_visible ? "Session masquée" : "Session publiée",
                                  { description: session.title }
                                );
                              },
                            },
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: async () => {
                                const ok = await remove(session.id);
                                if (ok) {
                                  toast.success("Session supprimée", { description: session.title });
                                } else {
                                  toast.error("Suppression impossible");
                                }
                              },
                              confirm: {
                                title: `Supprimer « ${session.title} » ?`,
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Modifier la session" : "Ajouter une session"}</DialogTitle>
            <DialogDescription>
              Les sessions publiées apparaissent immédiatement sur la page programme.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Date"
              type="date"
              required
              value={form?.date ?? ""}
              onChange={(value) => setForm({ ...form, date: value })}
            />
            <TextField
              label="Heure de début"
              type="time"
              required
              value={form?.start_time ?? ""}
              onChange={(value) => setForm({ ...form, start_time: value })}
            />
            <TextField
              label="Heure de fin"
              type="time"
              value={form?.end_time ?? ""}
              onChange={(value) => setForm({ ...form, end_time: value })}
            />
          </div>

          <TextField
            label="Titre"
            required
            value={form?.title ?? ""}
            onChange={(value) => setForm({ ...form, title: value })}
          />

          <TextAreaField
            label="Description"
            rows={3}
            value={form?.description ?? ""}
            onChange={(value) => setForm({ ...form, description: value })}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Lieu"
              value={form?.location ?? ""}
              onChange={(value) => setForm({ ...form, location: value })}
            />
            <SelectField
              label="Catégorie"
              value={(form?.category as string) ?? "Formation"}
              onChange={(value) => setForm({ ...form, category: value as SessionCategory })}
              options={CATEGORIES.map((category) => ({ value: category, label: category }))}
            />
            <SelectField
              label="Intervenant"
              value={form?.speaker_id ?? ""}
              onChange={(value) =>
                setForm({ ...form, speaker_id: value === "__none__" ? null : value })
              }
              options={[
                { value: "__none__", label: "Aucun" },
                ...speakers.map((speaker) => ({ value: speaker.id, label: speaker.name })),
              ]}
            />
          </div>

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
