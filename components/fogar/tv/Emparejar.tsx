import { getTranslations } from "next-intl/server";
import { bloque, h2, sub } from "./comun";

const CODIGO = "4821"; // el de ejemplo de la página antigua

/*
 * Bloque 5: emparejamiento con un código en la tele y los tres papeles. Pendiente de Sito («el móvil no se trata»):
 * se quita borrando su línea en page.tsx.
 */
export async function Emparejar() {
  const t = await getTranslations("tv");
  return (
    <section id="s5" aria-labelledby="tv-t-s5" className={`${bloque} grid items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20`}>
      <div>
        <h2 id="tv-t-s5" className={h2}>{t("s5.caption1")}</h2>
        <p className={sub}>{t("s5.caption2")}</p>
        <ul className="mt-10 max-w-[420px] text-[16px]">
          {(["admin", "member", "guest"] as const).map((k) => (
            <li key={k} className="flex min-h-12 items-center justify-between gap-4 border-t border-[color:var(--veta)] py-3 last:border-b">
              <span>{t(`s5.${k}`)}</span>
              {k === "guest" && <span className="text-[14px] text-[color:var(--hueso-suave)]">{t("s5.guestExpiry")}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div role="img" aria-label={`${t("tv.pairTitle")}: ${CODIGO}. ${t("tv.pairHint")}.`} className="tv-marco tv-txt grid place-items-center">
        <div className="text-center">
          <p className="text-[color:var(--hueso-suave)]">{t("tv.pairTitle")}</p>
          <p className="mt-[2cqw] flex justify-center gap-[1.4cqw] font-display text-[3.6em] leading-none tracking-[-0.02em]">
            {CODIGO.split("").map((d, i) => <span key={i} className="grid w-[1.15em] place-items-center rounded-[1.2cqw] border border-[color:var(--veta)] py-[.25em]">{d}</span>)}
          </p>
          <p className="mt-[2cqw] text-[color:var(--hueso-suave)]">{t("tv.pairHint")}</p>
          <p className="mx-auto mt-[3cqw] inline-flex items-center gap-[.8cqw] rounded-full border border-[color:var(--veta)] px-[1.6cqw] py-[.7cqw]">
            <svg viewBox="0 0 24 24" className="size-[1.2em]" fill="none" stroke="var(--contra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {t("s5.paired")}
          </p>
        </div>
      </div>
    </section>
  );
}
