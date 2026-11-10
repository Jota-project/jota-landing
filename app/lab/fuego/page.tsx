import type { Metadata } from "next";
import { FuegoLab } from "./FuegoLab";

export const metadata: Metadata = {
  title: "Laboratorio del fuego",
  robots: { index: false, follow: false },
};

export default function FuegoPage() {
  return <FuegoLab />;
}
