import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";

export async function CloudVsLocal() {
  const t = await getTranslations("model");
  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    >
      <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <Card variant="tint-malva" className="relative flex flex-col gap-4">
          <span className="absolute right-5 top-5 rounded-pill bg-malva px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">
            {t("recommended")}
          </span>
          <h3 className="font-display text-[1.6rem] font-medium text-ink">
            {t("cloudTitle")}
          </h3>
          <p className="text-base text-ink leading-relaxed">
            {t("cloudBody")}
          </p>
        </Card>
        <Card variant="tint-linen-2" className="flex flex-col gap-4">
          <h3 className="font-display text-[1.6rem] font-medium text-ink">
            {t("localTitle")}
          </h3>
          <p className="text-base text-ink-soft leading-relaxed">
            {t("localBody")}
          </p>
        </Card>
      </div>
    </Section>
  );
}
