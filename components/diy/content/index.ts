import { articleEn } from "./article.en";
import { articleEs } from "./article.es";
import { indexEn } from "./index.en";
import { indexEs } from "./index.es";

export const diyIndex = (locale: string) => (locale === "es" ? indexEs : indexEn);
export const diyArticle = (locale: string) => (locale === "es" ? articleEs : articleEn);

/** title/description con openGraph y twitter completos: reemplazan los objetos enteros del layout (como /jota-screen). */
export function diyMetadata(locale: string, { title, description }: { title: string; description: string }) {
  const isEs = locale === "es";
  const ogImage = isEs ? "/og-image.png" : "/og-image-en.png";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website" as const,
      locale: isEs ? "es_ES" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" as const, title, description, images: [ogImage] },
  };
}
