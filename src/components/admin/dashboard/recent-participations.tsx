"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Participation } from "@/lib/types";

export function RecentParticipations({
  rows,
  loading,
}: {
  rows: Participation[];
  loading?: boolean;
}) {
  return (
    <Card className="border-line/10 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-blue" />
          Derniers J&apos;y serai
        </CardTitle>
        <CardDescription>
          Les visuels générés publiquement, avec le nom, la ville, l&apos;OLM et la
          photo de chaque participant.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <p className="px-6 text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground">
            Aucune participation enregistrée pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Participant</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>OLM</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="pr-6 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        {row.image_url ? (
                          <Image
                            src={row.image_url}
                            alt={`Visuel de ${row.name}`}
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-lg border border-line/10 object-cover"
                          />
                        ) : (
                          <span className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
                        )}
                        <span className="font-medium text-ink">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {row.city || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.organization || "—"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {row.message || "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link href="/admin/participations">
            Voir toutes les participations
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
