import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const t = await getTranslations("diy");
  return (
    <>
      <a href="#contenido" className="f-foco sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[color:var(--hueso)] focus:px-4 focus:py-2 focus:text-[color:var(--noche)]">{t("saltar")}</a>
      <Cabecera actual="diy" />
      <main id="contenido" tabIndex={-1} className="outline-none">
        <Indice c={diyIndice(locale)} />
      </main>
      <Pie />
    </>
  );
}
