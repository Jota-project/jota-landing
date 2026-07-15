import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";

export async function WhyNow() {
  const t = await getTranslations("why");
  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    />
  );
}
