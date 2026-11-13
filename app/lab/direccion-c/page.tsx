import type { Metadata } from "next";
import { DireccionC } from "@/components/fogar/direcciones/c/DireccionC";

export const metadata: Metadata = { title: "Dirección C · Malla", robots: { index: false } };

export default function Page() {
  return <DireccionC />;
}
