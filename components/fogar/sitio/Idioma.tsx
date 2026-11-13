"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Cambia de idioma. Sin prefijo en la URL: el idioma va en la cookie NEXT_LOCALE. */
export function Idioma({ className = "" }: { className?: string }) {
  const t = useTranslations("sitio");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pendiente, start] = useTransition();
  const otro = routing.locales.find((l) => l !== locale) ?? "es";
  return (
    <button
      type="button" disabled={pendiente} lang={otro} aria-label={t("idioma")}
      onClick={() => { document.cookie = `NEXT_LOCALE=${otro}; path=/; max-age=31536000`; start(() => router.replace(pathname, { locale: otro })); }}
      className={`f-enlace f-foco min-h-11 text-[14px] uppercase tracking-[0.08em] disabled:opacity-50 ${className}`}
    >
      {otro}
    </button>
  );
}
