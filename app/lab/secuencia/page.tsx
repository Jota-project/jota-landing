import type { Metadata } from "next";
import { SecuenciaLab } from "./SecuenciaLab";

export const metadata: Metadata = { title: "Laboratorio de la secuencia", robots: { index: false } };

export default function SecuenciaPage() {
  return <SecuenciaLab />;
}
