import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="bg-linen-2 border-t border-line mt-12">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-6 py-10 md:flex-row md:items-center">
        <p className="font-display text-base text-ink">{t("tagline")}</p>
        <p className="text-xs text-ink-soft">
          © {year} Jota. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
