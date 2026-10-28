"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageToggle } from "./LanguageToggle";
import { buttonClass } from "./Button";
import { useTranslations } from "next-intl";

const links = [
  { href: "/jota-screen", key: "screen" },
  { href: "/diy", key: "diy" },
  { href: "#contact", key: "contact" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
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
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          aria-label={t("skipToContent")}
          className="grid size-9 place-items-center rounded-[11px] bg-[linear-gradient(135deg,var(--color-malva),var(--color-sky))] font-display text-lg font-medium text-white"
        >
          J
        </Link>
        <ul className="hidden flex-1 gap-7 md:flex">
          {links.map((link) => {
            const current = link.href !== "#contact" && pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                {link.href === "#contact" ? (
                  <a href="#contact" className="text-sm text-ink-soft transition-colors duration-150 hover:text-malva">
                    {t(link.key)}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`text-sm transition-colors duration-150 hover:text-malva ${current ? "text-ink" : "text-ink-soft"}`}
                  >
                    {t(link.key)}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link href="/diy" className={buttonClass("primary", "hidden px-4 py-2 sm:inline-flex")}>
            {t("install")}
          </Link>
        </div>
      </div>
      {/* phone: the three sections stay reachable without a menu */}
      <ul className="flex gap-6 overflow-x-auto px-6 pb-3 md:hidden">
        {links.map((link) => (
          <li key={link.href}>
            {link.href === "#contact" ? (
              <a href="#contact" className="text-sm text-ink-soft">{t(link.key)}</a>
            ) : (
              <Link href={link.href} className="text-sm text-ink-soft">{t(link.key)}</Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
