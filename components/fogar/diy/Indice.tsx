import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Copiar } from "@/components/fogar/sitio/Copiar";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import type { IndiceContenido } from "@/content/fogar/diy/indice.es";
import { FECHA, PORTADA, PROBADO } from "@/content/fogar/diy/entrada";
import { INSTALL, REPOS } from "@/lib/repos";
import { TINTA } from "./tinta";
import "./diy.css";

/** Portada de /diy: instalación en un paso arriba y una ficha por entrada (con una sola, sin filtros). */
export async function Indice({ c }: { c: IndiceContenido }) {
  const t = await getTranslations("diy.indice");
  const fila = "grid grid-cols-[9.5rem_minmax(0,1fr)] gap-4 border-t border-[color:var(--veta)] py-3";

  return (
    <div className="diy f-ancho pb-24 pt-10 md:pt-16">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
        <div>
          <p className="text-[15px] text-[color:var(--hueso-tenue)]">{t("seccion")}</p>
          <h1 className="mt-5 max-w-[14ch] font-display text-[clamp(40px,6.4vw,84px)] leading-[1.02] tracking-[-0.035em] text-[color:var(--hueso)] [text-wrap:balance]">
            {t("h1")}
          </h1>
          <p className="mt-7 max-w-[46ch] text-[19px] leading-[1.55] text-[color:var(--hueso-suave)]">{t("lede")}</p>
        </div>

        <section aria-labelledby="instala" className="rounded-[var(--radio-vidrio)] border border-[color:var(--veta)] bg-[color:var(--piedra)] p-6 md:p-8">
          <h2 id="instala" className="font-display text-[clamp(22px,2.4vw,28px)] leading-[1.15] tracking-[-0.035em] text-[color:var(--hueso)]">{t("instala.titulo")}</h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[color:var(--hueso-suave)]">{t("instala.cuerpo")}</p>
          <div className="mt-5 flex flex-col gap-4 rounded-[var(--radio-bloque)] bg-[color:var(--noche)] p-4">
            <pre className="diy-comando m-0 min-w-0 select-all text-[14px] leading-[1.6] text-[color:var(--hueso)]">
              <code>{INSTALL}</code>
            </pre>
            <Copiar texto={INSTALL} label={t("instala.copiar")} hecho={t("instala.copiado")} className="shrink-0 self-start" />
          </div>
          <h3 className="mt-6 text-[13px] text-[color:var(--hueso-tenue)]">{t("instala.requisitos")}</h3>
          <ul className="mt-2 grid gap-1.5 text-[15px] leading-[1.5] text-[color:var(--hueso)]">
            <li>{t("instala.linux")}</li>
            <li>{t("instala.openclaw")}</li>
          </ul>
          <p className="mt-5 text-[15px]">
            <a href={`${REPOS.gateway}#readme`} className="f-enlace f-foco text-[color:var(--hueso-suave)]">{t("instala.readme")}</a>
          </p>
        </section>
      </div>

      <p className="mt-20 grid gap-2 border-t border-[color:var(--veta)] pt-6 text-[16px] leading-[1.55] text-[color:var(--hueso-suave)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-20">
        <strong className="font-semibold text-[color:var(--hueso)]">{t("regla.titulo")}</strong>
        <span className="max-w-[52ch]">{t("regla.cuerpo")}</span>
      </p>

      <section aria-labelledby="entradas" className="mt-24">
        <h2 id="entradas" className="text-[13px] text-[color:var(--hueso-tenue)]">{t("entradas")}</h2>
        {c.entradas.map((e) => (
          <article key={e.slug} className="group relative mt-5 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-14">
            <figure className="relative aspect-[16/10] overflow-hidden rounded-[var(--radio-vidrio)] bg-[color:var(--piedra)]">
              <Image src={PORTADA} alt="" fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,16,18,.55),transparent_45%)]" aria-hidden="true" />
              <div className="absolute left-[6%] top-[8%] w-[40%]" aria-hidden="true">
                <LineaViva estado="listen" tinta={TINTA} label="" />
              </div>
            </figure>
            <div className="flex flex-col">
              <p className="flex flex-wrap gap-x-3 text-[14px] text-[color:var(--hueso-tenue)]">
                <span className="text-[color:var(--hueso)]">{e.tipo}</span><span aria-hidden="true">·</span><time dateTime={FECHA}>{e.fecha}</time>
              </p>
              <h3 className="mt-3 font-display text-[clamp(24px,2.8vw,34px)] leading-[1.12] tracking-[-0.035em] text-[color:var(--hueso)] [text-wrap:balance]">
                <Link href={`/diy/${e.slug}`} className="f-foco after:absolute after:inset-0 after:content-['']">{e.titulo}</Link>
              </h3>
              <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.55] text-[color:var(--hueso-suave)]">{e.resumen}</p>
              <dl className="mt-7 text-[14px] leading-[1.5]">
                <div className={fila}><dt className="text-[color:var(--hueso-tenue)]">{t("filas.estado")}</dt><dd>{e.estado}</dd></div>
                <div className={fila}><dt className="text-[color:var(--hueso-tenue)]">{t("filas.dificultad")}</dt><dd>{e.dificultad}</dd></div>
                <div className={fila}><dt className="text-[color:var(--hueso-tenue)]">{t("filas.lectura")}</dt><dd>{e.lectura}</dd></div>
                <div className={fila}><dt className="text-[color:var(--hueso-tenue)]">{t("filas.montar")}</dt><dd>{e.montar}</dd></div>
                <div className={fila}>
                  <dt className="text-[color:var(--hueso-tenue)]">{t("filas.probado")}</dt>
                  <dd><ul className="grid gap-0.5">{PROBADO.map((p) => <li key={p}>{p}</li>)}</ul></dd>
                </div>
              </dl>
              <span className="mt-6 inline-flex items-center gap-2 text-[15px] text-[color:var(--hueso)]" aria-hidden="true">
                {t("leer")} <span className="transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none">→</span>
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
