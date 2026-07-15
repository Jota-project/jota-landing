import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

export async function Engineering() {
  const t = await getTranslations("engineering");
  const proofs = [t("proof1"), t("proof2"), t("proof3"), t("proof4")];
  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    >
      <div className="mt-4 flex flex-col gap-8">
        <div className="flex justify-center">
          <ArchitectureDiagram variant="engineering" />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {proofs.map((p, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-card border border-line bg-white p-4"
            >
              <span
                aria-hidden="true"
                className="mt-1 h-2 w-2 shrink-0 rounded-full bg-malva"
              />
              <span className="text-sm text-ink leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
