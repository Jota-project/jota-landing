import { getTranslations } from "next-intl/server";
import { REPOS } from "@/lib/repos";
import { bloque, h2, sub } from "./comun";

/** Bloque 6: qué hace falta. Un esquema de cajas y líneas finas (con su texto alternativo) y cómo se instala hoy. */
export async function Montaje() {
  const t = await getTranslations("tv.s6");
  const nodo = (k: "pc" | "tv" | "phone") => <div className="tv-nodo text-center">{t(k)}</div>;
  const hiloH = (texto?: string) => (
    <div className="relative mx-1 flex min-w-8 items-center sm:min-w-20">
      <div className="tv-hilo h-px w-full" />
      {texto && <span className="absolute inset-x-0 -top-6 text-center text-[13px] text-[color:var(--hueso-suave)]">{texto}</span>}
    </div>
  );
  return (
    <section id="s6" aria-labelledby="tv-t-s6" className={`${bloque} grid gap-14 md:grid-cols-2 md:items-center md:gap-20`}>
      <div>
        <h2 id="tv-t-s6" className={h2}>{t("line1")}</h2>
        <p className={sub}>{t("line2")}</p>
        <p className={sub}>{t.rich("soon", { readme: (c) => <a href={`${REPOS.tv}#readme`} className="f-enlace f-foco text-[color:var(--hueso)]">{c}</a> })}</p>
        <p className={sub}>{t("network")}</p>
      </div>
      <div role="img" aria-label={t("alt")} className="grid grid-cols-[1fr_auto_1fr] text-[14px] sm:text-[15px]">
        {nodo("pc")}
        {hiloH(t("hdmi"))}
        {nodo("tv")}
        <div className="flex h-12 justify-center"><div className="tv-hilo w-px" /></div>
        <div />
        <div />
        <div className="tv-nodo">
          <p className="text-center font-medium">{t("gateway")}</p>
          <p className="mt-2 flex flex-wrap justify-center gap-x-2 text-[12px] text-[color:var(--hueso-suave)] sm:text-[13px]">
            <span>{t("listen")}</span><span aria-hidden>·</span><span>{t("think")}</span><span aria-hidden>·</span><span>{t("answer")}</span>
          </p>
        </div>
        {hiloH()}
        <div className="self-center">{nodo("phone")}</div>
      </div>
    </section>
  );
}
