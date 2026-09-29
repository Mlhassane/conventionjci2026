import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Arvo } from "next/font/google";
import "./globals.css";
import { getEventSettings } from "@/lib/data";
import Nav from "@/components/Nav";
import BottomNav from "@/components/BottomNav";

/** JCI primary typeface */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

/** JCI secondary typeface — large quotes / callouts only */
const arvo = Arvo({
  subsets: ["latin"],
  variable: "--font-arvo",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const dynamic = "force-dynamic";

/** Titre et description de la page : pilotés depuis l'admin > Paramètres. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getEventSettings();
  const title = settings.event_name;
  const description =
    settings.seo_description || settings.hero_text || settings.tagline;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    ),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: "/hero_image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "fr_FR",
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${arvo.variable}`}>
      <body className="font-sans antialiased">
        <Nav />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
