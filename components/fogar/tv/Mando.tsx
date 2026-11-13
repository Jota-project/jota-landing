import { getTranslations } from "next-intl/server";
import { bloque, h2, sub } from "./comun";

const TRAZO = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/*
 * Bloque 4: el móvil como mando web. Pendiente de Sito («el móvil no se trata»): se quita borrando su línea en page.tsx.
 * El mando es un esquema plano del de verdad (sin teléfono alrededor), oculto a los lectores: el texto ya lo cuenta.
 */
export async function Mando() {
  const t = await getTranslations("tv");
  return (
    <section id="s4" aria-labelledby="tv-t-s4" className={`${bloque} grid items-center gap-12 md:grid-cols-[1fr_auto] md:gap-24`}>
      <div>
        <h2 id="tv-t-s4" className={h2}>{t("s4.caption1")}</h2>
        <p className={sub}>{t("s4.caption2")}</p>
      </div>
      <div aria-hidden className="w-full max-w-[300px] justify-self-center rounded-[28px] border border-[color:var(--veta)] bg-[color:var(--piedra)] p-5 text-[14px]">
        <div className="flex items-center gap-2 font-semibold">{t("remote.room")}<i className="size-1.5 rounded-full bg-[color:var(--contra)]" /></div>
        <p className="mt-0.5 text-[13px] text-[color:var(--hueso-tenue)]">{t("tv.showTitle")} · {t("tv.showMeta")}</p>
        <div className="mt-4 flex gap-3">
          <div className="relative grid aspect-[3/4] flex-1 place-items-center rounded-[18px] border border-[color:var(--veta)] bg-[color:var(--piedra-alta)] p-3 text-center text-[13px] text-[color:var(--hueso-tenue)]">
            <i className="absolute left-[58%] top-[38%] size-3 rounded-full bg-[color:var(--hueso)] shadow-[0_0_0_8px_rgb(236_230_220/.08)]" />
            <span className="mt-auto">{t("remote.trackpadHint")}</span>
          </div>
          <div className="flex w-12 flex-col items-center justify-between rounded-[18px] border border-[color:var(--veta)] py-3">
            <svg width="20" height="20" viewBox="0 0 24 24" {...TRAZO}><path d="M6 12h12M12 6v12" /></svg>
            <span className="tabular-nums">24</span>
            <svg width="20" height="20" viewBox="0 0 24 24" {...TRAZO}><path d="M6 12h12" /></svg>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-[color:var(--veta)] px-4 py-3 text-[color:var(--hueso-suave)]">
          <svg width="20" height="20" viewBox="0 0 24 24" {...TRAZO}><rect x="2.5" y="6" width="19" height="12" rx="3" /><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8" /></svg>
          {t("remote.type")}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-full bg-[color:var(--hueso)] px-5 py-3 font-medium text-[color:var(--noche)]">
          {t("remote.talk")}
          <svg width="20" height="20" viewBox="0 0 24 24" {...TRAZO}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
        </div>
      </div>
    </section>
  );
}
