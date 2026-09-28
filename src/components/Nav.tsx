"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  href: string;
  label: string;
  /** show on lg+ (desktop nav) */
  primary?: boolean;
};

const LINKS: NavItem[] = [
  { href: "/", label: "Accueil", primary: true },
  { href: "/programme", label: "Programme", primary: true },
  { href: "/intervenants", label: "Intervenants", primary: true },
  { href: "/partenaires", label: "Partenaires", primary: true },
  { href: "/infos", label: "Infos", primary: true },
  { href: "/participants", label: "Participants" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  const isHome = pathname === "/";
  const overHero = isHome && !scrolled;

  return (
    <>
      {!isHome && (
        <div aria-hidden className="h-[5.5rem] md:h-[7rem]" />
      )}

      <header
        className={`fixed top-5 md:top-7 left-1/2 -translate-x-1/2 z-50 w-[96%] md:w-[80%] transition-all duration-300 bg-paper border border-line/10 shadow-nav ${
          open ? "rounded-[1.75rem]" : "rounded-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 h-12 md:h-14 px-3 md:px-4">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 min-w-0"
          >
            <Image
              src="/logo.png"
              alt="JCI Experience"
              width={112}
              height={40}
              priority
              className="h-9 md:h-11 w-auto object-contain transition-opacity group-hover:opacity-85"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 min-w-0">
            {LINKS.filter((l) => l.primary).map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors ${
                    active
                      ? "bg-blue text-paper font-semibold"
                      : "text-ink/65 hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="lg:hidden flex shrink-0 items-center justify-center h-9 w-9 -mr-1 rounded-xl text-ink"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative flex flex-col gap-1.5 w-5">
              <span
                className={`block h-[1.5px] w-full bg-current transition-transform rounded-full ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] w-full bg-current transition-opacity rounded-full ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-[1.5px] w-full bg-current transition-transform rounded-full ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
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
              <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {LINKS.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`rounded-xl px-3 py-2.5 text-sm text-center transition-colors ${
                          active
                            ? "bg-blue/10 text-blue-dark font-semibold"
                            : "text-ink hover:bg-ink/5"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
