import { setRequestLocale } from "next-intl/server";
import { DireccionD } from "@/components/fogar/direcciones/d/DireccionD";
import { Resto } from "@/components/fogar/landing/Resto";
import { Pie } from "@/components/fogar/sitio/Pie";

/** La portada: el recorrido por la sala (dirección D, «Hilo») y, debajo, instalar, privacidad, puertas y pie. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <main>
        <DireccionD />
        <Resto />
      </main>
      <Pie />
    </>
  );
}
