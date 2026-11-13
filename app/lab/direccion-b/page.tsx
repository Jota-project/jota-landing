import type { Metadata } from "next";
import { DireccionB } from "@/components/fogar/direcciones/b/DireccionB";

export const metadata: Metadata = { title: "Dirección B · Vidrio", robots: { index: false } };

export default function Page() {
  return <DireccionB />;
}
