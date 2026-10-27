import { Link } from "@/i18n/navigation";
import type { IndexContent } from "./content/index.es";
import { DiyIndexBehavior } from "./DiyIndexBehavior";

type Cover = IndexContent["entries"][number]["cover"];

// Miniatura de la ficha: escritorio (.d) y móvil (.m). El orbe recorre cliente → gateway → orquestador al pasar por encima.
// shortcut: los ids del SVG (diy-fwd, diy-route…) son únicos mientras haya una sola entrada; con más, habrá que sufijarlos.
const cover = (c: Cover) => `
<svg class="d" viewBox="0 4 600 208">
  <defs><radialGradient id="diy-og" cx="32%" cy="30%" r="75%"><stop offset="0" stop-color="#A99AD1"/><stop offset=".46" stop-color="#7C6AAE"/><stop offset="1" stop-color="#6E8CC4"/></radialGradient>
  <filter id="diy-glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="5"/></filter></defs>
  <path class="w" d="M136 108 H214"/>
  <path class="w" d="M352 100 C390 100 390 34 428 34"/>
  <path class="w" d="M352 108 H428"/>
  <path class="w" d="M352 116 C390 116 390 182 428 182"/>
  <g class="n"><rect x="8" y="84" width="128" height="48" rx="14"/><text x="24" y="114">${c.client}</text></g>
  <g class="n hub"><rect x="214" y="84" width="138" height="48" rx="14"/><text x="230" y="114">${c.gateway}</text></g>
  <g class="n"><rect x="428" y="12" width="164" height="44" rx="14"/><text x="444" y="40">${c.stt}</text></g>
  <g class="n"><rect x="428" y="86" width="164" height="44" rx="14"/><text x="444" y="114">${c.brain}</text></g>
  <g class="n"><rect x="428" y="160" width="164" height="44" rx="14"/><text x="444" y="188">${c.tts}</text></g>
  <path id="diy-route" d="M150 108 H214 L352 108 H418" fill="none"/>
  <g>
    <animateMotion begin="0s" dur="1ms" fill="freeze" calcMode="linear" keyPoints="0;0" keyTimes="0;1"><mpath href="#diy-route"/></animateMotion>
    <circle r="13" fill="#7C6AAE" opacity=".45" filter="url(#diy-glow)"/>
    <circle r="11" fill="url(#diy-og)"/>
    <animateMotion id="diy-fwd" begin="indefinite" dur="0.7s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.77 0 0.175 1"><mpath href="#diy-route"/></animateMotion>
    <animateMotion id="diy-back" begin="indefinite" dur="0.45s" fill="freeze" calcMode="spline" keyPoints="1;0" keyTimes="0;1" keySplines="0.23 1 0.32 1"><mpath href="#diy-route"/></animateMotion>
  </g>
</svg>
<svg class="m" viewBox="0 0 340 112">
  <defs><radialGradient id="diy-ogm" cx="32%" cy="30%" r="75%"><stop offset="0" stop-color="#A99AD1"/><stop offset=".46" stop-color="#7C6AAE"/><stop offset="1" stop-color="#6E8CC4"/></radialGradient>
  <filter id="diy-glowm" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="4"/></filter></defs>
  <path class="w" d="M96 56 H128"/><path class="w" d="M222 56 H254"/>
  <g class="n"><rect x="4" y="34" width="92" height="44" rx="13"/><text x="16" y="61">${c.client}</text></g>
  <g class="n hub"><rect x="128" y="34" width="94" height="44" rx="13"/><text x="140" y="61">${c.gateway}</text></g>
  <g class="n"><rect x="254" y="34" width="82" height="44" rx="13"/><text x="264" y="61">${c.brainShort}</text></g>
  <path id="diy-route-m" d="M112 56 H128 L222 56 H238" fill="none"/>
  <g>
    <animateMotion begin="0s" dur="1ms" fill="freeze" calcMode="linear" keyPoints="0;0" keyTimes="0;1"><mpath href="#diy-route-m"/></animateMotion>
    <circle r="11" fill="#7C6AAE" opacity=".45" filter="url(#diy-glowm)"/><circle r="9" fill="url(#diy-ogm)"/>
    <animateMotion id="diy-fwd-m" begin="indefinite" dur="0.8s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.77 0 0.175 1"><mpath href="#diy-route-m"/></animateMotion>
  </g>
</svg>`;

const Arrow = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Portada de /diy: titular, filtros (Estado, Tema) y una ficha por entrada. */
export function DiyIndex({ c }: { c: IndexContent }) {
  // filtros solo con lo que existe: no se ofrece nada que lleve a cero
  const uniq = (a: string[]) => [...new Set(a)];
  const statuses = uniq(c.entries.map((e) => e.status));
  const tags = uniq(c.entries.flatMap((e) => e.tags));
  const n = c.entries.length;
  const chip = (f: string, v: string, label: string) => (
    <button key={v} className="chip" type="button" data-f={f} data-v={v} aria-pressed={v === ""}>
      {label}
    </button>
  );

  return (
    <div className="diy diy-index">
      <a className="skip" href="#entradas">{c.skip}</a>
      <main id="top" className="wrap">
        <header className="head">
          <div>
            <h1>{c.h1[0]}<em>{c.h1[1]}</em>{c.h1[2]}</h1>
            <p className="lede">{c.lede}</p>
          </div>
          <p className="rule"><strong>{c.rule[0]}</strong>{c.rule[1]}</p>
        </header>

        <div className="filters" role="group" aria-label={c.filters}>
          <div className="group">
            <span id="lbl-estado">{c.statusLabel}</span>
            <div className="chips" role="group" aria-labelledby="lbl-estado" id="status-chips">
              {chip("status", "", c.allStatus)}
              {statuses.map((v) => chip("status", v, c.status[v] || v))}
            </div>
          </div>
          <div className="group">
            <span id="lbl-tema">{c.tagLabel}</span>
            <div className="chips" role="group" aria-labelledby="lbl-tema" id="tag-chips">
              {chip("tag", "", c.allTags)}
              {tags.map((v) => chip("tag", v, c.tag[v] || v))}
            </div>
          </div>
          <span className="count" id="count" aria-live="polite">
            {n === 1 ? c.count.one : c.count.many.replace("{n}", String(n))}
          </span>
        </div>

        <section className="list" id="entradas" aria-label={c.listLabel} tabIndex={-1}>
          {c.entries.map((e) => (
            <article key={e.slug} className="sheet" data-status={e.status} data-tags={e.tags.join(" ")}>
              <div className="sheet-main">
                <figure className="cover" aria-hidden="true" dangerouslySetInnerHTML={{ __html: cover(e.cover) }} />
                <h2><Link href={`/diy/${e.slug}`}>{e.title}</Link></h2>
                <p className="quick">
                  <span className="m-only"><span className="stamp">{e.stamp}</span></span>
                  <span className="m-only">{c.rows.difficulty}{" "}<span>{e.difficulty}</span></span>
                  <span className="m-only">{e.reading}</span>
                  <b>{e.kind}</b>
                  <time dateTime={e.date[0]}>{e.date[1]}</time>
                </p>
                <p className="sum">{e.summary}</p>
                <ul className="tags" aria-label={c.tagsLabel}>
                  {e.tags.map((t) => <li key={t}>{c.tag[t] || t}</li>)}
                </ul>
                <span className="go">{c.go} <Arrow /></span>
              </div>
              <dl className="data">
                <div><dt>{c.rows.status}</dt><dd><span className="stamp">{e.stamp}</span></dd></div>
                <div><dt>{c.rows.difficulty}</dt><dd>{e.difficulty}</dd></div>
                <div><dt>{c.rows.reading}</dt><dd>{e.reading}</dd></div>
                <div><dt>{c.rows.build}</dt><dd>{e.build}</dd></div>
                <div><dt>{c.rows.tested}</dt><dd><ul>{e.tested.map((t) => <li key={t}>{t}</li>)}</ul></dd></div>
              </dl>
            </article>
          ))}
          <div className="empty" id="empty" hidden>
            <p>{c.empty}</p>
            <button className="btn btn-ghost" type="button" id="clear">{c.clear}</button>
          </div>
        </section>
      </main>
      <DiyIndexBehavior count={c.count} />
    </div>
  );
}
