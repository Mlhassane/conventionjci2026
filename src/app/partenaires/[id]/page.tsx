import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, Building2Icon, MessageCircleIcon, TagIcon } from "lucide-react";
import Footer from "@/components/Footer";
import { getPartner } from "@/lib/data";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const partner = await getPartner(params.id);
  if (!partner) return { title: "Partenaire introuvable" };
  return {
    title: `${partner.name} — Partenaire`,
    description: partner.description ?? `${partner.name}, partenaire de la Convention.`,
  };
}

export default async function PartnerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const partner = await getPartner(params.id);
  if (!partner) notFound();

  return (
    <main className="bg-muted/30">
      <div className="container-edge pt-8 pb-24">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/partenaires">
            <ArrowLeftIcon className="h-4 w-4" />
            Tous les partenaires
          </Link>
        </Button>

        <Card className="mt-6 overflow-hidden py-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg border bg-white p-4">
              {partner.logo_url ? (
                <Image
                  src={partner.logo_url}
                  alt={partner.name}
                  width={200}
                  height={80}
                  className="h-12 w-auto max-w-full object-contain"
                />
              ) : (
                <Building2Icon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-2xl leading-tight text-foreground md:text-3xl">
                {partner.name}
              </h1>
              <div className="mt-2">
                <UiBadge variant="secondary">{partner.category}</UiBadge>
              </div>
            </div>
          </CardContent>
        </Card>

        {partner.description && (
          <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Présentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">
                {partner.description}
              </p>
            </CardContent>
          </Card>
        )}

        {partner.offer && (
          <Card className="mt-6 border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-primary">
                <TagIcon className="h-4 w-4" />
                Offre spéciale Convention
              </CardTitle>
              <CardDescription>Profitez de l&apos;offre réservée aux participants.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-foreground">{partner.offer}</p>
            </CardContent>
          </Card>
        )}

        {(partner.website || partner.whatsapp) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {partner.website && (
              <Button asChild>
                <a href={partner.website} target="_blank" rel="noreferrer">
                  <Building2Icon className="h-4 w-4" />
                  Visiter le site
                </a>
              </Button>
            )}
            {partner.whatsapp && (
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircleIcon className="h-4 w-4" />
                  Contacter sur WhatsApp
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
