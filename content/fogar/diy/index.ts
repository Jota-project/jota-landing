import type { Metadata } from "next";
import { articuloEn } from "./articulo.en";
import { articuloEs } from "./articulo.es";
import { indiceEn } from "./indice.en";
import { indiceEs } from "./indice.es";

export const diyIndice = (locale: string) => (locale === "es" ? indiceEs : indiceEn);
export const diyArticulo = (locale: string) => (locale === "es" ? articuloEs : articuloEn);

/** title/description con openGraph: reemplaza el objeto entero del layout. */
export function diyMetadata(locale: string, { title, description }: { title: string; description: string }): Metadata {
  return { title, description, openGraph: { title, description, type: "website", locale: locale === "es" ? "es_ES" : "en_US" } };
}
