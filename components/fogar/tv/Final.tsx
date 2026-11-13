import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL } from "@/lib/contact";
import { REPOS } from "@/lib/repos";
import { bloque, sub } from "./comun";

/** Bloque 8: cierre. Sin lista de espera (pendiente de Sito): «Hablemos» por correo y el código. */
export async function Final() {
  const t = await getTranslations("tv.s8");
  return (
    <section id="s8" aria-labelledby="tv-t-s8" className={bloque}>
      <h2 id="tv-t-s8" className="font-display text-[clamp(34px,5.4vw,68px)] leading-[1.04] tracking-[-0.035em] text-balance">{t("headline")}</h2>
      <p className={sub}>{t("line")}</p>
      <p className="mt-10 flex flex-wrap items-center gap-4">
        <a href={`mailto:${CONTACT_EMAIL}`} className="f-boton f-boton-claro f-foco">{t("ctaTalk")}</a>
        <a href={REPOS.tv} className="f-boton f-foco">{t("code")}</a>
        <Link href="/" className="f-enlace f-foco ml-2 inline-flex min-h-11 items-center text-[15px] text-[color:var(--hueso-suave)]">{t("back")}</Link>
      </p>
    </section>
  );
}
