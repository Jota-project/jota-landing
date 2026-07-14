"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = routing.locales.find((l) => l !== locale) ?? "es";

  function handleClick() {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Switch language"
      className="rounded-pill border-[1.5px] border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft transition-colors duration-150 hover:border-malva hover:text-malva focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-malva disabled:opacity-50"
    >
      {locale.toUpperCase()} → {nextLocale.toUpperCase()}
    </button>
  );
}
