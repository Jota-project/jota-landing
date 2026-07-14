"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { LanguageToggle } from "./LanguageToggle";
import { useTranslations } from "next-intl";

const links = [
  { href: "#hero", key: "hero" },
  { href: "#what", key: "what" },
  { href: "#model", key: "model" },
  { href: "#team", key: "team" },
  { href: "#contact", key: "contact" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className={`sticky top-0 z-50 w-full transition-[background-color,backdrop-filter,border-color] duration-200 ${
        scrolled
          ? "bg-linen/80 backdrop-blur-md border-b border-line/50"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-6 px-6">
        <Link
          href="#hero"
          aria-label={t("skipToContent")}
          className="font-display text-xl font-medium text-ink"
        >
          J
        </Link>
        <ul className="hidden gap-7 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-ink-soft hover:text-malva transition-colors duration-150"
              >
                {t(link.key)}
              </a>
            </li>
          ))}
        </ul>
        <LanguageToggle />
      </div>
    </nav>
  );
}
