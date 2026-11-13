import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cabecera } from "@/components/fogar/sitio/Cabecera";
import { Pie } from "@/components/fogar/sitio/Pie";
import { Apertura } from "@/components/fogar/tv/Apertura";
import { Mando } from "@/components/fogar/tv/Mando";
import { Emparejar } from "@/components/fogar/tv/Emparejar";
import { Montaje } from "@/components/fogar/tv/Montaje";
import { MasCosas } from "@/components/fogar/tv/MasCosas";
import { Final } from "@/components/fogar/tv/Final";
import "@/components/fogar/tv/tv.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tv.meta" });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: locale === "es" ? "es_ES" : "en_US" },
  };
}

export default async function FogarTvPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tv");
  return (
    <>
      {/* Salta la tele fija (bloques 1 a 3) y lleva el foco al mando. */}
      <a href="#tv-t-s4" className="f-saltar">{t("saltar")}</a>
      <Cabecera actual="tv" />
      <main>
        {/* Bloques 1 a 3: una sola tele fija (la sala, la serie y la receta). */}
        <Apertura />
        {/* Bloques 4 y 5: el móvil como mando. Se quedan (Sito, 13-11). */}
        <Mando />
        <Emparejar />
        <Montaje />
        <MasCosas />
        <Final />
      </main>
      <Pie />
    </>
  );
}
