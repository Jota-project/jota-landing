import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { h2, sub } from "./comun";

/** Una frase partida en palabras (--i = orden) para que entren de una en una. */
export function Palabras({ texto }: { texto: string }) {
  return <>{texto.split(" ").map((p, i) => <span key={i} className="tv-pal" style={{ "--i": i } as CSSProperties}>{p} </span>)}</>;
}

/*
 * Bloque 2, dentro de la tele fija: viendo una serie, Fogar contesta arriba sin pausarla; luego le piden un aviso y lo
 * pendiente (la cena) se queda en una esquina con su anillo contando. Los pasos los marca Apertura en `data-e`.
 */
export function EscenaContesta() {
  const t = useTranslations("tv");
  return (
    <div className="tv-e2">
      <div className="tv-serie" />
      <div className="tv-txt tv-arriba">
        <div className="tv-vidrio tv-pild tv-pild-1">
          <p className="text-[color:var(--hueso-suave)]">{t("chat.series1You")}</p>
          <p className="mt-[.5cqw] text-[1.3em] font-medium"><Palabras texto={t("chat.series1Fogar")} /></p>
        </div>
        <div className="tv-vidrio tv-pild tv-pild-2">
          <p className="text-[color:var(--hueso-suave)]">{t("chat.series2You")}</p>
          <p className="tv-herr mt-[.6cqw] inline-flex items-center gap-[.8cqw] text-[color:var(--hueso-suave)]"><i className="tv-punto" />{t("chat.toolTimer")}</p>
          <p className="mt-[.3cqw] text-[1.3em] font-medium"><Palabras texto={t("chat.series2Fogar")} /></p>
        </div>
        <div className="tv-vidrio tv-cena">
          <svg viewBox="0 0 20 20" className="size-[2.2cqw] min-h-3 min-w-3" aria-hidden>
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.2" />
            <circle className="tv-anillo" cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="50.3" transform="rotate(-90 10 10)" />
          </svg>
          <span className="font-medium">{t("tv.activityLabel")}</span>
          <span className="tabular-nums text-[color:var(--hueso-suave)]">{t("tv.activityTime")}</span>
        </div>
      </div>
      <div className="tv-txt absolute inset-x-[4%] bottom-[6%]">
        <p className="text-[color:var(--hueso-suave)]">{t("tv.showTitle")} · {t("tv.showMeta")}</p>
        <div className="mt-[1cqw] h-[.3cqw] min-h-0.5 rounded-full bg-[color:var(--hueso)]/20"><div className="tv-avance h-full rounded-full bg-[color:var(--hueso)]" /></div>
      </div>
    </div>
  );
}

/** El paso 2 en la pista: su rótulo (fijo bajo la tele mientras dura) y la conversación entera para lectores de pantalla. */
export function PasoContesta() {
  const t = useTranslations("tv");
  return (
    <section id="s2" aria-labelledby="tv-t-s2" className="tv-paso tv-paso-2">
      <div className="tv-rotulo">
        <h2 id="tv-t-s2" className={h2}>{t("s2.caption1")}</h2>
        <p className={sub}>{t("s2.caption2")}</p>
      </div>
      <ol className="sr-only">
        {[t("chat.series1You"), t("chat.series1Fogar"), t("chat.series2You"), t("chat.series2Fogar"), `${t("tv.activityLabel")} ${t("tv.activityTime")}`].map((l) => <li key={l}>{l}</li>)}
      </ol>
    </section>
  );
}
