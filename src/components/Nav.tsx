"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/visuel", label: "Mon visuel" },
  { href: "/badge", label: "Mon badge" },
  { href: "/programme", label: "Programme" },
  { href: "/intervenants", label: "Intervenants" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/participants", label: "Participants" },
  { href: "/infos", label: "Infos pratiques" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header
      className={`sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b transition-shadow duration-300 ${
        scrolled ? "border-line/10 shadow-nav" : "border-line/5"
      }`}
    >
      <div className="container-edge flex items-center justify-between h-16 md:h-[68px]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper font-serif text-[11px] font-semibold tracking-tight transition-colors group-hover:bg-blue group-hover:text-ink">
            JCI
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg md:text-xl tracking-tight">
              JCI Experience
            </span>
            <span className="font-sans text-[9px] tracking-wide2 uppercase text-blue-dark mt-1">
              Convention 2026
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {LINKS.slice(1).map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active
                    ? "bg-blue/10 text-blue-dark font-medium"
                    : "text-ink/55 hover:text-ink hover:bg-ink/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Link href="/badge" className="btn btn-primary btn-sm">
            Créer mon badge
          </Link>
        </div>

        <button
          aria-label="Ouvrir le menu"
          className="lg:hidden flex flex-col gap-1.5 p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`block h-[1.5px] w-6 bg-ink transition-transform rounded-full ${
              open ? "translate-y-[6.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] w-6 bg-ink transition-opacity rounded-full ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`block h-[1.5px] w-6 bg-ink transition-transform rounded-full ${
              open ? "-translate-y-[6.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-line/10 bg-paper"
          >
            <div className="container-edge py-4 flex flex-col gap-1">
              {LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-xl px-4 py-3 font-sans text-base transition-colors ${
                      active
                        ? "bg-blue/10 text-blue-dark font-medium"
                        : "hover:bg-ink/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/badge"
                onClick={() => setOpen(false)}
                className="btn btn-primary btn-block mt-3"
              >
                Créer mon badge
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
