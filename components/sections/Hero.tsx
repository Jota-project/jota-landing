import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/Button";
import { Orb } from "@/components/Orb";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

export async function Hero() {
  const t = await getTranslations("hero");
  return (
    <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col gap-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-malva">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-[clamp(2.6rem,7vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
          {t("headline")}
          <br />
          <em className="italic text-malva">{t("headlineItalic")}</em>
        </h1>
        <p className="max-w-[34ch] text-lg text-ink-soft">{t("subhead")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link href="#contact">
            <Button variant="primary">{t("ctaPrimary")}</Button>
          </Link>
          <Link href="#what">
            <Button variant="ghost">{t("ctaSecondary")}</Button>
          </Link>
          <Orb className="ml-2 hidden md:block" />
        </div>
      </div>
      <div className="flex items-center justify-center md:justify-end">
        <ArchitectureDiagram variant="hero" />
      </div>
    </div>
  );
}