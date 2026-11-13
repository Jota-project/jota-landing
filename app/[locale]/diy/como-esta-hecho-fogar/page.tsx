import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Articulo } from "@/components/fogar/diy/Articulo";
import { Cabecera } from "@/components/fogar/sitio/Cabecera";
import { Pie } from "@/components/fogar/sitio/Pie";
import { diyArticulo, diyIndice, diyMetadata } from "@/content/fogar/diy";
import { SLUG } from "@/content/fogar/diy/entrada";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return diyMetadata(locale, diyArticulo(locale).meta);
}

export default async function ComoEstaHechoFogarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ficha = diyIndice(locale).entradas.find((e) => e.slug === SLUG)!;
  return (
    <>
      <Cabecera actual="diy" />
      {/* key: al cambiar de idioma se remonta entero y el hilo y la casa no arrastran estado */}
      <main key={locale}>
        <Articulo c={diyArticulo(locale)} ficha={ficha} />
      </main>
      <Pie />
    </>
  );
}
