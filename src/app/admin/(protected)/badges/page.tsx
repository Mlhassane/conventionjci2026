"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheckIcon,
  BanIcon,
  DownloadIcon,
  EyeIcon,
  IdCardIcon,
  RotateCcwIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Badge, Participant } from "@/lib/types";
import { generateBadgeCode } from "@/lib/badgeCode";
import { formatShortDateRange } from "@/lib/date";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BadgePreview from "@/components/BadgePreview";
import { BadgeThumbnail } from "@/components/admin/badge-thumbnail";
import { BadgesA4Export } from "@/components/admin/badges-a4-export";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ListToolbar } from "@/components/admin/ui/list-toolbar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

/** Nombre de miniatures affichées avant le bouton « Afficher plus ». */
const GALLERY_STEP = 6;

export default function AdminBadgesPage() {
  const badgesTable = useTable<Badge>("badges", "created_at");
  const participantsTable = useTable<Participant>("participants", "created_at");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Badge | null>(null);
  const [eventInfo, setEventInfo] = useState({ dateLabel: "", location: "" });
  const [view, setView] = useState<"liste" | "galerie">("liste");
  const [visible, setVisible] = useState(GALLERY_STEP);

  // Informations imprimées sur le badge, pilotées par l'admin > Paramètres.
  useEffect(() => {
    getSupabaseClient()
      ?.from("event_settings")
      .select("start_date, end_date, location")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setEventInfo({
          dateLabel:
            data.start_date && data.end_date
              ? formatShortDateRange(data.start_date, data.end_date)
              : "",
          location: data.location ?? "",
        });
      });
  }, []);

  const badgeByParticipant = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const badge of badgesTable.rows) {
      if (badge.participant_id && !map.has(badge.participant_id)) {
        map.set(badge.participant_id, badge);
      }
    }
    return map;
  }, [badgesTable.rows]);

  const pending = useMemo(
    () => participantsTable.rows.filter((participant) => !badgeByParticipant.has(participant.id)),
    [participantsTable.rows, badgeByParticipant]
  );

  const filteredBadges = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return badgesTable.rows;
    return badgesTable.rows.filter((badge) =>
      [badge.full_name, badge.unique_code, badge.organization, badge.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [badgesTable.rows, search]);

  async function insertBadge(participant: Participant): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    for (let attempt = 0; attempt < 4; attempt++) {
      const { error: insertError } = await supabase.from("badges").insert({
        participant_id: participant.id,
        full_name: participant.name,
        role: participant.role ?? "Participant",
        organization: participant.organization,
        city: participant.city,
        photo_url: participant.photo_url,
        unique_code: generateBadgeCode(),
        status: "active",
      });
      if (!insertError) return true;
      if (!String(insertError.message).toLowerCase().includes("duplicate")) break;
    }
    return false;
  }

  async function handleGenerateOne(participant: Participant) {
    setGenerating(true);
    setError(null);
    const ok = await insertBadge(participant);
    await badgesTable.refresh();
    setGenerating(false);
    if (ok) {
      toast.success("Badge généré", { description: participant.name });
    } else {
      setError(`Échec de génération pour ${participant.name}. Réessayez.`);
    }
  }

  async function handleGenerateAll() {
    setGenerating(true);
    setError(null);
    let failed = 0;
    for (const participant of pending) {
      if (!(await insertBadge(participant))) failed += 1;
    }
    await badgesTable.refresh();
    setGenerating(false);
    if (failed > 0) {
      setError(`${failed} badge(s) n'ont pas pu être générés. Réessayez.`);
    } else {
      toast.success(`${pending.length} badge(s) généré(s)`);
    }
  }

  const loading = badgesTable.loading || participantsTable.loading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Badges"
        description="L’organisation génère les badges officiels, puis les remet aux participants. Chaque badge est vérifiable via son QR code."
        actions={
          <>
            <BadgesA4Export
              badges={filteredBadges}
              eventDateLabel={eventInfo.dateLabel}
              location={eventInfo.location}
            />
            {pending.length > 0 && (
              <Button size="sm" onClick={handleGenerateAll} disabled={generating}>
                <WandSparklesIcon className="h-4 w-4" />
                {generating ? "Génération…" : `Tout générer (${pending.length})`}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Badges générés"
          value={badgesTable.rows.length}
          icon={BadgeCheckIcon}
        />
        <StatCard
          label="En attente"
          value={pending.length}
          icon={UserRoundIcon}
          hint="Participants sans badge"
        />
        <StatCard
          label="Participants"
          value={participantsTable.rows.length}
          icon={UsersIcon}
        />
      </div>

      {(error || badgesTable.error) && (
        <p className="text-sm text-destructive">{error ?? badgesTable.error}</p>
      )}

      {pending.length > 0 && (
        <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
          <div className="border-b px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">En attente de badge</h2>
            <p className="text-sm text-muted-foreground">
              Générez les badges manquants de l&apos;équipe.
            </p>
          </div>
          <CardContent className="px-0">
            <div className="divide-y">
              {pending.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {participant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[participant.phone, participant.member_code].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateOne(participant)}
                    disabled={generating}
                  >
                    <IdCardIcon className="h-4 w-4" />
                    Générer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Badges générés</h2>
          <Tabs value={view} onValueChange={(value) => setView(value as "liste" | "galerie")}>
            <TabsList className="h-8">
              <TabsTrigger value="liste" className="h-7 px-3 text-xs">
                Liste
              </TabsTrigger>
              <TabsTrigger value="galerie" className="h-7 px-3 text-xs">
                Galerie
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, code, ville…"
          count={filteredBadges.length}
          total={badgesTable.rows.length}
        />
        {view === "galerie" ? (
          <div className="p-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBadges.slice(0, visible).map((badge) => (
                <div
                  key={badge.id}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setPreview(badge)}
                    className="p-3"
                    aria-label={`Voir le badge de ${badge.full_name}`}
                  >
                    <BadgeThumbnail
                      badge={badge}
                      event={eventInfo}
                      className="w-full transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  </button>
                  <div className="flex items-center justify-between gap-2 border-t px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {badge.full_name}
                      </p>
                      <code className="font-mono text-[11px] text-muted-foreground">
                        {badge.unique_code}
                      </code>
                    </div>
                    <UiBadge
                      variant="outline"
                      className={
                        badge.status === "active"
                          ? "border-success/40 text-success"
                          : "border-destructive/40 text-destructive"
                      }
                    >
                      {badge.status === "active" ? "Actif" : "Révoqué"}
                    </UiBadge>
                  </div>
                </div>
              ))}
            </div>
            {filteredBadges.length > visible && (
              <div className="mt-5 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisible((current) => current + GALLERY_STEP)}
                >
                  Afficher plus ({filteredBadges.length - visible} restant
                  {filteredBadges.length - visible > 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </div>
        ) : (
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : filteredBadges.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={IdCardIcon}
                title={badgesTable.rows.length === 0 ? "Aucun badge généré" : "Aucun résultat"}
                description={
                  badgesTable.rows.length === 0
                    ? "Générez le premier badge de la Convention."
                    : "Modifiez votre recherche pour trouver un badge."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Titulaire</TableHead>
                    <TableHead>Code unique</TableHead>
                    <TableHead>Rôle · Organisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBadges.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell className="pl-6 font-medium text-foreground">
                        {badge.full_name}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {badge.unique_code}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {[badge.role, badge.organization, badge.city]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </TableCell>
                      <TableCell>
                        <UiBadge
                          variant="outline"
                          className={
                            badge.status === "active"
                              ? "border-success/40 text-success"
                              : "border-destructive/40 text-destructive"
                          }
                        >
                          {badge.status === "active" ? "Actif" : "Révoqué"}
                        </UiBadge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          items={[
                            {
                              label: "Générer et télécharger",
                              icon: DownloadIcon,
                              onSelect: () => setPreview(badge),
                            },
                            {
                              label: "Vérifier le badge",
                              icon: EyeIcon,
                              href: `/badge/verify/${badge.unique_code}`,
                              external: true,
                            },
                            {
                              label: badge.status === "active" ? "Révoquer" : "Réactiver",
                              icon: badge.status === "active" ? BanIcon : RotateCcwIcon,
                              onSelect: async () => {
                                await badgesTable.update(badge.id, {
                                  status: badge.status === "active" ? "revoked" : "active",
                                });
                                toast.success(
                                  badge.status === "active" ? "Badge révoqué" : "Badge réactivé",
                                  { description: badge.full_name }
                                );
                              },
                            },
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive",
                              onSelect: async () => {
                                const ok = await badgesTable.remove(badge.id);
                                if (ok) {
                                  toast.success("Badge supprimé", { description: badge.full_name });
                                } else {
                                  toast.error("Suppression impossible");
                                }
                              },
                              confirm: {
                                title: `Supprimer le badge de ${badge.full_name} ?`,
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
        )}
      </Card>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Badge de {preview?.full_name}</DialogTitle>
            <DialogDescription>
              Le PNG reprend les informations de l&apos;événement définies dans l&apos;admin.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <BadgePreview
              badge={preview}
              eventDateLabel={eventInfo.dateLabel}
              location={eventInfo.location}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
