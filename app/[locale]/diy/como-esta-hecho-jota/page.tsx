import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import "@/components/diy/diy.css";
import { DiyArticle } from "@/components/diy/DiyArticle";
import { diyArticle, diyMetadata } from "@/components/diy/content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return diyMetadata(locale, diyArticle(locale).meta);
}

export default async function ComoEstaHechoJotaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  // key: al cambiar de idioma se remonta entero, así el diagrama no arrastra estado del DOM anterior
  return <DiyArticle key={locale} c={diyArticle(locale)} />;
}
