"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLinkIcon,
  MapPinIcon,
  MessageSquareIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useTable } from "@/lib/admin/useTable";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Participation } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ListToolbar } from "@/components/admin/ui/list-toolbar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RowActions } from "@/components/admin/ui/row-actions";
import { StatCard, TableSkeleton } from "@/components/admin/ui/stat-card";

export default function AdminParticipationsPage() {
  const { rows, loading, error, remove } = useTable<Participation>(
    "participations",
    "created_at"
  );
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [rows]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((participation) =>
      [participation.name, participation.city, participation.organization, participation.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [sorted, search]);

  const today = new Date().toDateString();
  const todayCount = sorted.filter(
    (participation) => new Date(participation.created_at).toDateString() === today
  ).length;
  const withPhoto = sorted.filter((participation) => participation.image_url).length;
  const cities = new Set(sorted.map((participation) => participation.city).filter(Boolean)).size;

  async function handleDelete(participation: Participation) {
    const supabase = getSupabaseClient();
    if (supabase && participation.image_url) {
      const marker = "/storage/v1/object/public/posters/";
      const path = participation.image_url.includes(marker)
        ? decodeURIComponent(participation.image_url.split(marker)[1])
        : null;
      if (path) await supabase.storage.from("posters").remove([path]);
    }

    const ok = await remove(participation.id);
    if (ok) {
      toast.success("Participation supprimée", { description: participation.name });
    } else {
      toast.error("Suppression impossible");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Participations J’y serai"
        description="Les visuels générés publiquement sont enregistrés ici avec le nom, la ville, l’OLM, le message et l’image."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Participations" value={rows.length} icon={SparklesIcon} />
        <StatCard label="Aujourd’hui" value={todayCount} icon={MessageSquareIcon} />
        <StatCard label="Avec image" value={withPhoto} />
        <StatCard label="Villes représentées" value={cities} icon={MapPinIcon} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 overflow-hidden border-line/10 py-0 shadow-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, ville, OLM, message…"
          count={filtered.length}
          total={rows.length}
        />
        <CardContent className="px-0">
          {loading ? (
            <TableSkeleton columns={5} rows={6} />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={SparklesIcon}
                title={rows.length === 0 ? "Aucune participation" : "Aucun résultat"}
                description={
                  rows.length === 0
                    ? "Les visuels générés depuis la page publique apparaîtront ici."
                    : "Modifiez votre recherche pour trouver une participation."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Participant</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>OLM</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((participation) => (
                    <TableRow key={participation.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-lg">
                            {participation.image_url && (
                              <AvatarImage
                                src={participation.image_url}
                                alt={`Visuel de ${participation.name}`}
                                className="rounded-lg object-cover"
                              />
                            )}
                            <AvatarFallback className="rounded-lg bg-primary/10 text-xs text-primary">
                              {participation.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="truncate font-medium text-foreground">
                            {participation.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {participation.city ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {participation.organization ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {participation.message ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(participation.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          items={[
                            ...(participation.image_url
                              ? [
                                  {
                                    label: "Voir l’image",
                                    icon: ExternalLinkIcon,
                                    href: participation.image_url,
                                    external: true,
                                  },
                                ]
                              : []),
                            {
                              label: "Supprimer",
                              icon: Trash2Icon,
                              tone: "destructive" as const,
                              onSelect: () => handleDelete(participation),
                              confirm: {
                                title: `Supprimer la participation de ${participation.name} ?`,
                                description:
                                  "L’image générée dans le bucket posters sera également supprimée.",
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

      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Astuce : utilisez la recherche pour retrouver une participation par nom, ville, OLM
          ou mot du participant.
        </p>
      )}
    </div>
  );
}
