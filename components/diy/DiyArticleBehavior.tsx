"use client";

import { useEffect } from "react";
import { trackNavOffset } from "./navOffset";
import type { ArticleContent } from "./content/article.es";

type Script = ArticleContent["script"];
type Text = { k: string; v?: string; type?: string; sub?: Record<string, string> };
type Shape = {
  at: string; act: string[]; rel: string[]; w: string[]; open?: string[];
  plain?: boolean; deco?: "wave" | "bars"; name?: Record<string, string>; go?: Record<string, string>;
};

// estado → pieza activa, relacionadas, cables y a dónde lleva cada pieza (los textos vienen de content/article.*)
const SHAPE: Record<string, Shape> = {
  resumen: { at: "cliente", act: [], rel: [], w: [] },
  s1: { at: "cliente", act: ["cliente"], rel: [], w: [], plain: true, deco: "wave" },
  s2: { at: "gateway", act: ["gateway"], rel: ["cliente"], w: ["cg"], plain: true, deco: "wave" },
  s3: { at: "transcripcion", act: ["transcripcion"], rel: ["gateway"], w: ["cg", "gt"] },
  s4: { at: "orquestador", act: ["orquestador"], rel: ["gateway"], w: ["cg", "go"], plain: true },
  s5: { at: "sintesis", act: ["sintesis"], rel: ["gateway", "cliente"], w: ["cg", "gs"], deco: "bars" },
  cortar: { at: "gateway", act: ["cliente", "gateway"], rel: [], w: ["cg"], plain: true },
  voice: { at: "cliente", act: ["cliente"], rel: [], w: [], plain: true },
  screen: { at: "cliente", act: ["cliente"], rel: ["gateway"], w: ["cg"], plain: true, name: { cliente: "Jota-Screen" }, go: { cliente: "tele" } },
  abierto: { at: "gateway", act: [], rel: [], open: ["cliente", "gateway", "transcripcion", "orquestador", "sintesis"], w: [], plain: true },
  hub: { at: "gateway", act: ["gateway"], rel: [], w: ["cg", "gt", "go", "gs"], plain: true },
  casa: { at: "gateway", act: [], rel: [], w: [], plain: true },
  ha: { at: "gateway", act: ["gateway", "sintesis"], rel: ["cliente"], w: ["cg", "gs"], plain: true, name: { cliente: "Home Assistant" }, go: { cliente: "home-assistant" } },
  limites: { at: "gateway", act: [], rel: ["cliente", "gateway"], w: ["cg"], plain: true },
  siguientes: { at: "cliente", act: [], rel: [], w: [] },
};
const DECO = {
  wave: '<span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>',
  bars: '<span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>',
};
const SEQ = ["s1", "s2", "s3", "s4", "s5"];
const TOC: Record<string, string> = {
  resumen: "resumen", "paso-1": "recorrido", "paso-2": "recorrido", "paso-3": "recorrido", "paso-4": "recorrido", "paso-5": "recorrido", cortar: "recorrido",
  "jota-voice": "jota-voice", tele: "tele", abierto: "abierto", "por-que": "por-que", casa: "casa", "home-assistant": "home-assistant", limites: "limites", siguientes: "siguientes",
};

/** Diagrama, orbe, tira móvil y «Reproducir el recorrido» de /diy/como-esta-hecho-jota. Port del JS del artefacto. */
export function DiyArticleBehavior({ script }: { script: Script }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".diy-article");
    if (!root) return;
    const ac = new AbortController();
    const untrackNav = trackNavOffset(root);
    const on = { signal: ac.signal };
    const timeouts = new Set<number>(), frames = new Set<number>();
    const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timeouts.delete(id); fn(); }, ms); timeouts.add(id); return id; };
    const frame = (fn: () => void) => { const id = requestAnimationFrame(() => { frames.delete(id); fn(); }); frames.add(id); };

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>("#" + id)!;
    const dia = $("dia"), orb = $("orb"), tk = $("tk"), tv = $("tv"), sk = $("sk"), sv = $("sv"), live = $("live");
    const playBtn = $("play"), playLabel = $("play-label"), splay = $("splay"), strip = $("strip"), smap = $("smap"), sorb = $("sorb");
    const nodes: Record<string, HTMLElement> = {};
    root.querySelectorAll<HTMLElement>(".dia .node").forEach((n) => (nodes[n.dataset.node!] = n));
    const stripBtns = [...root.querySelectorAll<HTMLElement>(".strip .sbtn")];
    const wires: Record<string, SVGPathElement> = {};
    root.querySelectorAll<SVGPathElement>(".wires .lit").forEach((w) => (wires[w.dataset.wire!] = w));
    const strip_q = new RegExp(`[${script.quotes}]`, "g");
    const texts = script.states as Record<string, Text>;
    const def = script.def as Record<string, string[]>;

    // el orbe viaja por los cables reales y cruza el gateway por encima de la tarjeta
    type Pt = [number, number];
    const VB = [600, 420], G0: Pt = [216, 207.5], GDOCK: Pt = [194, 207.5], CDOCK: Pt = [172, 207.5];
    const base: Record<string, SVGPathElement> = {};
    root.querySelectorAll<SVGPathElement>(".wires .base").forEach((w) => (base[w.dataset.base!] = w));
    // muestrea el cable y se detiene 24 unidades antes de la tarjeta, para que el orbe no la pise
    const sample = (id: string, n = 14) => {
      const w = base[id], L = w.getTotalLength() - 24, out: Pt[] = [];
      for (let i = 0; i <= n; i++) { const q = w.getPointAtLength((L * i) / n); out.push([q.x, q.y]); }
      return out;
    };
    const RIGHT: Record<string, string> = { transcripcion: "gt", orquestador: "go", sintesis: "gs" };
    const fromG0 = (id: string): Pt[] => {
      if (id === "gateway") return [GDOCK];
      if (id === "cliente") return [GDOCK, CDOCK];
      return [GDOCK, G0, ...sample(RIGHT[id])];
    };
    const route = (a: string, b: string) => {
      const pa = fromG0(a).slice().reverse(), pb = fromG0(b);
      if (RIGHT[a] && RIGHT[b]) return [...pa.slice(0, -2), ...pb.slice(2)];
      return [...pa, ...pb.slice(1)];
    };
    const toPx = ([x, y]: Pt): Pt => { const r = dia.getBoundingClientRect(); return [(x / VB[0]) * r.width, (y / VB[1]) * r.height]; };
    const tf = ([x, y]: Pt) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    const dock = (id: string) => { const pts = fromG0(id); return pts[pts.length - 1]; };
    let orbAt = "cliente", orbAnim: Animation | null = null;
    const placeOrb = () => { orb.style.transform = tf(toPx(dock(orbAt))); };
    const beat = () => { if (reduce.matches) return; orb.classList.remove("beat"); void orb.offsetWidth; orb.classList.add("beat"); };
    function moveOrb(to: string) {
      if (!dia.offsetParent) { orbAt = to; return; }
      if (to === orbAt) { placeOrb(); return; }
      const pts = route(orbAt, to).map(toPx);
      const from = getComputedStyle(orb).transform;
      orbAt = to;
      orbAnim?.cancel();
      orb.style.transform = tf(pts[pts.length - 1]);
      if (reduce.matches) return;
      const d = [0];
      for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const total = d[d.length - 1] || 1;
      const kf: Keyframe[] = pts.map((q, i) => ({ transform: tf(q), offset: d[i] / total }));
      if (from && from !== "none") kf[0].transform = from;
      orbAnim = orb.animate(kf, { duration: Math.min(700, Math.max(520, 360 + total * 0.6)), easing: "cubic-bezier(0.77,0,0.175,1)" });
      orbAnim.onfinish = beat;
    }

    // tira: el orbe pequeño viaja dentro de la pieza activa
    function moveStripOrb(id: string | undefined) {
      const btn = stripBtns.find((b) => b.dataset.node === id);
      if (!btn || !btn.offsetParent || strip.classList.contains("quiet")) { sorb.classList.remove("on"); return; }
      frame(() => {
        const r = btn.getBoundingClientRect(), m = smap.getBoundingClientRect();
        sorb.style.transform = `translate(${(r.left - m.left + 12).toFixed(1)}px, ${(r.top - m.top + r.height / 2).toFixed(1)}px)`;
        sorb.classList.add("on");
      });
    }

    let typing: number | undefined;
    function setText(elK: HTMLElement, elV: HTMLElement, st: Shape & Text & { v: string }, isStrip: boolean, k: string) {
      const apply = () => {
        elK.textContent = k;
        if (!isStrip) { elV.classList.toggle("plain", !!st.plain); clearInterval(typing); }
        if (st.type) {
          const full = st.type, words = full.replace(strip_q, "").split(" ");
          if (reduce.matches || isStrip) elV.textContent = full;
          else {
            let i = 0;
            elV.innerHTML = '<span><span class="t"></span><span class="caret"></span></span>';
            elV.firstChild!.insertBefore(document.createTextNode(script.open), elV.firstChild!.firstChild);
            const t = elV.querySelector(".t")!;
            typing = window.setInterval(() => { i++; t.textContent = words.slice(0, i).join(" "); if (i >= words.length) { clearInterval(typing); elV.textContent = full; } }, 170);
          }
        } else if (isStrip) elV.textContent = st.v;
        else { elV.innerHTML = (st.deco ? DECO[st.deco] : "") + "<span></span>"; elV.lastChild!.textContent = st.v; }
        frame(() => elV.classList.remove("swap"));
      };
      elV.classList.add("swap");
      later(apply, reduce.matches ? 0 : 140);
    }

    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    let current: string | null = null, playing = false;
    function setState(name: string) {
      if (name === current || !SHAPE[name]) return;
      current = name;
      const txt = texts[name];
      const st = { ...SHAPE[name], ...txt, v: txt.v ?? script.phrase };
      dia.dataset.state = name;
      for (const id in nodes) {
        const n = nodes[id];
        n.classList.toggle("is-active", st.act.includes(id));
        n.classList.toggle("is-related", st.rel.includes(id));
        n.classList.toggle("is-open", (st.open || []).includes(id));
        n.querySelector("b")!.textContent = st.name?.[id] || def[id][0];
        const sub = st.sub?.[id] || def[id][1];
        n.querySelector("small")!.innerHTML = esc(sub).replace(/(jota-[a-z]+)/g, '<span class="nb">$1</span>');
      }
      for (const id in wires) wires[id].classList.toggle("on", st.w.includes(id));
      const lead = st.act[0];
      strip.classList.toggle("quiet", !lead);
      stripBtns.forEach((b) => {
        const id = b.dataset.node!;
        b.classList.toggle("is-active", lead === id);
        b.classList.toggle("is-related", id !== lead && (st.act.includes(id) || st.rel.includes(id)));
      });
      const k = playing ? script.step.replace("{n}", String(SEQ.indexOf(name) + 1)) : st.k;
      moveOrb(st.at);
      moveStripOrb(lead);
      setText(tk, tv, st, false, k);
      setText(sk, sv, st, true, k);
      if (playing) live.textContent = k + ": " + (st.type || st.v).replace(strip_q, "");
    }

    // la sección cuyo inicio ha pasado la línea de lectura (40 % de la ventana) manda el estado
    const sections = [...root.querySelectorAll<HTMLElement>("section[data-state]")];
    const tocLinks = [...root.querySelectorAll<HTMLAnchorElement>(".contents a")];
    let scrollState = "resumen", ticking = false, playY = 0;
    function sync() {
      ticking = false;
      const line = innerHeight * 0.4;
      let sec: HTMLElement | null = null;
      for (const s of sections) { if (s.getBoundingClientRect().top <= line) sec = s; else break; }
      scrollState = sec ? sec.dataset.state! : "resumen";
      const here = sec ? TOC[sec.id] : null;
      tocLinks.forEach((a) => { a.removeAttribute("aria-current"); if (a.getAttribute("href") === "#" + here) a.setAttribute("aria-current", "true"); });
      if (playing && Math.abs(scrollY - playY) > 60) stop();
      if (!playing) setState(scrollState);
    }
    addEventListener("scroll", () => { if (!ticking) { ticking = true; frame(sync); } }, { passive: true, signal: ac.signal });

    // las piezas llevan al encabezado de su sección y el foco va detrás
    function go(id: string) {
      const sec = root!.querySelector<HTMLElement>("#" + id);
      if (!sec) return;
      const h = sec.matches("h2,h3") ? sec : sec.querySelector<HTMLElement>("h2,h3") || sec;
      stop();
      h.setAttribute("tabindex", "-1");
      h.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
      h.focus({ preventScroll: true });
    }
    root.querySelectorAll<HTMLElement>("[data-go]").forEach((b) => b.addEventListener("click", () => {
      const st = current ? SHAPE[current] : undefined;
      const node = b.dataset.node!;
      go(st?.go?.[node] && b.classList.contains("node") ? st.go[node] : b.dataset.go!);
    }, on));

    // reproducir el recorrido completo sin mover la página; el scroll del lector lo para
    let timer: number | undefined;
    const toggles = [playBtn, splay];
    function stop() {
      if (!playing) return;
      playing = false; clearTimeout(timer);
      toggles.forEach((t) => t.setAttribute("aria-pressed", "false"));
      playLabel.textContent = script.play; splay.setAttribute("aria-label", script.play);
      live.textContent = "";
      current = null; setState(scrollState);
    }
    function play() {
      playing = true; playY = scrollY;
      toggles.forEach((t) => t.setAttribute("aria-pressed", "true"));
      playLabel.textContent = script.stop; splay.setAttribute("aria-label", script.stopAria);
      let i = 0; current = null;
      const step = () => { if (!playing) return; if (i >= SEQ.length) { stop(); return; } setState(SEQ[i++]); timer = later(step, i === 3 ? 2300 : 1800); };
      step();
    }
    toggles.forEach((t) => t.addEventListener("click", () => (playing ? stop() : play()), on));

    addEventListener("resize", () => { orbAnim?.cancel(); placeOrb(); if (current) moveStripOrb(SHAPE[current].act[0]); }, { passive: true, signal: ac.signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, on);
    setState("resumen"); placeOrb(); sync();

    return () => {
      ac.abort();
      untrackNav();
      timeouts.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      clearInterval(typing);
      orbAnim?.cancel();
    };
  }, [script]);

  return null;
}
