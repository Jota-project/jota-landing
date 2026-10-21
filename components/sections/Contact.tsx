import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { CONTACT_EMAIL, mailtoHref } from "@/lib/contact";

export async function Contact() {
  const t = await getTranslations("contact");

  const primaryHref = mailtoHref(t("emailSubject"));
  const waitlistHref = mailtoHref(t("waitlistSubject"));

  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
      lead={t("body")}
    >
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <a href={primaryHref}>
          <Button variant="primary">{t("ctaPrimary")}</Button>
        </a>
        <a href={waitlistHref}>
          <Button variant="ghost">{t("ctaSecondary")}</Button>
        </a>
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        {CONTACT_EMAIL}
      </p>
    </Section>
  );
}
