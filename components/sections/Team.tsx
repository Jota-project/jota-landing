import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function Team() {
  const t = await getTranslations("team");
  const members = t.raw("members") as Array<{
    name: string;
    role: string;
    bio: string;
  }>;

  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    >
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {members.map((m) => (
          <Card key={m.name} className="flex flex-col items-center gap-4 text-center">
            <span
              aria-hidden="true"
              className="flex h-20 w-20 items-center justify-center rounded-full text-white font-display text-2xl font-medium"
              style={{
                background:
                  "radial-gradient(circle at 32% 30%, #A99AD1, #7C6AAE 46%, #6E8CC4 100%)",
              }}
            >
              {initials(m.name)}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-xl font-medium text-ink">
                {m.name}
              </h3>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-malva">
                {m.role}
              </p>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">{m.bio}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
