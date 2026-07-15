import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";

export async function Problem() {
  const t = await getTranslations("problem");
  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    />
  );
}
