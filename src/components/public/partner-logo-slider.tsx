"use client";

import Image from "next/image";
import Link from "next/link";
import type { Partner } from "@/lib/types";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

/**
 * Bandeau de logos des partenaires en défilement infini.
 * Les logos sans image affichent le nom du partenaire.
 */
export function PartnerLogoSlider({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <div className="relative">
      <p className="mb-5 text-center font-sans text-[11px] tracking-wide2 uppercase text-ink/40">
        Ils soutiennent la Convention
      </p>

      <InfiniteSlider
        gap={56}
        duration={32}
        durationOnHover={280}
        reverse
        className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        {partners.map((partner) => (
          <Link
            key={partner.id}
            href={`/partenaires/${partner.id}`}
            aria-label={partner.name}
            title={partner.name}
            className="group flex h-12 shrink-0 items-center justify-center opacity-55 transition-opacity duration-300 hover:opacity-100 md:h-14"
          >
            {partner.logo_url ? (
              <Image
                src={partner.logo_url}
                alt={partner.name}
                width={160}
                height={56}
                className="h-full w-auto max-w-[180px] object-contain"
              />
            ) : (
              <span className="whitespace-nowrap font-sans text-xs tracking-wide2 uppercase text-ink/70 md:text-sm">
                {partner.name}
              </span>
            )}
          </Link>
        ))}
      </InfiniteSlider>
    </div>
  );
}
