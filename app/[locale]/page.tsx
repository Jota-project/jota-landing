import { getTranslations, setRequestLocale } from "next-intl/server";
import { GITHUB_ORG } from "@/lib/github";
import { CONTACT_EMAIL } from "@/lib/contact";

// shortcut: página provisional mientras se construye la landing nueva (spec en el vault, JLD Spec 2026-11-12).
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 px-6 md:px-16">
      <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none tracking-[-0.035em]">Fogar</h1>
      <p className="text-hueso-suave">{t("soon")}</p>
      <p className="flex gap-6 text-[15px]">
        <a className="underline underline-offset-4" href={GITHUB_ORG}>{t("code")}</a>
        <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{t("contact")}</a>
      </p>
    </main>
  );
}
