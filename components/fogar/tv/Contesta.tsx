import { getTranslations } from "next-intl/server";
import { bloque, h2, sub } from "./comun";

/** Bloque 2: viendo una serie, Fogar contesta arriba sin pausarla y lo pendiente (la cena) se queda en una esquina. */
export async function Contesta() {
  const t = await getTranslations("tv");
  return (
    <section id="s2" aria-labelledby="tv-t-s2" className={bloque}>
      <h2 id="tv-t-s2" className={h2}>{t("s2.caption1")}</h2>
      <p className={sub}>{t("s2.caption2")}</p>
      <div role="img" aria-label={`${t("chat.series1You")} ${t("chat.series1Fogar")} · ${t("tv.activityLabel")} ${t("tv.activityTime")}`} className="tv-marco mt-12 md:mt-16">
        <div className="tv-serie" />
        <div className="tv-txt tv-vidrio absolute left-1/2 top-[5%] w-[64%] -translate-x-1/2 rounded-[2cqw] px-[2.4cqw] py-[1.6cqw]">
          <p className="text-[color:var(--hueso-suave)]">{t("chat.series1You")}</p>
          <p className="mt-[.5cqw] text-[1.3em] font-medium">{t("chat.series1Fogar")}</p>
        </div>
        <div className="tv-txt tv-vidrio absolute right-[3.5%] top-[5%] flex items-center gap-[1cqw] rounded-full py-[.9cqw] pl-[1cqw] pr-[1.8cqw]">
          <svg viewBox="0 0 20 20" className="size-[2.2cqw]" aria-hidden>
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.2" />
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="50.3" strokeDashoffset="17" transform="rotate(-90 10 10)" />
          </svg>
          <span className="font-medium">{t("tv.activityLabel")}</span>
          <span className="tabular-nums text-[color:var(--hueso-suave)]">{t("tv.activityTime")}</span>
        </div>
        <div className="tv-txt absolute inset-x-[4%] bottom-[6%]">
          <p className="text-[color:var(--hueso-suave)]">{t("tv.showTitle")} · {t("tv.showMeta")}</p>
          <div className="mt-[1cqw] h-[.3cqw] rounded-full bg-[color:var(--hueso)]/20"><div className="h-full w-[38%] rounded-full bg-[color:var(--hueso)]" /></div>
        </div>
      </div>
    </section>
  );
}
