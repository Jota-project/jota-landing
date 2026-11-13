import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Indice } from "@/components/fogar/diy/Indice";
import { Cabecera } from "@/components/fogar/sitio/Cabecera";
import { Pie } from "@/components/fogar/sitio/Pie";
import { diyIndice, diyMetadata } from "@/content/fogar/diy";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return diyMetadata(locale, diyIndice(locale).meta);
}

export default async function DiyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Cabecera actual="diy" />
      <main>
        <Indice c={diyIndice(locale)} />
      </main>
      <Pie />
    </>
  );
}
