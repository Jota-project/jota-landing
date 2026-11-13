import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { IndiceContenido } from "@/content/fogar/diy/indice.es";
import { PORTADA, PROBADO } from "@/content/fogar/diy/entrada";
import { INSTALL, REPOS } from "@/lib/repos";
import { esNueva } from "@/content/fogar/diy/nuevo";
import { Comando } from "./Comando";
import { Ficha } from "./Ficha";
import "./diy.css";

/** Portada de /diy: instalación en un paso arriba y una ficha por entrada (con una sola, sin filtros). */
export async function Indice({ c }: { c: IndiceContenido }) {
  const t = await getTranslations("diy.indice");
  const tNuevo = await getTranslations("diy");
  const hilo = (await getTranslations("diy.articulo.hilo")).raw("nodos") as { n: string }[];
  const nodos = [hilo[0].n, hilo[1].n, hilo[3].n]; // cliente, gateway, orquestador
  const fila = "grid grid-cols-[9.5rem_minmax(0,1fr)] gap-4 border-t border-[color:var(--veta)] py-3";

  return (
    <div className="diy f-ancho pb-24 pt-10 md:pt-16">
      <div>
        <p className="text-[15px] text-[color:var(--hueso-tenue)]">{t("seccion")}</p>
        <h1 id="contenido" tabIndex={-1} className="mt-4 max-w-[18ch] font-display text-[clamp(36px,6.4vw,84px)] leading-[1.02] tracking-[-0.035em] text-[color:var(--hueso)] [text-wrap:balance] md:mt-5">
          {t("h1")}
        </h1>
        <p className="mt-5 max-w-[46ch] text-[18px] leading-[1.5] text-[color:var(--hueso-suave)] md:mt-7 md:text-[19px]">{t("lede")}</p>
      </div>

      <section aria-labelledby="entradas" className="mt-8 md:mt-14">
        <h2 id="entradas" className="text-[13px] text-[color:var(--hueso-tenue)]">{t("entradas")}</h2>
        {c.entradas.map((e) => (
          <Ficha key={e.slug} portada={PORTADA} nodos={nodos}>
            <div className="flex flex-col">
              <p className="flex flex-wrap gap-x-3 text-[14px] text-[color:var(--hueso-tenue)]">
                {esNueva(e.iso) && <span className="rounded-full bg-[color:var(--hueso)] px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[color:var(--noche)]">{tNuevo("nuevo")}</span>}
                <span className="text-[color:var(--hueso)]">{e.tipo}</span>
                <span aria-hidden="true">·</span><time dateTime={e.iso}>{e.fecha}</time>
                <span aria-hidden="true">·</span><span>{e.lectura}</span>
                <span aria-hidden="true">·</span><span>{t("filas.dificultad")} {e.dificultad.toLowerCase()}</span>
              </p>
              <h3 className="mt-3 font-display text-[clamp(24px,2.8vw,34px)] leading-[1.12] tracking-[-0.035em] text-[color:var(--hueso)] [text-wrap:balance]">
                <Link href={`/diy/${e.slug}`} className="f-foco after:absolute after:inset-0 after:content-['']">{e.titulo}</Link>
              </h3>
              <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.55] text-[color:var(--hueso-suave)]">{e.resumen}</p>
              <dl className="mt-7 text-[14px] leading-[1.5]">
                <div className={fila}><dt className="text-[color:var(--hueso-tenue)]">{t("filas.estado")}</dt><dd>{e.estado}</dd></div>
                <div className={fila}><dt className="text-[color:var(--hueso-tenue)]">{t("filas.montar")}</dt><dd>{e.montar}</dd></div>
              </dl>
              {/* encima del enlace que cubre la ficha, para poder abrirlo */}
              <details className="relative z-10 border-t border-[color:var(--veta)] text-[14px] text-[color:var(--hueso-tenue)]">
                <summary className="f-foco inline-flex min-h-11 cursor-pointer items-center">{t("filas.probado")}&nbsp;<span className="text-[color:var(--hueso-suave)]">{PROBADO[0]}</span></summary>
                <ul className="grid gap-0.5 pb-3 pl-4 text-[color:var(--hueso-suave)]">{PROBADO.map((p) => <li key={p}>{p}</li>)}</ul>
              </details>
              <span className="leer mt-6 inline-flex items-center gap-2 text-[15px] text-[color:var(--hueso)]" aria-hidden="true">
                {t("leer")} <span className="flecha">→</span>
              </span>
            </div>
          </Ficha>
        ))}
      </section>

      <section aria-labelledby="instala" className="diy-instala mt-20">
          <h2 id="instala" className="font-display text-[clamp(22px,2.4vw,28px)] leading-[1.15] tracking-[-0.035em] text-[color:var(--hueso)]">{t("instala.titulo")}</h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[color:var(--hueso-suave)]">{t("instala.cuerpo")}</p>
          <Comando texto={INSTALL} copiar={t("instala.copiar")} copiado={t("instala.copiado")} linea />
          <h3 className="mt-6 text-[13px] text-[color:var(--hueso-tenue)]">{t("instala.requisitos")}</h3>
          <ul className="mt-2 grid gap-1.5 text-[15px] leading-[1.5] text-[color:var(--hueso)]">
            <li>{t("instala.linux")}</li>
            <li>{t("instala.openclaw")}</li>
          </ul>
          <p className="mt-5 text-[15px]">
            <a href={`${REPOS.gateway}#readme`} className="f-enlace f-foco text-[color:var(--hueso-suave)]">{t("instala.readme")}</a>
          </p>
      </section>

      <p className="mt-14 grid gap-2 border-t border-[color:var(--veta)] pt-6 text-[16px] leading-[1.55] text-[color:var(--hueso-suave)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-20">
        <strong className="font-semibold text-[color:var(--hueso)]">{t("regla.titulo")}</strong>
        <span className="max-w-[52ch]">{t("regla.cuerpo")}</span>
      </p>

    </div>
  );
}
