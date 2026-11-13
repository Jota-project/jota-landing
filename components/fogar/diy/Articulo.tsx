import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ArticuloContenido } from "@/content/fogar/diy/articulo.es";
import { FECHA, PROBADO } from "@/content/fogar/diy/entrada";
import type { IndiceContenido } from "@/content/fogar/diy/indice.es";
import { INSTALL, PROTOCOLO, REPOS } from "@/lib/repos";
import { Casa } from "./Casa";
import { Comando } from "./Comando";
import { Escenario } from "./Escenario";
import { Hilo } from "./Hilo";
import "./diy.css";

// Markup fijo y propio (content/fogar/diy), no entrada de usuarios.
const Html = ({ html }: { html: string }) => <div className="contents" dangerouslySetInnerHTML={{ __html: html }} />;
const FIGURA: Record<string, ComponentType> = { resumen: Hilo, casa: Casa };

/**
 * /diy/como-esta-hecho-fogar: columna de lectura con un hilo en el margen que nace del titular y, al lado, el
 * escenario sticky (línea viva, mapa de piezas, recorrido e índice). Acaba en «Móntalo».
 */
export async function Articulo({ c, ficha }: { c: ArticuloContenido; ficha: IndiceContenido["entradas"][number] }) {
  const t = await getTranslations("diy.articulo");
  const ti = await getTranslations("diy.indice.instala");
  const items = c.secciones.map(({ id, toc }) => ({ id, toc }));
  const puertas = [
    { href: `${REPOS.gateway}#readme`, label: t("montalo.readme") },
    { href: PROTOCOLO, label: t("montalo.protocolo") },
    { href: REPOS.wakeTrainer, label: t("montalo.wake") },
  ];

  return (
    <div className="diy">
      <Escenario items={items}>
        <article className="min-w-0">
          <p className="text-[15px] text-[color:var(--hueso-tenue)]">
            <Link href="/diy" className="f-enlace f-foco">DIY</Link>
          </p>
          <h1 id="texto" tabIndex={-1} className="mt-5 max-w-[22ch] font-display text-[clamp(34px,5vw,60px)] leading-[1.04] tracking-[-0.035em] text-[color:var(--hueso)] [text-wrap:balance]">
            {c.h1}
          </h1>

          <div className="diy-cuerpo">
            <p className="flex flex-wrap gap-x-3 gap-y-1 pt-6 text-[14px] text-[color:var(--hueso-tenue)]">
              <span className="text-[color:var(--hueso)]">{ficha.tipo}</span>
              <span aria-hidden="true">·</span><span>{ficha.estado}</span>
              <span aria-hidden="true">·</span><span>{t("dificultad")} {ficha.dificultad.toLowerCase()}</span>
              <span aria-hidden="true">·</span><span>{ficha.lectura}</span>
              <span aria-hidden="true">·</span><time dateTime={FECHA}>{ficha.fecha}</time>
            </p>
            <details className="mt-3 text-[14px] text-[color:var(--hueso-tenue)]">
              <summary className="f-foco inline-flex min-h-11 cursor-pointer items-center">
                {t("probadoCon")}&nbsp;<span className="text-[color:var(--hueso-suave)]">{PROBADO[0]}</span>&nbsp;{t("piezasMas", { n: PROBADO.length - 1 })}
              </summary>
              <ul className="mt-1 grid gap-1 pl-4 text-[color:var(--hueso-suave)]">{PROBADO.map((p) => <li key={p}>{p}</li>)}</ul>
            </details>

            <div className="diy-prosa mt-10">
              <p className="text-[20px] leading-[1.6] text-[color:var(--hueso)]">{c.lede}</p>
              <p dangerouslySetInnerHTML={{ __html: c.antes }} />

              <nav aria-label={t("enEsta")} className="mt-8 border-y border-[color:var(--veta)] py-5 lg:hidden">
                <p className="mb-2 text-[13px] text-[color:var(--hueso-tenue)]">{t("enEsta")}</p>
                <ol className="grid gap-1 text-[16px]">
                  {items.map((i) => <li key={i.id}><a href={`#${i.id}`}>{i.toc}</a></li>)}
                </ol>
              </nav>

              {c.secciones.map((s) => {
                const [antes, despues] = s.html.split("<!--figura-->");
                const Figura = FIGURA[s.id];
                return (
                  <section key={s.id} id={s.id} data-estado={s.estado ?? "rest"}>
                    <Html html={antes} />
                    {Figura && despues !== undefined && <Figura />}
                    {despues && <Html html={despues} />}
                  </section>
                );
              })}

              <section id="montalo" data-estado="speak" aria-labelledby="montalo-h" className="diy-montalo">
                <h2 id="montalo-h">{t("montalo.titulo")}</h2>
                <p>{ti("cuerpo")}</p>
                <Comando texto={INSTALL} copiar={ti("copiar")} copiado={ti("copiado")} />
                <p className="requisitos">{ti("requisitos")}: {ti("linux")} {ti("openclaw")}</p>
                <h3 className="puertas-h">{t("montalo.puertas")}</h3>
                <ul className="puertas">
                  {puertas.map((p) => (
                    <li key={p.href}><a href={p.href} rel="noopener">{p.label}<span aria-hidden="true">→</span></a></li>
                  ))}
                </ul>
              </section>

              <p className="mt-12">{t.rich("queEs", { enlace: (txt) => <Link href="/">{txt}</Link> })}</p>

              <details className="diy-registro">
                <summary className="f-foco">{t("registro")}</summary>
                <ul>
                  {c.registro.map(([iso, fecha, texto]) => <li key={iso}><time dateTime={iso}>{fecha}</time> · {texto}</li>)}
                </ul>
              </details>

              <p className="mt-10">
                <Link href="/diy" className="inline-flex min-h-11 items-center gap-2">
                  <span aria-hidden="true">←</span>{t("volver")}
                </Link>
              </p>
            </div>
          </div>
        </article>
      </Escenario>
    </div>
  );
}
