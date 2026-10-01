"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon, Building2Icon, SearchIcon, TagIcon } from "lucide-react";
import type { Partner, PartnerCategory } from "@/lib/types";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";

const CATEGORY_ORDER: PartnerCategory[] = [
  "Partenaire officiel",
  "Partenaire principal",
  "Sponsor",
  "Partenaire média",
  "Partenaire institutionnel",
  "Partenaire technique",
];

export function PartnerDirectory({ partners }: { partners: Partner[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((item) => partners.some((p) => p.category === item)),
    [partners]
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return partners.filter((partner) => {
      const matchesCategory = category === "all" || partner.category === category;
      if (!matchesCategory) return false;
      if (!search) return true;
      return [partner.name, partner.category, partner.description, partner.offer]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [partners, query, category]);

  if (partners.length === 0) {
    return (
      <EmptyState
        icon={Building2Icon}
        title="Aucun partenaire publié pour le moment"
        description="La liste des partenaires sera annoncée prochainement."
      />
    );
  }

  return (
    <div className="space-y-6">
      {categories.length > 1 && (
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
            <TabsTrigger value="all" className="h-8 px-3 text-xs">
              Tous ({partners.length})
            </TabsTrigger>
            {categories.map((item) => (
              <TabsTrigger key={item} value={item} className="h-8 px-3 text-xs">
                {item} ({partners.filter((p) => p.category === item).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un partenaire…"
            aria-label="Rechercher un partenaire"
            className="pl-9"
          />
        </div>
        <UiBadge variant="secondary" className="h-7">
          {filtered.length} / {partners.length}
        </UiBadge>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Aucun résultat"
          description="Modifiez votre recherche ou changez de catégorie."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((partner) => (
            <Link
              key={partner.id}
              href={`/partenaires/${partner.id}`}
              className="group h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="flex h-full flex-col overflow-hidden py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex h-16 w-full items-center justify-center rounded-lg border bg-white p-3">
                    {partner.logo_url ? (
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        width={160}
                        height={64}
                        className="h-10 w-auto max-w-full object-contain"
                      />
                    ) : (
                      <span className="font-serif text-xl text-muted-foreground">
                        {partner.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 font-serif text-lg leading-tight text-foreground">
                    {partner.name}
                  </p>
                  <div className="mt-2">
                    <UiBadge variant="secondary">{partner.category}</UiBadge>
                  </div>
                  {partner.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {partner.description}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/40 px-6 py-3">
                  {partner.offer ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                      <TagIcon className="h-3.5 w-3.5" />
                      Prestation
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">En savoir plus</span>
                  )}
                  <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
