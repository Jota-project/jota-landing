import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Idioma } from "./Idioma";

/** Cabecera de las subpáginas (la portada no lleva: es la sala). `actual` marca la sección en la que se está. */
export async function Cabecera({ actual }: { actual?: "tv" | "diy" }) {
  const t = await getTranslations("sitio");
  const item = (href: "/fogar-tv" | "/diy", k: "tv" | "diy") => (
    <li><Link href={href} aria-current={actual === k ? "page" : undefined} className={`f-enlace f-foco inline-flex min-h-11 items-center ${actual === k ? "text-[color:var(--hueso)]" : ""}`}>{t(`nav.${k}`)}</Link></li>
  );
  return (
    <header className="f-ancho flex items-center justify-between gap-6 py-4">
      <Link href="/" className="f-foco font-display text-[22px] tracking-[-0.035em]">Fogar</Link>
      <nav aria-label={t("nav.label")}>
        <ul className="flex items-center gap-6 text-[15px] text-[color:var(--hueso-suave)]">
          {item("/fogar-tv", "tv")}
          {item("/diy", "diy")}
          <li><Idioma /></li>
        </ul>
      </nav>
    </header>
  );
}
