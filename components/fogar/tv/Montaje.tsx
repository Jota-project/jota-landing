import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { REPOS } from "@/lib/repos";
import { bloque, h2, sub } from "./comun";
import { Progreso } from "./Progreso";

/** Un cable del esquema que se dibuja con el scroll entre --a y --a+--w del progreso del esquema (pathLength = 1). */
function Cable({ a, w, vertical = false, pulso = false }: { a: number; w: number; vertical?: boolean; pulso?: boolean }) {
  const d = vertical ? "M1 0V100" : "M0 1H100";
  return (
    <svg viewBox={vertical ? "0 0 2 100" : "0 0 100 2"} preserveAspectRatio="none" className="tv-cable" style={{ "--a": a, "--w": w } as CSSProperties} aria-hidden>
      <path d={d} pathLength={1} className="tv-cable-base" />
      <path d={d} pathLength={1} className="tv-cable-traza" />
      {pulso && <path d={d} pathLength={1} className="tv-cable-pulso" />}
    </svg>
  );
}

/*
 * Bloque 6: qué hace falta. El esquema son cajas HTML (texto nítido a cualquier ancho) unidas por cables SVG que se
 * dibujan con el scroll; cuando el HDMI acaba, un pulso de luz lo recorre hasta la tele. Con su texto alternativo.
 */
export async function Montaje() {
  const t = await getTranslations("tv.s6");
  const hiloH = (a: number, w: number, texto?: string, pulso?: boolean) => (
    <div className="relative mx-1 flex min-w-8 items-center sm:min-w-20">
      <Cable a={a} w={w} pulso={pulso} />
      {texto && <span className="tv-rot-cable absolute inset-x-0 -top-6 text-center text-[13px] text-[color:var(--hueso-suave)]">{texto}</span>}
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
      <Progreso marcas={{ hdmi: 0.4, gw: 0.5, fin: 0.6 }} role="img" aria-label={t("alt")} className="tv-esquema grid grid-cols-[1fr_auto_1fr] text-[14px] sm:text-[15px]">
        <div className="tv-nodo text-center">{t("pc")}</div>
        {hiloH(0.24, 0.16, t("hdmi"), true)}
        <div className="tv-nodo tv-nodo-tele text-center">{t("tv")}</div>
        <div className="flex h-12 justify-center"><Cable vertical a={0.4} w={0.08} /></div>
        <div />
        <div />
        <div className="tv-nodo tv-nodo-gw">
          <p className="text-center font-medium">{t("gateway")}</p>
          <p className="mt-2 flex flex-wrap justify-center gap-x-2 text-[12px] text-[color:var(--hueso-suave)] sm:text-[13px]">
            <span className="tv-fase">{t("listen")}</span><span aria-hidden>·</span><span className="tv-fase">{t("think")}</span><span aria-hidden>·</span><span className="tv-fase">{t("answer")}</span>
          </p>
        </div>
        {hiloH(0.5, 0.1)}
        <div className="self-center"><div className="tv-nodo tv-nodo-movil text-center">{t("phone")}</div></div>
      </Progreso>
    </section>
  );
}
