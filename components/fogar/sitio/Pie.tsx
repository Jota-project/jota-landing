import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL } from "@/lib/contact";
import { GITHUB_ORG } from "@/lib/github";
import { Copiar } from "./Copiar";
import { Idioma } from "./Idioma";

/*
 * Pie común. Decidido por Sito (plan JLD 2026-11-13, §5): sin lista de espera ni línea de equipo, solo enlaces;
 * el correo se queda el actual (lib/contact.ts) y cambia al final de la migración.
 */
export async function Pie() {
  const t = await getTranslations("sitio");
  return (
    <footer id="contacto" className="border-t border-[color:var(--veta)]">
      <div className="f-ancho grid gap-12 py-16 md:grid-cols-[1fr_auto] md:gap-24">
        <div>
          <h2 className="font-display text-[clamp(26px,3vw,36px)] leading-[1.1] tracking-[-0.035em]">{t("pie.pregunta")}</h2>
          <p className="mt-3 max-w-[44ch] text-[17px] leading-[1.5] text-[color:var(--hueso-suave)]">{t("pie.cuerpo")}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={`mailto:${CONTACT_EMAIL}`} className="f-enlace f-foco select-all text-[17px] text-[color:var(--hueso)]">{CONTACT_EMAIL}</a>
            <Copiar texto={CONTACT_EMAIL} label={t("pie.copiar")} hecho={t("pie.copiada")} />
          </p>
        </div>
        <nav aria-label={t("pie.mapa")}>
          <ul className="flex flex-col gap-1 text-[15px] text-[color:var(--hueso-suave)]">
            <li><Link href="/" className="f-enlace f-foco inline-flex min-h-11 items-center">{t("nav.inicio")}</Link></li>
            <li><Link href="/fogar-tv" className="f-enlace f-foco inline-flex min-h-11 items-center">{t("nav.tv")}</Link></li>
            <li><Link href="/diy" className="f-enlace f-foco inline-flex min-h-11 items-center">{t("nav.diy")}</Link></li>
            <li><a href={GITHUB_ORG} className="f-enlace f-foco inline-flex min-h-11 items-center">{t("nav.codigo")}</a></li>
          </ul>
        </nav>
      </div>
      <div className="f-ancho flex items-center justify-between gap-6 border-t border-[color:var(--veta)] py-5 text-[13px] text-[color:var(--hueso-tenue)]">
        <p>© {new Date().getFullYear()} Fogar</p>
        <Idioma />
      </div>
    </footer>
  );
}
