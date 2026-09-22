import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import BottomNav from "@/components/BottomNav";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        <Nav />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
