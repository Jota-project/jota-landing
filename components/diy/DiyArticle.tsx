import { Link } from "@/i18n/navigation";
import type { ArticleContent } from "./content/article.es";
import { DiyArticleBehavior } from "./DiyArticleBehavior";

// Markup fijo y propio (content/article.*), no entrada de usuarios. display:contents para que el envoltorio
// no cambie la maquetación ni los selectores del CSS portado.
const Html = ({ html }: { html: string }) => <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;

// Miga «Jota / DIY»: forma parte del texto (arriba en móvil, en el escenario desde 960px). Sin el monograma: ya está en la Nav.
const Crumb = () => (
  <div className="brand">
    <Link className="brand-home" href="/">Jota</Link>
    <span className="brand-sep" aria-hidden="true">/</span>
    <Link className="brand-diy" href="/diy">DIY</Link>
  </div>
);

/** /diy/como-esta-hecho-jota: escenario sticky con el diagrama (≥960px) o tira con forma de hub, y columna de lectura. */
export function DiyArticle({ c }: { c: ArticleContent }) {
  return (
    <div className="diy diy-article">
      <a className="skip" href="#texto">{c.skip}</a>
      <span className="sr-only" id="live" aria-live="polite" />
      <div className="layout">
        <main className="read" id="texto" tabIndex={-1}>
          <div className="m-top"><Crumb /></div>
          <Html html={c.head} />
          <div className="col">
            <Html html={c.col} />
            <section data-state="siguientes" id="siguientes" className="next">
              <Html html={c.next} />
              <p>{c.whatIs[0]}<Link href="/">{c.whatIs[1]}</Link>{c.whatIs[2]}</p>
              <Html html={c.log} />
            </section>
            <div className="foot">
              <Link href="/diy">
                <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                  <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c.back}
              </Link>
            </div>
          </div>
        </main>
        <aside className="stage" aria-label={c.stageLabel}>
          <Crumb />
          <Html html={c.stage} />
        </aside>
      </div>
      <DiyArticleBehavior script={c.script} />
    </div>
  );
}
