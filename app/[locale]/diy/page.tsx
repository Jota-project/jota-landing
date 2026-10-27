import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import "@/components/diy/diy.css";
import { DiyIndex } from "@/components/diy/DiyIndex";
import { diyIndex, diyMetadata } from "@/components/diy/content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return diyMetadata(locale, diyIndex(locale).meta);
}

export default async function DiyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  // key: al cambiar de idioma se remonta entero, así los filtros y el diagrama no arrastran estado del DOM anterior
  return <DiyIndex key={locale} c={diyIndex(locale)} />;
}
