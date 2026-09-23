import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Arvo } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "Convention JCI Niger 2026 — JCI Experience",
  description:
    "Découvrez la Convention JCI Niger 2026 : programme, participants, intervenants, partenaires, badges et expérience digitale.",
  openGraph: {
    title: "Convention JCI Niger 2026 — JCI Experience",
    description:
      "Découvrez la Convention JCI Niger 2026 : programme, participants, intervenants, partenaires, badges et expérience digitale.",
    images: ["/og-image.jpg"],
    locale: "fr_FR",
    type: "website",
  },
};

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
