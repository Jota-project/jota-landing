import type { Metadata } from "next";
import { DireccionA } from "@/components/fogar/direcciones/a/DireccionA";

export const metadata: Metadata = { title: "Dirección A · Lumbre", robots: { index: false } };

export default function Page() {
  return <DireccionA />;
}
