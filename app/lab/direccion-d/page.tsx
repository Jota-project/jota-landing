import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { DireccionD } from "@/components/fogar/direcciones/d/DireccionD";
import es from "@/messages/es.json";

export const metadata: Metadata = { title: "Dirección D · Hilo", robots: { index: false } };

// El laboratorio queda fuera de [locale]: solo el recorrido, en español. La landing completa está en «/».
export default function Page() {
  return <NextIntlClientProvider locale="es" messages={es}><main><DireccionD /></main></NextIntlClientProvider>;
}
