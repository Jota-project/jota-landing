import { getTranslations } from "next-intl/server";
import { bloque, h2, sub } from "./comun";
import { Pantalla } from "./Pantalla";

/** Bloque 3: con la pantalla libre, Fogar TV de verdad pone música (la conversación de tele.ts) y abre la web de una receta. */
export async function Completa() {
  const t = await getTranslations();
  return (
    <section id="s3" aria-labelledby="tv-t-s3" className={bloque}>
      <h2 id="tv-t-s3" className={h2}>{t("tv.s3.caption1")}</h2>
      <p className={sub}>{t("tv.s3.caption2")}</p>
      <div className="mt-12 grid gap-6 md:mt-16 lg:grid-cols-2">
        <Pantalla habla label={`${t("tele.oido")}. ${t("tele.respuesta")}`} />
        <div role="img" aria-label={`${t("tv.chat.recipeYou")} ${t("tv.chat.recipeFogar")} ${t("tv.tv.recipeTitle")}`} className="tv-marco">
          <div className="tv-web tv-txt">
            <div className="flex items-center gap-[2.4cqw] border-b border-[color:var(--noche)]/15 px-[4%] py-[1.8cqw]">
              <b className="font-semibold">{t("tv.tv.recipeName")}</b>
              <span>{t("tv.tv.recipeNav1")}</span>
              <span>{t("tv.tv.recipeNav2")}</span>
              <span>{t("tv.tv.recipeNav3")}</span>
              <span className="ml-auto opacity-60">{t("tv.tv.recipeSite")}</span>
            </div>
            <div className="px-[4%] pt-[4cqw]">
              <p className="font-display text-[2.2em] leading-[1.05] tracking-[-0.035em]">{t("tv.tv.recipeTitle")}</p>
              <div className="mt-[3cqw] grid gap-[1.2cqw]" aria-hidden>
                {[100, 92, 78].map((w) => <i key={w} className="block h-[1.1cqw] rounded-full bg-[color:var(--noche)]/12" style={{ width: `${w * 0.6}%` }} />)}
              </div>
              <div className="mt-[3.5cqw] grid grid-cols-3 gap-[1.6cqw]" aria-hidden>
                {["#8fae8b", "#b9ae9a", "#6d8a96"].map((c) => <i key={c} className="block aspect-[4/3] rounded-[1cqw]" style={{ background: c }} />)}
              </div>
            </div>
          </div>
          <div className="tv-txt tv-vidrio absolute bottom-[5%] left-1/2 flex -translate-x-1/2 items-center gap-[1.4cqw] whitespace-nowrap rounded-full px-[2cqw] py-[1cqw] text-[color:var(--hueso)]">
            <span className="font-medium">{t("tv.chat.toolWeb")}</span>
            <span className="text-[color:var(--hueso-suave)]">{t("tv.chat.toolWebSub")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
