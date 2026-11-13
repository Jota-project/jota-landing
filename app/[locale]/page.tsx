import { getTranslations, setRequestLocale } from "next-intl/server";
import { DireccionD } from "@/components/fogar/direcciones/d/DireccionD";
import { Resto } from "@/components/fogar/landing/Resto";
import { Esquina } from "@/components/fogar/sitio/Esquina";
import { Pie } from "@/components/fogar/sitio/Pie";

/** La portada: el recorrido por la sala (dirección D, «Hilo») y, debajo, instalar, privacidad, puertas y pie. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home.d");
  return (
    <>
      {/* Lo primero al tabular: antes que la esquina y que el botón de pausa. */}
      <a href="#instala-t" className="f-saltar f-saltar-fijo">{t("saltar")}</a>
      <Esquina />
      <main>
        <DireccionD />
        <Resto />
      </main>
      <Pie />
    </>
  );
}
