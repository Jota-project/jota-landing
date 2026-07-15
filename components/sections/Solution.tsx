import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";

export async function Solution() {
  const t = await getTranslations("solution");
  const pillars = [t("pillar1"), t("pillar2"), t("pillar3")];
  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    >
      <ul className="mt-2 flex flex-col gap-4">
        {pillars.map((p, i) => (
          <li key={i} className="flex gap-4">
            <span className="font-display text-xl text-malva leading-snug">
              0{i + 1}
            </span>
            <span className="text-base text-ink leading-snug">{p}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
