"use client";

import { useEffect } from "react";
import type { IndexContent } from "./content/index.es";

type SMIL = SVGElement & { beginElement?: () => void };

/** Filtros de /diy y el orbe de la miniatura. Port del JS del artefacto (sin la barra ni el copiar correo, que ya no están). */
export function DiyIndexBehavior({ count }: { count: IndexContent["count"] }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".diy-index");
    if (!root) return;
    const ac = new AbortController();
    const on = { signal: ac.signal };
    const timeouts = new Set<number>();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;

    const sheets = [...root.querySelectorAll<HTMLElement>(".sheet")];
    const list = $("#entradas"), empty = $("#empty"), countEl = $("#count");
    const chips = [...root.querySelectorAll<HTMLElement>(".chip")];
    const state: Record<string, string> = { status: "", tag: "" };
    function apply() {
      let n = 0;
      sheets.forEach((s) => {
        const ok = (!state.status || s.dataset.status === state.status) && (!state.tag || s.dataset.tags!.split(" ").includes(state.tag));
        s.hidden = !ok;
        if (ok) n++;
      });
      empty.hidden = n > 0;
      countEl.textContent = n === 1 ? count.one : count.many.replace("{n}", String(n));
      chips.forEach((c) => c.setAttribute("aria-pressed", String(state[c.dataset.f!] === c.dataset.v)));
    }
    function set(f: string, v: string, after?: () => void) {
      state[f] = v;
      const done = () => { apply(); after?.(); };
      if (reduce.matches) { done(); return; }
      list.classList.add("fading");
      const id = window.setTimeout(() => { timeouts.delete(id); done(); list.classList.remove("fading"); }, 160);
      timeouts.add(id);
    }
    const filters = $(".filters");
    filters.addEventListener("click", (e) => { const c = (e.target as Element).closest<HTMLElement>(".chip"); if (c) set(c.dataset.f!, c.dataset.v!); }, on);
    // el chip con foco siempre a la vista, aunque la fila haga scroll
    filters.addEventListener("focusin", (e) => { const t = e.target as HTMLElement; if (t.classList.contains("chip")) t.scrollIntoView({ block: "nearest", inline: "nearest" }); }, on);
    $("#clear").addEventListener("click", () => { state.status = ""; set("tag", "", () => $<HTMLElement>('.chip[data-f="status"]').focus()); }, on);

    // el orbe de la miniatura recorre cliente → gateway → orquestador
    const sheet = sheets[0], link = sheet?.querySelector<HTMLElement>("h2 a");
    const fwd = root.querySelector<SMIL>("#diy-fwd"), back = root.querySelector<SMIL>("#diy-back"), fwdM = root.querySelector<SMIL>("#diy-fwd-m");
    let io: IntersectionObserver | undefined;
    if (sheet && link && fwd?.beginElement && back && fwdM) {
      let inside = false;
      const enter = (e: PointerEvent) => { if (inside || (e.pointerType && e.pointerType !== "mouse") || reduce.matches) return; inside = true; fwd.beginElement!(); };
      const leave = (e: PointerEvent) => { if (!inside || sheet.contains(e.relatedTarget as Node)) return; inside = false; if (!reduce.matches) back.beginElement!(); };
      [sheet, link].forEach((el) => { el.addEventListener("pointerover", enter, on); el.addEventListener("pointerout", leave, on); });
      link.addEventListener("focus", () => { if (!reduce.matches && !inside) { inside = true; fwd.beginElement!(); } }, on);
      link.addEventListener("blur", () => { if (inside) { inside = false; if (!reduce.matches) back.beginElement!(); } }, on);
      // en pantallas táctiles, el recorrido se ve una vez cuando la ficha entra en pantalla
      if (matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
        const cov = sheet.querySelector(".cover")!;
        io = new IntersectionObserver((es) => es.forEach((en) => {
          if (en.isIntersecting && !reduce.matches) {
            (getComputedStyle(cov.querySelector(".m")!).display !== "none" ? fwdM : fwd).beginElement!();
            io!.disconnect();
          }
        }), { threshold: 0.6 });
        io.observe(cov);
      }
    }

    return () => { ac.abort(); timeouts.forEach(clearTimeout); io?.disconnect(); };
  }, [count]);

  return null;
}
