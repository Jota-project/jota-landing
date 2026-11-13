import { useTranslations } from "next-intl";
import { h2, sub } from "./comun";
import { Palabras } from "./Contesta";

/*
 * Bloque 3, dentro de la tele fija: con la pantalla libre, Fogar TV hace su pasada (el jazz de tele.ts, en el lienzo);
 * después la píldora «Abrir en la tele» se pulsa y la web de la receta crece desde ella hasta llenar la tele.
 */
export function EscenaCompleta() {
  const t = useTranslations("tv");
  return (
    <div className="tv-e3">
      <div className="tv-web tv-txt">
        <div className="flex items-center gap-[2.4cqw] border-b border-[color:var(--noche)]/15 px-[4%] py-[1.8cqw]">
          <b className="font-semibold">{t("tv.recipeName")}</b>
          <span className="max-[480px]:hidden">{t("tv.recipeNav1")}</span>
          <span className="max-[480px]:hidden">{t("tv.recipeNav2")}</span>
          <span className="max-[480px]:hidden">{t("tv.recipeNav3")}</span>
          <span className="ml-auto opacity-70">{t("tv.recipeSite")}</span>
        </div>
        <div className="px-[4%] pt-[4cqw]">
          <p className="font-display text-[2.2em] leading-[1.05] tracking-[-0.035em]">{t("tv.recipeTitle")}</p>
          <div className="mt-[3cqw] grid gap-[1.2cqw]">
            {[100, 92, 78].map((w) => <i key={w} className="block h-[1.1cqw] rounded-full bg-[color:var(--noche)]/12" style={{ width: `${w * 0.6}%` }} />)}
          </div>
          <div className="tv-galeria mt-[3.5cqw] grid grid-cols-3 gap-[1.6cqw]">
            {["#8fae8b", "#b9ae9a", "#6d8a96"].map((c) => <i key={c} className="block aspect-[4/3] rounded-[1cqw]" style={{ background: c }} />)}
          </div>
        </div>
      </div>
      <div className="tv-txt tv-arriba">
        <div className="tv-vidrio tv-pild tv-pild-3">
          <p className="text-[color:var(--hueso-suave)]">{t("chat.recipeYou")}</p>
          <p className="mt-[.5cqw] text-[1.3em] font-medium"><Palabras texto={t("chat.recipeFogar")} /></p>
        </div>
      </div>
      <div className="tv-txt tv-vidrio tv-abrir">
        <span className="font-medium">{t("chat.toolWeb")}</span>
        <span className="text-[color:var(--hueso-suave)]">{t("chat.toolWebSub")}</span>
      </div>
    </div>
  );
}

/** El paso 3 en la pista: rótulo y conversación para lectores de pantalla (la pasada del lienzo y la receta). */
export function PasoCompleta() {
  const t = useTranslations();
  return (
    <section id="s3" aria-labelledby="tv-t-s3" className="tv-paso tv-paso-3">
      <div className="tv-rotulo">
        <h2 id="tv-t-s3" className={h2}>{t("tv.s3.caption1")}</h2>
        <p className={sub}>{t("tv.s3.caption2")}</p>
      </div>
      <ol className="sr-only">
        {[t("tele.oido"), t("tele.respuesta"), t("tv.chat.recipeYou"), `${t("tv.chat.toolWeb")}: ${t("tv.chat.toolWebSub")}`, t("tv.chat.recipeFogar")].map((l) => <li key={l}>{l}</li>)}
      </ol>
    </section>
  );
}
