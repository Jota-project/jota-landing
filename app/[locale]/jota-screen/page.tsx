import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@/components/screen/screen.css";
import { Button } from "@/components/Button";
import { CONTACT_EMAIL } from "@/components/sections/Contact";
import { TrackA } from "@/components/screen/tracks/TrackA";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "screen.meta" });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JotaScreenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("screen");
  const c = await getTranslations("contact");
  const items = t.raw("s7.items") as { title: string; body: string }[];

  const mail = (subject: string) =>
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

  // Scenes 1–3 are tramo A; the rest are static text until later tasks replace
  // them with tracks. Every scene keeps its id and its captions as real text.
  return (
    <main className="jscreen">
      <TrackA />

      <div className="bg-[#211b2a] text-linen">
        <section id="s4" className="mx-auto w-full max-w-5xl space-y-3 px-6 py-16">
          <p>{t("s4.caption1")}</p>
          <p>{t("s4.caption2")}</p>
        </section>
        <section id="s5" className="mx-auto w-full max-w-5xl space-y-3 px-6 py-16">
          <p>{t("s5.caption1")}</p>
          <p>{t("s5.caption2")}</p>
          <ul className="flex flex-wrap gap-4 text-sm">
            <li>{t("s5.admin")}</li>
            <li>{t("s5.member")}</li>
            <li>
              {t("s5.guest")} · {t("s5.guestExpiry")}
            </li>
          </ul>
        </section>
        <section id="s6" className="mx-auto w-full max-w-5xl space-y-3 px-6 py-16">
          <p>{t("s6.line1")}</p>
          <p>{t("s6.line2")}</p>
          <p className="text-sm">{t("s6.soon")}</p>
          <p className="text-sm">{t("s6.network")}</p>
        </section>
        <section id="s7" className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl">{t("s7.title")}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.title}>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm opacity-80">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <section id="s8" className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-3xl md:text-5xl">{t("s8.headline")}</h2>
          <p className="mt-4">{t("s8.line")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href={mail(c("waitlistSubject"))}>
              <Button variant="primary">{t("s8.ctaWaitlist")}</Button>
            </a>
            <a href={mail(c("emailSubject"))}>
              <Button variant="ghost" className="!text-linen">
                {t("s8.ctaTalk")}
              </Button>
            </a>
          </div>
        </section>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <Link href="/" className="text-sm text-malva underline-offset-4 hover:underline">
          {t("s8.back")}
        </Link>
      </div>
    </main>
  );
}
