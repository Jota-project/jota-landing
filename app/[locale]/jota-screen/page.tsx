import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@/components/screen/screen-tv.css";
import "@/components/screen/screen-tv-screens.css";
import "@/components/screen/screen-track-a.css";
import "@/components/screen/screen-track-b.css";
import "@/components/screen/screen-end.css";
import { MoreList } from "@/components/screen/MoreList";
import { TrackA } from "@/components/screen/tracks/TrackA";
import { TrackB } from "@/components/screen/tracks/TrackB";
import { TrackC } from "@/components/screen/tracks/TrackC";
import { TrackD } from "@/components/screen/tracks/TrackD";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "screen.meta" });
  const title = t("title");
  const description = t("description");
  // openGraph and twitter replace the layout's whole objects, so the image and locale go again
  const isEs = locale === "es";
  const ogImage = isEs ? "/og-image.png" : "/og-image-en.png";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: isEs ? "es_ES" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function JotaScreenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Tramos A–D are sticky tracks (scenes 1–6 and 8); scene 7 is a plain list. Every scene keeps
  // its id and its captions as real text. The page opens and closes on linen (TrackD ends there).
  return (
    <main className="jscreen">
      <TrackA />

      <div className="bg-[#211b2a] text-linen">
        <TrackB />
        <TrackC />
        <MoreList />
        <TrackD />
      </div>
    </main>
  );
}
