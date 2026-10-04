import Link from "next/link";
import { ArrowLeftIcon, SparklesIcon } from "lucide-react";

export const metadata = {
  title: "Page introuvable — JCI Experience 2026",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-20 text-center text-paper">
      <p className="font-sans text-xs uppercase tracking-wide2 text-blue">
        JCI Experience 2026
      </p>
      <h1 className="mt-6 font-serif text-6xl md:text-7xl">404</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/70">
        Cette page n’existe pas ou a été déplacée. Retournez à l’accueil ou
        créez votre visuel de participation.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-blue"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour à l’accueil
        </Link>
        <Link
          href="/j-y-seri"
          className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition-colors hover:border-white hover:bg-white/10"
        >
          <SparklesIcon className="h-4 w-4" />
          J’y serai
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper/45">
        <Link href="/programme" className="hover:text-blue">
          Programme
        </Link>
        <Link href="/intervenants" className="hover:text-blue">
          Intervenants
        </Link>
        <Link href="/partenaires" className="hover:text-blue">
          Partenaires
        </Link>
        <Link href="/infos" className="hover:text-blue">
          Infos pratiques
        </Link>
      </div>
    </main>
  );
}
