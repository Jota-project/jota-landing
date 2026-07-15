import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";

export async function HowItWorks() {
  const t = await getTranslations("how");
  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];
  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    >
      <ol className="mt-2 grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-card border border-line bg-white p-5"
          >
            <span className="font-display text-2xl text-malva leading-none">
              {i + 1}
            </span>
            <span className="text-sm text-ink leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}