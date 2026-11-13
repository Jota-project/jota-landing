"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Pantalla, type ControlTele } from "./Pantalla";
import { EscenaContesta, PasoContesta } from "./Contesta";
import { EscenaCompleta, PasoCompleta } from "./Completa";
import { alScroll, clamp, mezcla, ponSala, reduceMov, suave, teleBase, TELE, type Caja } from "./scroll";

// Pasos de cada escena, en pantallas recorridas desde que su sección llega a la línea de los rótulos (--rt): la escena
// cambia a la vez que su rótulo se queda bajo la tele.
const E2: [string, number][] = [["p1", 0.3], ["r1", 0.5], ["p2", 1.05], ["h2", 1.2], ["r2", 1.4], ["cena", 1.5]];
const E3: [string, number][] = [["herr", 1.3], ["abre", 1.55], ["p3", 1.8], ["r3", 1.95]];

/*
 * Bloques 1 a 3 · una sola tele fija. La sala de la portada hace zoom hasta que su tele queda como escenario (arriba,
 * con sitio debajo para los rótulos), y en ella pasan las escenas 2 (la serie) y 3 (la pasada y la receta).
 * Todo lo escribe un rAF de scroll: la sala por transform, y en la pista --z, --prog, --q2, --g, data-paso y data-e
 * (los pasos alcanzados), que el CSS convierte en transiciones (se redirigen solas si se vuelve atrás).
 * Con «reducir movimiento» no hay zoom (salta de la sala a la tele) y los pasos solo funden.
 */
export function Apertura() {
  const t = useTranslations("tv");
  const pista = useRef<HTMLDivElement>(null);
  const sala = useRef<HTMLDivElement>(null);
  const tele = useRef<ControlTele>(null);
  const anchoTele = useRef(1280);

  useEffect(() => {
    const p = pista.current!, c = sala.current!, esc = p.firstElementChild as HTMLElement;
    const pasos = [...p.querySelectorAll<HTMLElement>(":scope > .tv-paso")];
    const rotulos = pasos.map((s) => s.querySelector<HTMLElement>(".tv-rotulo")!);
    let W = 1, H = 1, vh = 1, u = 1, vw = 1, rt = 0, base: Caja = { x: 0, y: 0, w: 1 }, meta: Caja = base;
    let paso = 0, eventos = "";

    const mide = () => {
      vw = innerWidth; vh = esc.clientHeight; u = vw < 768 ? vh * 0.6 : vh; // igual que --u en tv.css
      W = c.offsetWidth; H = c.offsetHeight;
      const estrecho = vw < 768, g = estrecho ? 0 : 48, hueco = estrecho ? 175 : 215;
      const tw = Math.min(vw - 2 * g, ((vh - hueco - 40) * 16) / 9), th = (tw * 9) / 16;
      const ty = Math.max(estrecho ? 12 : 20, (vh - th - hueco) / 2), tx = (vw - tw) / 2;
      rt = ty + th + 28;
      base = teleBase(W, H, vw, vh); meta = { x: tx, y: ty, w: tw };
      anchoTele.current = tw * Math.min(devicePixelRatio, 2);
      for (const [k, v] of [["tx", tx], ["ty", ty], ["tw", tw], ["th", th], ["rt", rt]] as const) p.style.setProperty(`--${k}`, `${v.toFixed(1)}px`);
    };

    const pinta = () => {
      const reduce = reduceMov();
      const r = pasos.map((s) => s.getBoundingClientRect());
      // Zoom: el primer 60 % del bloque 1.
      const a = clamp(-r[0].top / Math.max(1, r[0].height - vh) / 0.6);
      const z = reduce ? (a > 0.5 ? 1 : 0) : suave(a);
      ponSala(c, W, H, mezcla(base, meta, z));
      const q = r.map((b) => (rt - b.top) / u);
      const nuevo = q[2] >= 0 ? 3 : q[1] >= 0 ? 2 : 1;
      const e = [...E2.filter(([, v]) => q[1] >= v), ...E3.filter(([, v]) => q[2] >= v)].map(([k]) => k).join(" ");
      const pr = p.getBoundingClientRect();
      p.style.setProperty("--z", z.toFixed(4));
      p.style.setProperty("--prog", clamp(-pr.top / Math.max(1, pr.height - vh)).toFixed(4));
      p.style.setProperty("--q2", clamp(q[1], 0, 2.4).toFixed(3));
      p.style.setProperty("--g", clamp(q[2] - 1.55, 0, 1.4).toFixed(3));
      // Cada rótulo se apaga justo antes de que su sección se lo lleve hacia arriba, por encima de la tele.
      r.forEach((b, i) => pasos[i].style.setProperty("--sal", clamp((b.bottom - rt - rotulos[i].offsetHeight) / (u * 0.25)).toFixed(3)));
      if (nuevo !== paso || e !== eventos) {
        if (nuevo === 3 && paso !== 3) tele.current?.habla();
        tele.current?.tapada(nuevo === 2 || (nuevo === 3 && e.includes("abre")));
        paso = nuevo; eventos = e;
        p.dataset.paso = String(nuevo); p.dataset.e = e;
      }
    };
    return alScroll(pinta, mide);
  }, []);

  const pos = { left: `${TELE.x * 100}%`, top: `${TELE.y * 100}%`, width: `${TELE.w * 100}%`, height: `${TELE.h * 100}%` };
  return (
    <div ref={pista} className="tv-pista" data-paso="1">
      <div className="tv-escenario">
        <div ref={sala} className="tv-sala">
          {/* eslint-disable-next-line @next/next/no-img-element -- fotograma fijo de la secuencia, ya en AVIF a su tamaño */}
          <img src="/lab/secuencia/v6/1920/f_000.avif" alt="" fetchPriority="high" className="absolute inset-0 h-full w-full" />
          <div className="tv-velo" aria-hidden />
          <div className="absolute" style={pos}>
            <Pantalla controlRef={tele} label={t("s1.caption")} ancho={() => anchoTele.current} className="tv-sin-marco h-full" />
          </div>
        </div>
        <div className="tv-capa" aria-hidden>
          <EscenaContesta />
          <EscenaCompleta />
          <i className="tv-regla" />
        </div>
      </div>

      <section id="s1" aria-labelledby="tv-t-s1" className="tv-paso tv-paso-1">
        <div className="tv-portada"><div className="f-ancho">
          <h1 id="tv-t-s1" className="font-display text-[clamp(34px,6vw,76px)] leading-[1.02] tracking-[-0.035em]">{t("s1.headline")}</h1>
          <p className="tv-sigue mt-4 max-w-[36ch] text-[clamp(17px,1.6vw,21px)] leading-[1.45] text-[color:var(--hueso)]">{t("s1.subhead")}</p>
        </div></div>
        <div className="tv-rotulo"><p className="text-[clamp(17px,1.4vw,20px)] text-[color:var(--hueso)]">{t("s1.caption")}</p></div>
      </section>
      <PasoContesta />
      <PasoCompleta />
    </div>
  );
}
