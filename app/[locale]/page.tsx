import { setRequestLocale, getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Orb } from "@/components/Orb";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const note = await getTranslations("placeholder");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-12 px-6 py-16 md:py-24">
      <header className="flex items-center justify-between">
        <span className="font-display text-xl font-medium text-ink">J</span>
        <LanguageToggle />
      </header>

      <section className="flex flex-col items-start gap-6">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-display text-[clamp(2.6rem,7vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
          {t("title")}
        </h1>
        <p className="max-w-[34ch] text-lg text-ink-soft">{t("subtitle")}</p>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link href="/components">
            <Button variant="primary">{t("ctaComponents")}</Button>
          </Link>
          <Orb className="ml-2" />
        </div>

        <p className="mt-4 max-w-prose text-sm text-ink-soft">{note("note")}</p>
      </section>
    </main>
  );
}
