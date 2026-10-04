import type { MetadataRoute } from "next";
import { getPartners, getSpeakers } from "@/lib/data";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

/** Pages publiques + fiches partenaires/intervenants, générées à la demande. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [partners, speakers] = await Promise.all([getPartners(), getSpeakers()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/j-y-seri`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/programme`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/intervenants`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/partenaires`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/participants`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/infos`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const partnerPages: MetadataRoute.Sitemap = partners.map((partner) => ({
    url: `${BASE_URL}/partenaires/${partner.id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const speakerPages: MetadataRoute.Sitemap = speakers.map((speaker) => ({
    url: `${BASE_URL}/intervenants/${speaker.id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...partnerPages, ...speakerPages];
}
